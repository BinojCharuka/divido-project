package com.divido.service;

import com.divido.dto.receipt.OcrResult;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
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
 * Ensures the OCR script is reliably resolved across local, JAR, and containerized deployments.
 */
@Service
public class ReceiptOcrService {

    private static final Logger log = LoggerFactory.getLogger(ReceiptOcrService.class);
    private static final String SCRIPT_FILENAME = "receipt_ocr.py";

    private final JsonMapper jsonMapper;
    private Path resolvedScriptPath;
    private String resolvedPythonExecutable;

    public ReceiptOcrService(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    @PostConstruct
    public void init() {
        this.resolvedPythonExecutable = detectPythonExecutable();
        this.resolvedScriptPath = detectAndExtractScript();
        log.info("ReceiptOcrService initialized. Python: {}, Script: {}",
                this.resolvedPythonExecutable, this.resolvedScriptPath);
    }

    public OcrResult extractText(byte[] imageBytes, String mimeType) {
        if (imageBytes == null || imageBytes.length == 0) {
            return OcrResult.failed("Receipt image payload is empty.");
        }

        File tempImage = null;
        try {
            String extension = mimeType != null && mimeType.contains("png") ? ".png" : ".jpg";
            tempImage = File.createTempFile("receipt_ocr_", extension);
            tempImage.deleteOnExit();
            try (FileOutputStream fos = new FileOutputStream(tempImage)) {
                fos.write(imageBytes);
            }

            Path scriptPath = getOrRefreshScriptPath();
            if (scriptPath == null || !Files.exists(scriptPath)) {
                log.error("Could not locate or extract receipt_ocr.py on server.");
                return OcrResult.failed("OCR engine script not found. Please verify ocr/receipt_ocr.py exists.");
            }

            String pythonExecutable = this.resolvedPythonExecutable != null ? this.resolvedPythonExecutable : detectPythonExecutable();
            log.info("Running local OCR with Python [{}] on script [{}]", pythonExecutable, scriptPath);

            ProcessBuilder pb = new ProcessBuilder(pythonExecutable, scriptPath.toString(), tempImage.getAbsolutePath());
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
                    boolean deleted = Files.deleteIfExists(tempImage.toPath());
                    if (deleted) {
                        log.info("Cached temporary receipt image successfully deleted from disk: {}", tempImage.getName());
                    } else {
                        boolean fallbackDeleted = tempImage.delete();
                        log.info("Cached temporary receipt image deleted via fallback: {} (success: {})", tempImage.getName(), fallbackDeleted);
                    }
                } catch (Exception e) {
                    log.warn("Could not delete cached temporary receipt image: {}", e.getMessage());
                }
            }
        }
    }

    private synchronized Path getOrRefreshScriptPath() {
        if (this.resolvedScriptPath != null && Files.isRegularFile(this.resolvedScriptPath)) {
            return this.resolvedScriptPath;
        }
        this.resolvedScriptPath = detectAndExtractScript();
        return this.resolvedScriptPath;
    }

    private synchronized Path detectAndExtractScript() {
        // 1. Check explicit environment variable (e.g. OCR_SCRIPT_PATH)
        String envPath = System.getenv("DIVIDO_OCR_SCRIPT_PATH");
        if (envPath == null || envPath.isBlank()) {
            envPath = System.getenv("OCR_SCRIPT_PATH");
        }
        if (envPath != null && !envPath.isBlank()) {
            Path p = Paths.get(envPath.trim());
            if (Files.isRegularFile(p)) {
                log.info("Using OCR script from environment variable: {}", p.toAbsolutePath());
                return p.toAbsolutePath();
            }
        }

        // 2. Check filesystem candidate paths relative to current working directory and common deployment roots
        List<Path> candidates = List.of(
                Paths.get("/app/ocr", SCRIPT_FILENAME),
                Paths.get("/app", SCRIPT_FILENAME),
                Paths.get("backend/ocr", SCRIPT_FILENAME),
                Paths.get("ocr", SCRIPT_FILENAME),
                Paths.get("../ocr", SCRIPT_FILENAME),
                Paths.get("../../ocr", SCRIPT_FILENAME),
                Paths.get(SCRIPT_FILENAME)
        );
        for (Path c : candidates) {
            if (Files.isRegularFile(c)) {
                log.info("Found OCR script on filesystem: {}", c.toAbsolutePath());
                return c.toAbsolutePath();
            }
        }

        // 3. Search upward from working directory (up to 5 directory levels)
        try {
            Path current = Paths.get("").toAbsolutePath();
            for (int i = 0; i < 5 && current != null; i++) {
                Path check1 = current.resolve("ocr").resolve(SCRIPT_FILENAME);
                if (Files.isRegularFile(check1)) return check1.toAbsolutePath();
                Path check2 = current.resolve("backend/ocr").resolve(SCRIPT_FILENAME);
                if (Files.isRegularFile(check2)) return check2.toAbsolutePath();
                current = current.getParent();
            }
        } catch (Exception ignored) {
        }

        // 4. Guaranteed Spring Classpath Extraction
        // Reads from classpath (e.g. src/main/resources/ocr/receipt_ocr.py or inside the packaged JAR)
        try {
            ClassPathResource resource = new ClassPathResource("ocr/" + SCRIPT_FILENAME);
            if (!resource.exists()) {
                resource = new ClassPathResource(SCRIPT_FILENAME);
            }
            if (resource.exists()) {
                File tempDir = new File(System.getProperty("java.io.tmpdir"), "divido_ocr");
                if (!tempDir.exists()) {
                    boolean created = tempDir.mkdirs();
                }
                File targetScript = new File(tempDir, SCRIPT_FILENAME);
                try (InputStream in = resource.getInputStream();
                     OutputStream out = new FileOutputStream(targetScript)) {
                    in.transferTo(out);
                }
                boolean readable = targetScript.setReadable(true, false);
                boolean executable = targetScript.setExecutable(true, false);
                log.info("Successfully extracted classpath OCR script to: {} (size: {} bytes, readable: {})",
                        targetScript.getAbsolutePath(), targetScript.length(), readable);
                return targetScript.toPath().toAbsolutePath();
            } else {
                log.warn("Spring ClassPathResource ocr/{} not found on classpath.", SCRIPT_FILENAME);
            }
        } catch (Exception e) {
            log.error("Failed to extract OCR script from classpath: {}", e.getMessage(), e);
        }

        log.error("Could not locate or extract {} anywhere on filesystem or classpath.", SCRIPT_FILENAME);
        return null;
    }

    private String detectPythonExecutable() {
        // 1. Check environment variable
        String envPython = System.getenv("DIVIDO_PYTHON_PATH");
        if (envPython == null || envPython.isBlank()) {
            envPython = System.getenv("PYTHON_EXECUTABLE");
        }
        if (envPython != null && !envPython.isBlank() && testPython(envPython.trim())) {
            return envPython.trim();
        }

        // 2. Candidate paths
        List<String> candidates = List.of(
                "python3",
                "/usr/bin/python3",
                "/usr/local/bin/python3",
                "/opt/homebrew/bin/python3",
                "/Library/Frameworks/Python.framework/Versions/3.14/bin/python3",
                "/Library/Frameworks/Python.framework/Versions/3.12/bin/python3",
                "/Library/Frameworks/Python.framework/Versions/3.11/bin/python3",
                "python"
        );
        for (String c : candidates) {
            if (testPython(c)) {
                return c;
            }
        }
        return "python3";
    }

    private boolean testPython(String cmd) {
        try {
            Process p = new ProcessBuilder(cmd, "--version")
                    .redirectErrorStream(true)
                    .start();
            boolean ok = p.waitFor(2, TimeUnit.SECONDS);
            return ok && p.exitValue() == 0;
        } catch (Exception ignored) {
            return false;
        }
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
            return OcrResult.failed("Failed to parse OCR result format: " + e.getMessage());
        }
    }
}
