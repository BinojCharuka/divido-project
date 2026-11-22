package com.divido.controller;

import com.divido.dto.ApiError;
import com.divido.dto.receipt.OcrResult;
import com.divido.dto.receipt.ReceiptScanJsonRequest;
import com.divido.dto.receipt.ReceiptScanResponse;
import com.divido.security.DividoUserDetails;
import com.divido.service.GeminiReceiptScannerService;
import com.divido.service.ReceiptOcrService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/v1/receipts")
public class ReceiptScanController {

    private static final Logger log = LoggerFactory.getLogger(ReceiptScanController.class);

    private final ReceiptOcrService ocrService;
    private final GeminiReceiptScannerService scannerService;

    public ReceiptScanController(ReceiptOcrService ocrService,
                                 GeminiReceiptScannerService scannerService) {
        this.ocrService = ocrService;
        this.scannerService = scannerService;
    }

    /**
     * Multipart form-data receipt scan endpoint.
     */
    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> scanMultipartReceipt(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal DividoUserDetails user) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue.")
            );
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    new ApiError(400, "INVALID_RECEIPT_IMAGE", "Please upload a valid receipt image.")
            );
        }

        try {
            byte[] imageBytes = file.getBytes();
            String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";

            // Stage 1: Free Local OCR (OpenCV + Tesseract)
            OcrResult ocrResult = ocrService.extractText(imageBytes, mimeType);

            // Cloud / Missing Local Engine Graceful Fallback:
            // If local OCR engine script or binary is not available on this server host (e.g. Railway minimal container),
            // gracefully fallback to Gemini Multimodal directly so the user NEVER receives a scanning failure.
            if (!ocrResult.isSuccess() && ocrResult.error() != null &&
                    (ocrResult.error().contains("script not found") || ocrResult.error().contains("No such file") || ocrResult.error().contains("Cannot run program"))) {
                log.warn("Local OCR engine unavailable ({}), falling back to Gemini Multimodal directly.", ocrResult.error());
                ReceiptScanResponse directResponse = scannerService.scanReceiptDirectImage(user.getId(), imageBytes, mimeType);
                return ResponseEntity.ok(directResponse);
            }

            // Stage 2: Quality Validation & Token Protection Short-Circuit
            if (!ocrResult.isReadable() || ocrResult.safeRawText().length() < 10 || !ocrResult.hasMonetaryValues()) {
                // If OCR unreadable was caused by system execution error, also fall back to Gemini Multimodal
                if (ocrResult.error() != null && (ocrResult.error().contains("script not found") || ocrResult.error().contains("No such file") || ocrResult.error().contains("Cannot run program") || ocrResult.error().contains("TesseractNotFoundError"))) {
                    log.warn("Local OCR execution failure ({}), falling back to Gemini Multimodal.", ocrResult.error());
                    ReceiptScanResponse directResponse = scannerService.scanReceiptDirectImage(user.getId(), imageBytes, mimeType);
                    return ResponseEntity.ok(directResponse);
                }
                log.info("Receipt OCR quality failed or lacks monetary values. Short-circuiting without calling Gemini API.");
                List<String> warnings = ocrResult.safeWarnings().isEmpty()
                        ? List.of("Receipt text is unclear or no prices could be identified. Please take a clearer photo.")
                        : ocrResult.safeWarnings();
                return ResponseEntity.ok(ReceiptScanResponse.unreadable(warnings, ocrResult.safeRawText()));
            }

            // Stage 3: Semantic Understanding with Gemini API (Pure text only, zero image data sent)
            ReceiptScanResponse response = scannerService.scanReceiptText(user.getId(), ocrResult);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Receipt image validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    new ApiError(400, "INVALID_RECEIPT_IMAGE", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Failed to process receipt image: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ApiError(500, "RECEIPT_SCAN_ERROR", "Failed to process receipt image. Please try again.")
            );
        }
    }

    /**
     * JSON payload receipt scan endpoint (accepts base64 or dataURL).
     */
    @PostMapping(value = "/scan", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> scanJsonReceipt(
            @RequestBody ReceiptScanJsonRequest request,
            @AuthenticationPrincipal DividoUserDetails user) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue.")
            );
        }

        if (request == null || request.image() == null || request.image().isBlank()) {
            return ResponseEntity.badRequest().body(
                    new ApiError(400, "INVALID_RECEIPT_IMAGE", "Please provide a receipt image in base64 format.")
            );
        }

        try {
            String rawImage = request.image();
            String mimeType = request.mimeType() != null ? request.mimeType() : "image/jpeg";

            // Extract data if it is a Data URI (e.g. data:image/png;base64,....)
            if (rawImage.startsWith("data:")) {
                int commaIdx = rawImage.indexOf(",");
                if (commaIdx != -1) {
                    String prefix = rawImage.substring(5, commaIdx);
                    if (prefix.contains(";")) {
                        mimeType = prefix.substring(0, prefix.indexOf(";"));
                    }
                    rawImage = rawImage.substring(commaIdx + 1);
                }
            }

            byte[] imageBytes = Base64.getDecoder().decode(rawImage.trim());

            // Stage 1: Free Local OCR (OpenCV + Tesseract)
            OcrResult ocrResult = ocrService.extractText(imageBytes, mimeType);

            // Cloud / Missing Local Engine Graceful Fallback:
            // If local OCR engine script or binary is not available on this server host (e.g. Railway minimal container),
            // gracefully fallback to Gemini Multimodal directly so the user NEVER receives a scanning failure.
            if (!ocrResult.isSuccess() && ocrResult.error() != null &&
                    (ocrResult.error().contains("script not found") || ocrResult.error().contains("No such file") || ocrResult.error().contains("Cannot run program"))) {
                log.warn("Local OCR engine unavailable ({}), falling back to Gemini Multimodal directly.", ocrResult.error());
                ReceiptScanResponse directResponse = scannerService.scanReceiptDirectImage(user.getId(), imageBytes, mimeType);
                return ResponseEntity.ok(directResponse);
            }

            // Stage 2: Quality Validation & Token Protection Short-Circuit
            if (!ocrResult.isReadable() || ocrResult.safeRawText().length() < 10 || !ocrResult.hasMonetaryValues()) {
                // If OCR unreadable was caused by system execution error, also fall back to Gemini Multimodal
                if (ocrResult.error() != null && (ocrResult.error().contains("script not found") || ocrResult.error().contains("No such file") || ocrResult.error().contains("Cannot run program") || ocrResult.error().contains("TesseractNotFoundError"))) {
                    log.warn("Local OCR execution failure ({}), falling back to Gemini Multimodal.", ocrResult.error());
                    ReceiptScanResponse directResponse = scannerService.scanReceiptDirectImage(user.getId(), imageBytes, mimeType);
                    return ResponseEntity.ok(directResponse);
                }
                log.info("Receipt OCR quality failed or lacks monetary values. Short-circuiting without calling Gemini API.");
                List<String> warnings = ocrResult.safeWarnings().isEmpty()
                        ? List.of("Receipt text is unclear or no prices could be identified. Please take a clearer photo.")
                        : ocrResult.safeWarnings();
                return ResponseEntity.ok(ReceiptScanResponse.unreadable(warnings, ocrResult.safeRawText()));
            }

            // Stage 3: Semantic Understanding with Gemini API (Pure text only, zero image data sent)
            ReceiptScanResponse response = scannerService.scanReceiptText(user.getId(), ocrResult);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Receipt image validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    new ApiError(400, "INVALID_RECEIPT_IMAGE", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Failed to process receipt JSON image: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ApiError(500, "RECEIPT_SCAN_ERROR", "Failed to process receipt image. Please try again.")
            );
        }
    }
}
