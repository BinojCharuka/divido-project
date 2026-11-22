package com.divido.service;

import com.divido.dto.receipt.OcrResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Executes local OCR using the Python receipt_ocr engine (OpenCV + Tesseract OCR).
 * Validates text length, confidence, monetary amounts, and total labels without contacting any cloud API.
 */
@Service
public class ReceiptOcrService {

    private static final Logger log = LoggerFactory.getLogger(ReceiptOcrService.class);

    private final JsonMapper jsonMapper;

    public ReceiptOcrService(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    public OcrResult extractText(byte[] imageBytes, String mimeType) {
        if (imageBytes == null || imageBytes.length == 0) {
            return OcrResult.failed("Receipt image payload is empty.");
        }

        File tempImage = null;
        try {
            String extension = mimeType != null && mimeType.contains("png") ? ".png" : ".jpg";
            tempImage = File.createTempFile("receipt_ocr_", extension);
            try (FileOutputStream fos = new FileOutputStream(tempImage)) {
                fos.write(imageBytes);
            }

            String pythonExecutable = resolvePythonExecutable();
            String scriptPath = resolveScriptPath();
            log.info("Receipt OCR using python: {} and script: {}", pythonExecutable, scriptPath);

            if (scriptPath == null) {
                log.error("Could not find ocr/receipt_ocr.py script in workspace.");
                return OcrResult.failed("OCR engine script not found. Please verify ocr/receipt_ocr.py exists.");
            }

            ProcessBuilder pb = new ProcessBuilder(pythonExecutable, scriptPath, tempImage.getAbsolutePath());
            pb.redirectErrorStream(true);

            Process process = pb.start();
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            boolean finished = process.waitFor(25, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.warn("OCR process timed out after 25 seconds.");
                return OcrResult.failed("OCR processing timed out. Image might be overly large or unreadable.");
            }

            String rawJson = output.toString().trim();
            if (rawJson.isEmpty()) {
                log.warn("OCR process returned empty output.");
                return OcrResult.failed("OCR engine returned no output. Check server logs.");
            }

            // Extract JSON if extra stdout output occurred
            int firstBrace = rawJson.indexOf("{");
            int lastBrace = rawJson.lastIndexOf("}");
            if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
                rawJson = rawJson.substring(firstBrace, lastBrace + 1);
            }

            return parseOcrJson(rawJson);

        } catch (Exception e) {
            log.error("Failed to execute local OCR process: {}", e.getMessage(), e);
            return OcrResult.failed("Error during local OCR execution: " + e.getMessage());
        } finally {
            if (tempImage != null && tempImage.exists()) {
                try {
                    Files.deleteIfExists(tempImage.toPath());
                } catch (Exception ignored) {
                }
            }
        }
    }

    private String resolvePythonExecutable() {
        List<String> candidates = new ArrayList<>();
        // 1. Check workspace venvs
        Path[] venvPaths = {
                Paths.get("ocr/venv/bin/python"),
                Paths.get("ocr/venv/bin/python3"),
                Paths.get("../ocr/venv/bin/python"),
                Paths.get("../ocr/venv/bin/python3")
        };
        for (Path p : venvPaths) {
            if (Files.isExecutable(p)) {
                candidates.add(p.toAbsolutePath().toString());
            }
        }

        // 2. Add system candidates
        candidates.add("python3");
        candidates.add("/Library/Frameworks/Python.framework/Versions/3.14/bin/python3");
        candidates.add("/opt/homebrew/bin/python3");
        candidates.add("/usr/local/bin/python3");
        candidates.add("/usr/bin/python3");

        for (String c : candidates) {
            try {
                Process p = new ProcessBuilder(c, "-c", "import pytesseract, cv2, PIL; print('OK')")
                        .redirectErrorStream(true)
                        .start();
                boolean finished = p.waitFor(3, TimeUnit.SECONDS);
                if (finished && p.exitValue() == 0) {
                    return c;
                }
            } catch (Exception ignored) {
            }
        }
        return "python3";
    }

    private String resolveScriptPath() {
        Path[] candidates = {
                Paths.get("ocr/receipt_ocr.py"),
                Paths.get("../ocr/receipt_ocr.py"),
                Paths.get("receipt_ocr.py")
        };
        for (Path p : candidates) {
            if (Files.exists(p)) {
                return p.toAbsolutePath().toString();
            }
        }
        return null;
    }

    private OcrResult parseOcrJson(String json) {
        try {
            JsonNode root = jsonMapper.readTree(json);
            boolean success = root.path("success").asBoolean(false);
            boolean isReadable = root.path("isReadable").asBoolean(false);
            Double confidence = root.path("confidence").isNumber() ? root.path("confidence").asDouble() : 0.0;
            String rawText = root.path("rawText").asText("");
            String languagesUsed = root.path("languagesUsed").asText("eng");
            boolean hasMonetaryValues = root.path("hasMonetaryValues").asBoolean(false);
            boolean hasLikelyTotalLabel = root.path("hasLikelyTotalLabel").asBoolean(false);
            String error = root.path("error").isMissingNode() ? null : root.path("error").asText();

            List<String> warnings = new ArrayList<>();
            JsonNode warningsNode = root.path("warnings");
            if (warningsNode.isArray()) {
                for (JsonNode w : warningsNode) {
                    warnings.add(w.asText());
                }
            }

            List<String> lines = new ArrayList<>();
            JsonNode linesNode = root.path("lines");
            if (linesNode.isArray()) {
                for (JsonNode l : linesNode) {
                    lines.add(l.asText());
                }
            }

            if (error != null && !error.isBlank() && !warnings.contains(error)) {
                warnings.add(error);
            }

            return new OcrResult(
                    success,
                    isReadable,
                    confidence,
                    rawText,
                    lines,
                    languagesUsed,
                    hasMonetaryValues,
                    hasLikelyTotalLabel,
                    warnings,
                    error
            );
        } catch (Exception e) {
            log.error("Failed to parse OCR JSON output: {}", e.getMessage());
            return OcrResult.failed("Failed to parse OCR result format.");
        }
    }
}

