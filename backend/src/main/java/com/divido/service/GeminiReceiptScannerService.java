package com.divido.service;

import com.divido.config.GeminiProperties;
import com.divido.dto.receipt.ConfidenceScores;
import com.divido.dto.receipt.ExpenseClassification;
import com.divido.dto.receipt.MerchantInfo;
import com.divido.dto.receipt.ReceiptItem;
import com.divido.dto.receipt.ReceiptQuality;
import com.divido.dto.receipt.ReceiptScanResponse;
import com.divido.dto.receipt.TransactionInfo;
import com.divido.entity.Category;
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
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Communicates with the Google Gemini Multimodal API to extract structured
 * financial details from receipt images, adhering to Divido's accuracy and categorization rules.
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

    public ReceiptScanResponse scanReceipt(UUID userId, ReceiptImageProcessor.ProcessedReceiptImage processedImage) {
        String apiKey = geminiProperties.getApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.error("Gemini API key is not configured in GEMINI_API_KEY environment variable.");
            return ReceiptScanResponse.failure("Gemini API key is not configured on the server. Please check environment settings.");
        }

        List<Category> usableCategories = categoryRepository.findUsableCategories(userId, true, null);
        List<String> categoryNames = usableCategories.stream().map(Category::getName).toList();

        String prompt = buildPrompt(categoryNames, processedImage.warnings());
        String base64Image = Base64.getEncoder().encodeToString(processedImage.bytes());

        String requestJson = buildGeminiRequest(processedImage.mimeType(), base64Image, prompt);

        // Call Gemini API with model fallback if needed
        String[] candidateModels = {
                geminiProperties.getModel(),
                "gemini-2.5-flash",
                "gemini-1.5-flash",
                "gemini-3.8-flash"
        };

        HttpResponse<String> response = null;
        String successfulModel = null;

        for (String model : candidateModels) {
            if (model == null || model.isBlank()) continue;
            try {
                response = executeGeminiRequest(model, apiKey, requestJson);
                if (response.statusCode() == 200) {
                    successfulModel = model;
                    break;
                } else if (response.statusCode() == 404) {
                    log.warn("Gemini model {} returned 404 Not Found, attempting fallback model.", model);
                } else if (response.statusCode() == 429) {
                    log.warn("Gemini rate limit exceeded (HTTP 429).");
                    return ReceiptScanResponse.failure("Gemini API rate limit or quota exceeded. Please try again shortly.");
                } else {
                    log.warn("Gemini API responded with status {}: {}", response.statusCode(), response.body());
                    break;
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
            return parseGeminiResponse(response.body(), usableCategories, processedImage);
        } catch (Exception e) {
            log.error("Failed to parse Gemini receipt extraction response: {}", e.getMessage(), e);
            return ReceiptScanResponse.failure("Could not parse extracted receipt details. Please review manually.");
        }
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

    private String buildGeminiRequest(String mimeType, String base64Image, String prompt) {
        try {
            Map<String, Object> inlineData = Map.of(
                    "mimeType", mimeType,
                    "data", base64Image
            );

            Map<String, Object> partImage = Map.of("inlineData", inlineData);
            Map<String, Object> partText = Map.of("text", prompt);

            Map<String, Object> content = Map.of(
                    "role", "user",
                    "parts", List.of(partImage, partText)
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
            throw new RuntimeException("Failed to serialize Gemini request payload", e);
        }
    }

    private String buildPrompt(List<String> availableCategories, List<String> preWarnings) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an accurate financial receipt extraction assistant for Divido Personal Finance.\n");
        sb.append("Analyze the supplied receipt image and extract only information supported by visible evidence.\n\n");

        sb.append("AVAILABLE EXPENSE CATEGORIES IN DIVIDO:\n");
        sb.append(String.join(", ", availableCategories));
        sb.append("\n\n");

        sb.append("EXTRACT THE FOLLOWING FIELDS:\n");
        sb.append("A. MERCHANT INFORMATION: name, branch (if available), address (if available), contact (if available)\n");
        sb.append("B. TRANSACTION INFORMATION: date (format: YYYY-MM-DD), time (if available), currency (e.g., LKR, USD, EUR), final payable amount\n");
        sb.append("C. ITEM INFORMATION: For every visible line item: name, quantity, unitPrice, totalPrice\n");
        sb.append("D. FINANCIAL BREAKDOWN: subtotal, discount, tax, serviceCharge, final total, amountPaid, change/balance\n");
        sb.append("E. EXPENSE CLASSIFICATION: suggested purpose (short phrase, e.g. 'Grocery Shopping', 'Dinner with Friends', 'Fuel'), and suggested category (select the closest match from the list of available categories above)\n\n");

        sb.append("CRITICAL ACCURACY RULES:\n");
        sb.append("1. Never assume that the largest number is the final total.\n");
        sb.append("2. Distinguish item prices from subtotal and final total.\n");
        sb.append("3. Distinguish cash/card received (amountPaid) from actual expense amount.\n");
        sb.append("4. Distinguish change/balance from transaction amount.\n");
        sb.append("5. Recognize labels such as TOTAL, GRAND TOTAL, NET TOTAL, AMOUNT PAID and common variations.\n");
        sb.append("6. Verify the item calculations where possible.\n");
        sb.append("7. Do not confuse invoice numbers, telephone numbers, dates, or quantities with prices.\n");
        sb.append("8. Preserve the original item names.\n");
        sb.append("9. Never invent missing merchant names or prices. If a field cannot be identified reliably, return null.\n");
        sb.append("10. If the image is blurry, cropped, unreadable, or not a receipt, set receiptQuality.isReadable=false and describe issues in receiptQuality.warnings.\n");
        sb.append("11. Do not silently guess unclear digits.\n");
        sb.append("12. Confidence values must be numbers between 0.0 and 1.0 reflecting actual visual clarity and consistency.\n\n");

        sb.append("RETURN ONLY VALID JSON WITH THE EXACT STRUCTURE:\n");
        sb.append("{\n");
        sb.append("  \"success\": true,\n");
        sb.append("  \"receiptQuality\": {\n");
        sb.append("    \"isReadable\": true,\n");
        sb.append("    \"isBlurry\": false,\n");
        sb.append("    \"warnings\": []\n");
        sb.append("  },\n");
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
        sb.append("  \"rawText\": \"summary of recognized text\"\n");
        sb.append("}\n");

        return sb.toString();
    }

    private ReceiptScanResponse parseGeminiResponse(String responseBody,
                                                    List<Category> usableCategories,
                                                    ReceiptImageProcessor.ProcessedReceiptImage processedImage) throws Exception {
        JsonNode rootNode = jsonMapper.readTree(responseBody);
        JsonNode candidate = rootNode.path("candidates").path(0);
        JsonNode textNode = candidate.path("content").path("parts").path(0).path("text");

        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            return ReceiptScanResponse.failure("Gemini returned an empty response. Receipt could not be scanned.");
        }

        String rawJson = textNode.asText().trim();
        // Clean markdown code blocks if present
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

        // Quality & warnings
        boolean isReadable = data.path("receiptQuality").path("isReadable").asBoolean(true) && processedImage.isReadable();
        boolean isBlurry = data.path("receiptQuality").path("isBlurry").asBoolean(false) || processedImage.isBlurry();

        List<String> combinedWarnings = new ArrayList<>(processedImage.warnings());
        JsonNode warningsNode = data.path("receiptQuality").path("warnings");
        if (warningsNode.isArray()) {
            for (JsonNode w : warningsNode) {
                String text = w.asText();
                if (!text.isBlank() && !combinedWarnings.contains(text)) {
                    combinedWarnings.add(text);
                }
            }
        }

        ReceiptQuality quality = new ReceiptQuality(isReadable, isBlurry, combinedWarnings);

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

        String rawText = asNullableText(data.path("rawText"));

        return new ReceiptScanResponse(
                true,
                quality,
                merchant,
                transaction,
                items,
                expense,
                confidence,
                rawText
        );
    }

    private UUID matchCategoryId(String suggestedName, List<Category> categories) {
        if (suggestedName == null || suggestedName.isBlank() || categories == null) {
            return null;
        }
        String clean = suggestedName.trim().toLowerCase();

        // 1. Exact match on category name
        for (Category cat : categories) {
            if (cat.getName().trim().equalsIgnoreCase(clean)) {
                return cat.getId();
            }
        }

        // 2. Substring / contains match
        for (Category cat : categories) {
            String catName = cat.getName().trim().toLowerCase();
            if (clean.contains(catName) || catName.contains(clean)) {
                return cat.getId();
            }
        }

        // 3. Fallback matching for common aliases (e.g. "Food" -> "Groceries", "Dining" -> "Entertainment")
        for (Category cat : categories) {
            String catName = cat.getName().trim().toLowerCase();
            if (clean.contains("food") && catName.contains("grocer")) {
                return cat.getId();
            }
            if (clean.contains("restaurant") && catName.contains("entertain")) {
                return cat.getId();
            }
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

