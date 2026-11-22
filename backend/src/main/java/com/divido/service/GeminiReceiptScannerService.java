package com.divido.service;

import com.divido.config.GeminiProperties;
import com.divido.dto.TransactionCreateRequest;
import com.divido.dto.receipt.ConfidenceScores;
import com.divido.dto.receipt.ExpenseClassification;
import com.divido.dto.receipt.MerchantInfo;
import com.divido.dto.receipt.OcrResult;
import com.divido.dto.receipt.ReceiptItem;
import com.divido.dto.receipt.ReceiptQuality;
import com.divido.dto.receipt.ReceiptScanResponse;
import com.divido.dto.receipt.TransactionInfo;
import com.divido.entity.Category;
import com.divido.entity.TransactionType;
import com.divido.repository.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Communicates with the Google Gemini Text API to extract structured
 * financial details from OCR-extracted receipt text (Zero images sent to Gemini).
 * Validates arithmetic calculations and maps data into Divido transactions.
 */
@Service
public class GeminiReceiptScannerService {

    private static final Logger log = LoggerFactory.getLogger(GeminiReceiptScannerService.class);

    private final GeminiProperties geminiProperties;
    private final CategoryRepository categoryRepository;
    private final JsonMapper jsonMapper;
    private final HttpClient httpClient;

    public GeminiReceiptScannerService(GeminiProperties geminiProperties,
                                       CategoryRepository categoryRepository,
                                       JsonMapper jsonMapper) {
        this.geminiProperties = geminiProperties;
        this.categoryRepository = categoryRepository;
        this.jsonMapper = jsonMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(geminiProperties.getTimeout())
                .build();
    }

    /**
     * Text-only analysis: Takes the locally extracted OCR text and sends it to Gemini for semantic understanding.
     */
    public ReceiptScanResponse scanReceiptText(UUID userId, OcrResult ocrResult) {
        String apiKey = geminiProperties.getApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.error("Gemini API key is not configured in GEMINI_API_KEY environment variable.");
            return ReceiptScanResponse.failure("Gemini API key is not configured on the server. Please check environment settings.");
        }

        List<Category> usableCategories = categoryRepository.findUsableCategories(userId, true, null);
        List<String> categoryNames = usableCategories.stream().map(Category::getName).toList();

        String prompt = buildTextPrompt(categoryNames, ocrResult.rawText(), ocrResult.safeWarnings());
        String requestJson = buildTextOnlyGeminiRequest(prompt);

        // Robust model candidate selection: default to gemini-flash-lite-latest
        String configuredModel = geminiProperties.getModel();
        if (configuredModel == null || configuredModel.isBlank() || configuredModel.contains("2.5") || configuredModel.contains("3.8")) {
            configuredModel = "gemini-flash-lite-latest";
        }

        String[] candidateModels = {
                configuredModel,
                "gemini-flash-lite-latest"
        };

        HttpResponse<String> response = null;
        for (String model : candidateModels) {
            if (model == null || model.isBlank()) continue;
            try {
                response = executeGeminiRequest(model, apiKey, requestJson);
                if (response.statusCode() == 200) {
                    break;
                } else if (response.statusCode() == 503) {
                    log.warn("Gemini model {} returned 503 capacity limit. Retrying once after backoff...", model);
                    try {
                        Thread.sleep(1500);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    response = executeGeminiRequest(model, apiKey, requestJson);
                    if (response.statusCode() == 200) {
                        break;
                    }
                } else if (response.statusCode() == 429) {
                    log.warn("Gemini rate limit exceeded (HTTP 429).");
                    return ReceiptScanResponse.failure("Gemini API rate limit or quota exceeded. Please try again shortly.");
                } else {
                    log.warn("Gemini model {} returned status {}, attempting fallback model.", model, response.statusCode());
                }
            } catch (Exception e) {
                log.error("Failed to connect to Gemini API model {}: {}", model, e.getMessage());
            }
        }

        if (response == null || response.statusCode() != 200) {
            String errorMsg = response != null ? "Gemini API error (HTTP " + response.statusCode() + ")" : "Unable to reach Gemini API";
            return ReceiptScanResponse.failure(errorMsg);
        }

        try {
            return parseGeminiResponse(response.body(), usableCategories, ocrResult);
        } catch (Exception e) {
            log.error("Failed to parse Gemini receipt extraction response: {}", e.getMessage(), e);
            return ReceiptScanResponse.failure("Could not parse extracted receipt details. Please review manually.");
        }
    }

    /**
     * Backward-compatible entrypoint used in tests or legacy callers.
     */
    public ReceiptScanResponse scanReceipt(UUID userId, ReceiptImageProcessor.ProcessedReceiptImage processedImage) {
        // If caller uses ProcessedReceiptImage without local OCR, create simulated OcrResult
        OcrResult fallbackResult = new OcrResult(
                true,
                processedImage.isReadable(),
                85.0,
                "RECEIPT TEXT SUMMARY",
                List.of(),
                "eng",
                true,
                true,
                processedImage.warnings(),
                null
        );
        return scanReceiptText(userId, fallbackResult);
    }

    private HttpResponse<String> executeGeminiRequest(String model, String apiKey, String requestBody) throws IOException, InterruptedException {
        String url = String.format("%s/v1beta/models/%s:generateContent?key=%s",
                geminiProperties.getBaseUrl(), model, apiKey);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(geminiProperties.getTimeout())
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    /**
     * Constructs pure text payload for Gemini (Strictly NO inlineData image).
     */
    private String buildTextOnlyGeminiRequest(String prompt) {
        try {
            Map<String, Object> partText = Map.of("text", prompt);

            Map<String, Object> content = Map.of(
                    "role", "user",
                    "parts", List.of(partText)
            );

            Map<String, Object> generationConfig = Map.of(
                    "responseMimeType", "application/json",
                    "temperature", 0.1
            );

            Map<String, Object> root = Map.of(
                    "contents", List.of(content),
                    "generationConfig", generationConfig
            );

            return jsonMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize text-only Gemini request payload", e);
        }
    }

    private String buildTextPrompt(List<String> availableCategories, String rawOcrText, List<String> preWarnings) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert financial receipt semantic analyzer for Divido Personal Finance.\n");
        sb.append("Analyze the following OCR-extracted text from a receipt and extract structured financial details.\n\n");

        sb.append("AVAILABLE DIVIDO CATEGORIES:\n");
        sb.append(String.join(", ", availableCategories));
        sb.append("\n\n");

        sb.append("OCR EXTRACTED RECEIPT TEXT:\n");
        sb.append("```\n");
        sb.append(rawOcrText != null ? rawOcrText : "");
        sb.append("\n```\n\n");

        sb.append("INSTRUCTIONS:\n");
        sb.append("1. Extract merchant name, branch, address, contact.\n");
        sb.append("2. Extract transaction date (format: YYYY-MM-DD), time (HH:MM or null), and currency (default LKR or detected).\n");
        sb.append("3. Extract financial amounts: subtotal, discount, tax, serviceCharge, final total, amountPaid, change.\n");
        sb.append("4. Extract individual line items with name, quantity, unitPrice, and totalPrice.\n");
        sb.append("5. Distinguish item prices from subtotal, and cash tendered from the actual total expense.\n");
        sb.append("6. Suggest a short clear purpose (e.g. 'Grocery Shopping', 'Dinner with Friends', 'Fuel').\n");
        sb.append("7. Suggest the closest matching category from the available categories list.\n");
        sb.append("8. In uncertainFields, list any field names where OCR text was ambiguous (e.g. ['tax', 'date']).\n");
        sb.append("9. Return confidence scores between 0.0 and 1.0 based on text clarity.\n\n");

        sb.append("RETURN ONLY VALID JSON WITH THE EXACT STRUCTURE:\n");
        sb.append("{\n");
        sb.append("  \"merchant\": {\n");
        sb.append("    \"name\": \"...\",\n");
        sb.append("    \"branch\": null,\n");
        sb.append("    \"address\": null,\n");
        sb.append("    \"contact\": null\n");
        sb.append("  },\n");
        sb.append("  \"transaction\": {\n");
        sb.append("    \"date\": \"YYYY-MM-DD\",\n");
        sb.append("    \"time\": null,\n");
        sb.append("    \"currency\": \"LKR\",\n");
        sb.append("    \"subtotal\": 0.00,\n");
        sb.append("    \"discount\": 0.00,\n");
        sb.append("    \"tax\": 0.00,\n");
        sb.append("    \"serviceCharge\": 0.00,\n");
        sb.append("    \"total\": 0.00,\n");
        sb.append("    \"amountPaid\": 0.00,\n");
        sb.append("    \"change\": 0.00\n");
        sb.append("  },\n");
        sb.append("  \"items\": [\n");
        sb.append("    {\n");
        sb.append("      \"name\": \"...\",\n");
        sb.append("      \"quantity\": 1,\n");
        sb.append("      \"unitPrice\": 0.00,\n");
        sb.append("      \"totalPrice\": 0.00\n");
        sb.append("    }\n");
        sb.append("  ],\n");
        sb.append("  \"expense\": {\n");
        sb.append("    \"purpose\": \"...\",\n");
        sb.append("    \"suggestedCategory\": \"...\"\n");
        sb.append("  },\n");
        sb.append("  \"confidence\": {\n");
        sb.append("    \"merchant\": 0.95,\n");
        sb.append("    \"date\": 0.90,\n");
        sb.append("    \"total\": 0.98,\n");
        sb.append("    \"purpose\": 0.90\n");
        sb.append("  },\n");
        sb.append("  \"uncertainFields\": [],\n");
        sb.append("  \"warnings\": []\n");
        sb.append("}\n");

        return sb.toString();
    }

    private ReceiptScanResponse parseGeminiResponse(String responseBody,
                                                    List<Category> usableCategories,
                                                    OcrResult ocrResult) throws Exception {
        JsonNode rootNode = jsonMapper.readTree(responseBody);
        JsonNode candidate = rootNode.path("candidates").path(0);
        JsonNode textNode = candidate.path("content").path("parts").path(0).path("text");

        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            return ReceiptScanResponse.failure("Gemini returned an empty response. Receipt could not be scanned.");
        }

        String rawJson = textNode.asText().trim();
        if (rawJson.startsWith("```json")) {
            rawJson = rawJson.substring(7);
        } else if (rawJson.startsWith("```")) {
            rawJson = rawJson.substring(3);
        }
        if (rawJson.endsWith("```")) {
            rawJson = rawJson.substring(0, rawJson.length() - 3);
        }
        rawJson = rawJson.trim();

        JsonNode data = jsonMapper.readTree(rawJson);

        List<String> combinedWarnings = new ArrayList<>(ocrResult.safeWarnings());
        JsonNode warningsNode = data.path("warnings");
        if (warningsNode.isArray()) {
            for (JsonNode w : warningsNode) {
                String text = w.asText();
                if (!text.isBlank() && !combinedWarnings.contains(text)) {
                    combinedWarnings.add(text);
                }
            }
        }

        // Uncertain Fields
        List<String> uncertainFields = new ArrayList<>();
        JsonNode uncertainNode = data.path("uncertainFields");
        if (uncertainNode.isArray()) {
            for (JsonNode u : uncertainNode) {
                uncertainFields.add(u.asText());
            }
        }

        // Merchant
        JsonNode merchantNode = data.path("merchant");
        MerchantInfo merchant = new MerchantInfo(
                asNullableText(merchantNode.path("name")),
                asNullableText(merchantNode.path("branch")),
                asNullableText(merchantNode.path("address")),
                asNullableText(merchantNode.path("contact"))
        );

        // Transaction
        JsonNode txNode = data.path("transaction");
        LocalDate date = parseLocalDate(asNullableText(txNode.path("date")));
        if (date == null) {
            date = LocalDate.now();
            uncertainFields.add("date");
            combinedWarnings.add("Transaction date not clearly visible; defaulted to today.");
        }

        TransactionInfo transaction = new TransactionInfo(
                date,
                asNullableText(txNode.path("time")),
                txNode.path("currency").isMissingNode() ? "LKR" : txNode.path("currency").asText("LKR"),
                asBigDecimal(txNode.path("subtotal")),
                asBigDecimal(txNode.path("discount")),
                asBigDecimal(txNode.path("tax")),
                asBigDecimal(txNode.path("serviceCharge")),
                asBigDecimal(txNode.path("total")),
                asBigDecimal(txNode.path("amountPaid")),
                asBigDecimal(txNode.path("change"))
        );

        // Line Items
        List<ReceiptItem> items = new ArrayList<>();
        JsonNode itemsNode = data.path("items");
        if (itemsNode.isArray()) {
            for (JsonNode itemNode : itemsNode) {
                String name = asNullableText(itemNode.path("name"));
                if (name != null && !name.isBlank()) {
                    items.add(new ReceiptItem(
                            name,
                            itemNode.path("quantity").isInt() ? itemNode.path("quantity").asInt() : null,
                            asBigDecimal(itemNode.path("unitPrice")),
                            asBigDecimal(itemNode.path("totalPrice"))
                    ));
                }
            }
        }

        // Step 7: Backend Math Validation
        verifyCalculations(transaction, items, combinedWarnings);

        // Expense classification & category matching
        JsonNode expenseNode = data.path("expense");
        String purpose = asNullableText(expenseNode.path("purpose"));
        String suggestedCategory = asNullableText(expenseNode.path("suggestedCategory"));
        UUID matchedCategoryId = matchCategoryId(suggestedCategory, usableCategories);

        ExpenseClassification expense = new ExpenseClassification(
                purpose,
                suggestedCategory,
                matchedCategoryId
        );

        // Confidence
        JsonNode confNode = data.path("confidence");
        ConfidenceScores confidence = new ConfidenceScores(
                confNode.path("merchant").isNumber() ? confNode.path("merchant").asDouble() : null,
                confNode.path("date").isNumber() ? confNode.path("date").asDouble() : null,
                confNode.path("total").isNumber() ? confNode.path("total").asDouble() : null,
                confNode.path("purpose").isNumber() ? confNode.path("purpose").asDouble() : null
        );

        ReceiptQuality quality = new ReceiptQuality(ocrResult.isReadable(), false, combinedWarnings);

        // Step 8: Construct Mapped Divido Transaction
        TransactionCreateRequest mappedTransaction = buildMappedTransaction(merchant, transaction, items, expense, matchedCategoryId);

        return new ReceiptScanResponse(
                true,
                quality,
                merchant,
                transaction,
                items,
                expense,
                confidence,
                ocrResult.rawText(),
                uncertainFields,
                mappedTransaction
        );
    }

    /**
     * Step 7: Verifies that item totals match subtotal, and subtotal - discount + tax == total.
     * Flags warnings without modifying printed totals.
     */
    private void verifyCalculations(TransactionInfo transaction, List<ReceiptItem> items, List<String> warnings) {
        if (transaction == null) return;

        // Verify item sum vs subtotal
        if (transaction.subtotal() != null && !items.isEmpty()) {
            BigDecimal itemsSum = BigDecimal.ZERO;
            for (ReceiptItem item : items) {
                if (item.totalPrice() != null) {
                    itemsSum = itemsSum.add(item.totalPrice());
                }
            }
            if (itemsSum.compareTo(BigDecimal.ZERO) > 0 &&
                    itemsSum.subtract(transaction.subtotal()).abs().compareTo(new BigDecimal("0.50")) > 0) {
                warnings.add(String.format("Line items sum (%.2f) differs from printed subtotal (%.2f). Please verify.",
                        itemsSum, transaction.subtotal()));
            }
        }

        // Verify subtotal - discount + tax + serviceCharge vs final total
        if (transaction.subtotal() != null && transaction.total() != null) {
            BigDecimal subtotal = transaction.subtotal();
            BigDecimal discount = transaction.discount() != null ? transaction.discount() : BigDecimal.ZERO;
            BigDecimal tax = transaction.tax() != null ? transaction.tax() : BigDecimal.ZERO;
            BigDecimal serviceCharge = transaction.serviceCharge() != null ? transaction.serviceCharge() : BigDecimal.ZERO;

            BigDecimal calculatedTotal = subtotal.subtract(discount).add(tax).add(serviceCharge);
            if (calculatedTotal.subtract(transaction.total()).abs().compareTo(new BigDecimal("0.50")) > 0) {
                warnings.add(String.format("Calculated breakdown (%.2f) does not equal printed total (%.2f). Please check amounts.",
                        calculatedTotal, transaction.total()));
            }
        }
    }

    /**
     * Step 8: Maps extracted information into Divido's standard TransactionCreateRequest.
     */
    private TransactionCreateRequest buildMappedTransaction(MerchantInfo merchant,
                                                            TransactionInfo transaction,
                                                            List<ReceiptItem> items,
                                                            ExpenseClassification expense,
                                                            UUID matchedCategoryId) {
        String merchantName = merchant != null && merchant.name() != null ? merchant.name() : "";
        String purpose = expense != null && expense.purpose() != null ? expense.purpose() : "";

        String description;
        if (!items.isEmpty()) {
            List<String> topItems = items.stream().limit(3).map(ReceiptItem::name).toList();
            String itemsSummary = String.join(", ", topItems);
            description = !merchantName.isBlank() ? merchantName + " - " + itemsSummary : itemsSummary;
        } else if (!purpose.isBlank()) {
            description = !merchantName.isBlank() ? merchantName + " (" + purpose + ")" : purpose;
        } else {
            description = !merchantName.isBlank() ? merchantName : "Receipt expense";
        }

        BigDecimal amount = transaction != null && transaction.total() != null ? transaction.total() : BigDecimal.ZERO;
        LocalDate date = transaction != null && transaction.date() != null ? transaction.date() : LocalDate.now();

        return new TransactionCreateRequest(
                TransactionType.EXPENSE,
                amount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString(),
                date,
                matchedCategoryId,
                null, // incomeSourceId is null for expense
                description,
                "RECEIPT_SCAN"
        );
    }

    private UUID matchCategoryId(String suggestedName, List<Category> categories) {
        if (suggestedName == null || suggestedName.isBlank() || categories == null) {
            return null;
        }
        String clean = suggestedName.trim().toLowerCase();

        for (Category cat : categories) {
            if (cat.getName().trim().equalsIgnoreCase(clean)) {
                return cat.getId();
            }
        }

        for (Category cat : categories) {
            String catName = cat.getName().trim().toLowerCase();
            if (clean.contains(catName) || catName.contains(clean)) {
                return cat.getId();
            }
        }

        for (Category cat : categories) {
            String catName = cat.getName().trim().toLowerCase();
            if (clean.contains("food") && catName.contains("grocer")) return cat.getId();
            if (clean.contains("restaurant") && catName.contains("entertain")) return cat.getId();
            if (clean.contains("cab") || clean.contains("uber") || clean.contains("taxi")) {
                if (catName.contains("transport")) return cat.getId();
            }
        }

        return null;
    }

    private String asNullableText(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return null;
        String text = node.asText().trim();
        return text.isEmpty() || text.equalsIgnoreCase("null") ? null : text;
    }

    private BigDecimal asBigDecimal(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return null;
        if (node.isNumber()) {
            return BigDecimal.valueOf(node.asDouble());
        }
        try {
            String text = node.asText().replaceAll("[^0-9.-]", "").trim();
            return text.isEmpty() ? null : new BigDecimal(text);
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDate parseLocalDate(String str) {
        if (str == null || str.isBlank()) return null;
        try {
            return LocalDate.parse(str.trim());
        } catch (Exception e) {
            return null;
        }
    }
}
