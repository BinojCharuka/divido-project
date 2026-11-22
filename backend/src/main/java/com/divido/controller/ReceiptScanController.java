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
import java.util.Set;

/**
 * Controller for AI-powered Smart Receipt Scanning.
 * Enforces a strict two-stage privacy & token-efficient pipeline:
 *
 * 1. Stage 1 (Local OCR): Python Tesseract OCR extracts text locally on the server (zero cost).
 * 2. Stage 2 (Quality Gate): If OCR is unreadable or contains no monetary amounts, it short-circuits.
 * 3. Stage 3 (Semantic AI): Gemini API processes ONLY the extracted text string to construct structured JSON.
 *
 * NOTE: Receipt images are NEVER transmitted to external cloud APIs.
 */
@RestController
@RequestMapping("/api/v1/receipts")
public class ReceiptScanController {

    private static final Logger log = LoggerFactory.getLogger(ReceiptScanController.class);

    private static final Set<String> SYSTEM_ERROR_CODES = Set.of(
            "OCR_SCRIPT_MISSING",
            "PYTHON_UNAVAILABLE",
            "TESSERACT_NOT_FOUND",
            "OCR_TIMEOUT",
            "OCR_EXECUTION_FAILED",
            "OCR_PROCESS_EXCEPTION"
    );

    private final ReceiptOcrService ocrService;
    private final GeminiReceiptScannerService scannerService;

    public ReceiptScanController(ReceiptOcrService ocrService, GeminiReceiptScannerService scannerService) {
        this.ocrService = ocrService;
        this.scannerService = scannerService;
    }

    /**
     * Multipart file upload receipt scan endpoint.
     */
    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadReceipt(
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

            // Step 1.1: System / Infrastructure Error Handling
            if (ocrResult.errorCode() != null && SYSTEM_ERROR_CODES.contains(ocrResult.errorCode())) {
                String code = ocrResult.errorCode();
                String msg = ocrResult.error() != null ? ocrResult.error() : "OCR processing failed on the server.";
                log.error("OCR system failure: [{}] {}", code, msg);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                        new ApiError(500, code, msg)
                );
            }

            // Stage 2: Quality Validation & Token Protection Short-Circuit
            // Check if OCR produced unreadable text, empty/short text, or identified no monetary values.
            // If quality is insufficient, short-circuit immediately without sending anything to Gemini.
            if (!ocrResult.success() || !ocrResult.isReadable() || ocrResult.safeRawText().length() < 10 || !ocrResult.hasMonetaryValues()) {
                log.info("Receipt OCR quality insufficient or lacks monetary values. Short-circuiting without calling Gemini API.");
                List<String> warnings = ocrResult.safeWarnings().isEmpty()
                        ? List.of(ocrResult.error() != null ? ocrResult.error() : "Receipt text is unclear or no prices could be identified. Please take a clearer photo.")
                        : ocrResult.safeWarnings();
                return ResponseEntity.ok(ReceiptScanResponse.unreadable(warnings, ocrResult.safeRawText()));
            }

            // Stage 3: Semantic Understanding with Gemini API (Pure OCR-extracted text only, zero images sent)
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

            // Step 1.1: System / Infrastructure Error Handling
            if (ocrResult.errorCode() != null && SYSTEM_ERROR_CODES.contains(ocrResult.errorCode())) {
                String code = ocrResult.errorCode();
                String msg = ocrResult.error() != null ? ocrResult.error() : "OCR processing failed on the server.";
                log.error("OCR system failure: [{}] {}", code, msg);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                        new ApiError(500, code, msg)
                );
            }

            // Stage 2: Quality Validation & Token Protection Short-Circuit
            // Check if OCR produced unreadable text, empty/short text, or identified no monetary values.
            // If quality is insufficient, short-circuit immediately without sending anything to Gemini.
            if (!ocrResult.success() || !ocrResult.isReadable() || ocrResult.safeRawText().length() < 10 || !ocrResult.hasMonetaryValues()) {
                log.info("Receipt OCR quality insufficient or lacks monetary values. Short-circuiting without calling Gemini API.");
                List<String> warnings = ocrResult.safeWarnings().isEmpty()
                        ? List.of(ocrResult.error() != null ? ocrResult.error() : "Receipt text is unclear or no prices could be identified. Please take a clearer photo.")
                        : ocrResult.safeWarnings();
                return ResponseEntity.ok(ReceiptScanResponse.unreadable(warnings, ocrResult.safeRawText()));
            }

            // Stage 3: Semantic Understanding with Gemini API (Pure OCR-extracted text only, zero images sent)
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
