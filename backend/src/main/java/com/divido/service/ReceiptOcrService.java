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
    private static final String CLASSPATH_RESOURCE = "ocr/" + SCRIPT_FILENAME;

    private final JsonMapper jsonMapper;
    private Path resolvedScriptPath;
    private String resolvedPythonExecutable;

    public ReceiptOcrService(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    @PostConstruct
    public void init() {
        this.resolvedPythonExecutable = detectPythonExecutable();
        try {
            this.resolvedScriptPath = extractAndValidateScript();
        } catch (Exception e) {
            log.error("CRITICAL: Failed to initialize OCR script at startup: {}", e.getMessage(), e);
        }

        boolean resourceExists = false;
        try {
            ClassPathResource cp = new ClassPathResource(CLASSPATH_RESOURCE);
            resourceExists = cp.exists();
        } catch (Exception ignored) {
        }

        boolean extractedSuccess = this.resolvedScriptPath != null && Files.isRegularFile(this.resolvedScriptPath);
        long fileSize = -1;
        boolean readable = false;
        if (extractedSuccess) {
            try {
                fileSize = Files.size(this.resolvedScriptPath);
                readable = Files.isReadable(this.resolvedScriptPath);
            } catch (Exception ignored) {
            }
        }

        log.info("=== OCR ENGINE DIAGNOSTICS ===");
        log.info("OCR_RESOURCE_EXISTS={}", resourceExists);
        log.info("OCR_RESOURCE_EXTRACTION_SUCCESS={}", extractedSuccess);
        log.info("OCR_SCRIPT_ABSOLUTE_PATH={}", this.resolvedScriptPath != null ? this.resolvedScriptPath.toAbsolutePath().toString() : "null");
        log.info("OCR_SCRIPT_FILE_SIZE={}", fileSize);
        log.info("OCR_SCRIPT_READABLE={}", readable);
        log.info("PYTHON_EXECUTABLE={}", this.resolvedPythonExecutable);
        log.info("===============================");
    }

    public OcrResult extractText(byte[] imageBytes, String mimeType) {
        if (imageBytes == null || imageBytes.length == 0) {
            return OcrResult.failed("Receipt image payload is empty.");
        }

        Path scriptPath;
        try {
            scriptPath = getOrRefreshScriptPath();
            if (scriptPath == null || !Files.exists(scriptPath) || !Files.isReadable(scriptPath) || Files.size(scriptPath) == 0) {
                log.error("OCR engine script is not available or empty on server.");
                return OcrResult.systemError("OCR_SCRIPT_MISSING", "OCR engine script not found. Please verify ocr/receipt_ocr.py exists.");
            }
        } catch (Exception e) {
            log.error("Failed to resolve OCR script path: {}", e.getMessage(), e);
            return OcrResult.systemError("OCR_SCRIPT_MISSING", "OCR engine script not found: " + e.getMessage());
        }

        String pythonExecutable = this.resolvedPythonExecutable != null && testPython(this.resolvedPythonExecutable)
                ? this.resolvedPythonExecutable
                : detectPythonExecutable();
        if (pythonExecutable == null || pythonExecutable.isBlank() || !testPython(pythonExecutable)) {
            log.error("Python 3 executable not available on host system.");
            return OcrResult.systemError("PYTHON_UNAVAILABLE", "Python 3 runtime is not available on the server.");
        }

        File tempImage = null;
        try {
            String extension = mimeType != null && mimeType.contains("png") ? ".png" : ".jpg";
            tempImage = File.createTempFile("receipt_ocr_", extension);
            tempImage.deleteOnExit();
            try (FileOutputStream fos = new FileOutputStream(tempImage)) {
                fos.write(imageBytes);
            }

            log.info("Executing local OCR with Python [{}] and script [{}] on image [{}] (size: {} bytes)",
                    pythonExecutable, scriptPath.toAbsolutePath(), tempImage.getName(), imageBytes.length);

            ProcessBuilder pb = new ProcessBuilder(pythonExecutable, scriptPath.toAbsolutePath().toString(), tempImage.getAbsolutePath());
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
                return OcrResult.systemError("OCR_TIMEOUT", "OCR processing timed out. Image might be overly large or unreadable.");
            }

            String rawOutput = output.toString().trim();
            if (rawOutput.isEmpty()) {
                log.warn("OCR process returned empty output.");
                return OcrResult.systemError("OCR_EMPTY_OUTPUT", "OCR engine returned no output. Check server logs.");
            }

            // Check for missing system dependencies in output
            if (rawOutput.contains("TesseractNotFoundError") || rawOutput.contains("tesseract is not installed")) {
                log.error("Tesseract OCR is not installed on the system: {}", rawOutput);
                return OcrResult.systemError("TESSERACT_NOT_FOUND", "Tesseract OCR engine is not installed on the server.");
            }

            if (process.exitValue() != 0 && !rawOutput.contains("\"success\"")) {
                log.error("OCR script process failed with exit code {}: {}", process.exitValue(), rawOutput);
                return OcrResult.systemError("OCR_EXECUTION_FAILED", "OCR process failed with exit code " + process.exitValue());
            }

            // Extract JSON if extra stdout output occurred
            int firstBrace = rawOutput.indexOf("{");
            int lastBrace = rawOutput.lastIndexOf("}");
            if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
                rawOutput = rawOutput.substring(firstBrace, lastBrace + 1);
            }

            return parseOcrJson(rawOutput);

        } catch (Exception e) {
            log.error("Failed to execute local OCR process: {}", e.getMessage(), e);
            return OcrResult.systemError("OCR_PROCESS_EXCEPTION", "Error during local OCR execution: " + e.getMessage());
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

    public synchronized Path getOrRefreshScriptPath() {
        if (this.resolvedScriptPath != null && Files.isRegularFile(this.resolvedScriptPath) && Files.isReadable(this.resolvedScriptPath)) {
            try {
                if (Files.size(this.resolvedScriptPath) > 0) {
                    return this.resolvedScriptPath;
                }
            } catch (Exception ignored) {
            }
        }
        this.resolvedScriptPath = extractAndValidateScript();
        return this.resolvedScriptPath;
    }

    private synchronized Path extractAndValidateScript() {
        // 1. Explicit environment variable
        String envPath = System.getenv("DIVIDO_OCR_SCRIPT_PATH");
        if (envPath == null || envPath.isBlank()) {
            envPath = System.getenv("OCR_SCRIPT_PATH");
        }
        if (envPath != null && !envPath.isBlank()) {
            Path p = Paths.get(envPath.trim()).toAbsolutePath();
            if (Files.isRegularFile(p) && Files.isReadable(p)) {
                try {
                    if (Files.size(p) > 0) {
                        log.info("Using OCR script from environment variable: {}", p);
                        return p;
                    }
                } catch (Exception ignored) {
                }
            }
        }

        // 2. Classpath resource extraction (Required for Spring Boot JAR & Railway deployments)
        try {
            InputStream in = openClasspathResourceStream();
            if (in != null) {
                Path extracted = extractResourceToTempFile(in);
                if (extracted != null && Files.isRegularFile(extracted) && Files.isReadable(extracted) && Files.size(extracted) > 0) {
                    log.info("Successfully extracted OCR script from classpath to: {} (size: {} bytes)",
                            extracted, Files.size(extracted));
                    return extracted;
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract OCR script from classpath: {}", e.getMessage(), e);
        }

        // 3. Filesystem candidates (Local dev fallback)
        List<Path> candidates = List.of(
                Paths.get("backend/src/main/resources/ocr", SCRIPT_FILENAME),
                Paths.get("backend/ocr", SCRIPT_FILENAME),
                Paths.get("ocr", SCRIPT_FILENAME),
                Paths.get("../ocr", SCRIPT_FILENAME),
                Paths.get("/app/ocr", SCRIPT_FILENAME),
                Paths.get("/tmp/divido_ocr", SCRIPT_FILENAME)
        );
        for (Path c : candidates) {
            Path abs = c.toAbsolutePath();
            if (Files.isRegularFile(abs) && Files.isReadable(abs)) {
                try {
                    if (Files.size(abs) > 0) {
                        log.info("Found OCR script on filesystem: {}", abs);
                        return abs;
                    }
                } catch (Exception ignored) {
                }
            }
        }

        throw new IllegalStateException("Failed to locate or extract " + SCRIPT_FILENAME +
                " from classpath (" + CLASSPATH_RESOURCE + ") or filesystem.");
    }

    private InputStream openClasspathResourceStream() {
        try {
            ClassPathResource cpr = new ClassPathResource(CLASSPATH_RESOURCE);
            if (cpr.exists()) {
                return cpr.getInputStream();
            }
        } catch (Exception ignored) {
        }

        try {
            ClassPathResource cpr = new ClassPathResource(SCRIPT_FILENAME);
            if (cpr.exists()) {
                return cpr.getInputStream();
            }
        } catch (Exception ignored) {
        }

        InputStream is = getClass().getClassLoader().getResourceAsStream(CLASSPATH_RESOURCE);
        if (is != null) return is;

        is = Thread.currentThread().getContextClassLoader().getResourceAsStream(CLASSPATH_RESOURCE);
        if (is != null) return is;

        return getClass().getResourceAsStream("/" + CLASSPATH_RESOURCE);
    }

    private Path extractResourceToTempFile(InputStream in) throws Exception {
        try (in) {
            File tempDir = new File("/tmp/divido_ocr");
            if (!tempDir.exists() && !tempDir.mkdirs()) {
                tempDir = new File(System.getProperty("java.io.tmpdir"), "divido_ocr");
                tempDir.mkdirs();
            }

            File targetScript = new File(tempDir, SCRIPT_FILENAME);
            try (OutputStream out = new FileOutputStream(targetScript)) {
                in.transferTo(out);
                out.flush();
            }

            boolean readable = targetScript.setReadable(true, false);
            boolean executable = targetScript.setExecutable(true, false);
            log.info("Extracted script to {} (readable: {}, executable: {})",
                    targetScript.getAbsolutePath(), readable, executable);

            return targetScript.toPath().toAbsolutePath();
        }
    }

    private String detectPythonExecutable() {
        String envPython = System.getenv("DIVIDO_PYTHON_PATH");
        if (envPython == null || envPython.isBlank()) {
            envPython = System.getenv("PYTHON_EXECUTABLE");
        }
        if (envPython != null && !envPython.isBlank() && testPython(envPython.trim())) {
            return envPython.trim();
        }

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
                    error,
                    success ? null : "OCR_FAILED"
            );
        } catch (Exception e) {
            log.error("Failed to parse OCR JSON output: {}", e.getMessage());
            return OcrResult.systemError("OCR_PARSE_ERROR", "Failed to parse OCR result format: " + e.getMessage());
        }
    }
}
