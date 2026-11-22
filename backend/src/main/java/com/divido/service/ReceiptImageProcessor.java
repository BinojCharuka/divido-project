package com.divido.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Validates, checks quality heuristics, and preprocesses receipt images before sending to Gemini.
 */
@Service
public class ReceiptImageProcessor {

    private static final Logger log = LoggerFactory.getLogger(ReceiptImageProcessor.class);

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final int MAX_DIMENSION = 2048;
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    public record ProcessedReceiptImage(
            byte[] bytes,
            String mimeType,
            boolean isReadable,
            boolean isBlurry,
            List<String> warnings
    ) {}

    public ProcessedReceiptImage processImage(byte[] rawBytes, String originalMimeType) throws IOException {
        if (rawBytes == null || rawBytes.length == 0) {
            throw new IllegalArgumentException("Receipt image cannot be empty.");
        }
        if (rawBytes.length > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Receipt image exceeds maximum size of 10MB.");
        }

        String mimeType = normalizeMimeType(originalMimeType);
        if (!ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new IllegalArgumentException("Unsupported image format. Please upload JPG, PNG, or WebP.");
        }

        List<String> warnings = new ArrayList<>();
        BufferedImage image;
        try {
            image = ImageIO.read(new ByteArrayInputStream(rawBytes));
        } catch (Exception e) {
            log.warn("Failed to decode image: {}", e.getMessage());
            throw new IllegalArgumentException("The uploaded file is not a valid or readable image.");
        }

        if (image == null) {
            throw new IllegalArgumentException("The uploaded file could not be decoded as an image.");
        }

        int width = image.getWidth();
        int height = image.getHeight();

        // 1. Resolution Check
        if (width < 150 || height < 150) {
            warnings.add("Image resolution is very low. Text may be unreadable.");
        }

        // 2. Brightness Check
        double avgLuminance = calculateAverageLuminance(image);
        if (avgLuminance < 35.0) {
            warnings.add("Image appears very dark. Text recognition may be affected.");
        } else if (avgLuminance > 240.0) {
            warnings.add("Image appears overexposed or washed out.");
        }

        // 3. Sharpness / Blurriness Heuristic (Laplacian Variance)
        double laplacianVar = calculateLaplacianVariance(image);
        boolean isBlurry = laplacianVar < 45.0 && (width >= 200 && height >= 200);
        if (isBlurry) {
            warnings.add("Image appears blurry or out of focus. Please verify details.");
        }

        // 4. Downscale if very large to optimize Gemini latency
        byte[] outputBytes = rawBytes;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            double scale = Math.min((double) MAX_DIMENSION / width, (double) MAX_DIMENSION / height);
            int newWidth = (int) Math.round(width * scale);
            int newHeight = (int) Math.round(height * scale);

            BufferedImage resized = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = resized.createGraphics();
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2d.drawImage(image, 0, 0, newWidth, newHeight, null);
            g2d.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            String formatName = mimeType.equals("image/png") ? "png" : "jpeg";
            ImageIO.write(resized, formatName, baos);
            outputBytes = baos.toByteArray();
            mimeType = "image/" + formatName;
        }

        boolean isReadable = !isBlurry && (width >= 100 && height >= 100);

        return new ProcessedReceiptImage(outputBytes, mimeType, isReadable, isBlurry, warnings);
    }

    private String normalizeMimeType(String mime) {
        if (mime == null) return "image/jpeg";
        String normalized = mime.toLowerCase().trim();
        if (normalized.equals("image/jpg")) return "image/jpeg";
        return normalized;
    }

    private double calculateAverageLuminance(BufferedImage img) {
        int w = img.getWidth();
        int h = img.getHeight();
        int step = Math.max(1, (w * h) / 10000); // sample up to ~10,000 pixels for speed

        long totalLuminance = 0;
        int count = 0;

        for (int y = 0; y < h; y += (int) Math.sqrt(step) + 1) {
            for (int x = 0; x < w; x += (int) Math.sqrt(step) + 1) {
                int rgb = img.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;
                // Standard perceptual luminance formula
                double lum = 0.299 * r + 0.587 * g + 0.114 * b;
                totalLuminance += (long) lum;
                count++;
            }
        }
        return count == 0 ? 128.0 : (double) totalLuminance / count;
    }

    private double calculateLaplacianVariance(BufferedImage img) {
        int w = img.getWidth();
        int h = img.getHeight();
        if (w < 10 || h < 10) return 100.0;

        int step = Math.max(1, Math.min(w, h) / 200);
        int sampleW = w / step;
        int sampleH = h / step;

        double[] laplacian = new double[(sampleW - 2) * (sampleH - 2)];
        double sum = 0;
        int idx = 0;

        // 3x3 Laplacian kernel on sampled grayscale pixels
        for (int y = 1; y < sampleH - 1; y++) {
            for (int x = 1; x < sampleW - 1; x++) {
                int center = getGray(img, x * step, y * step);
                int up = getGray(img, x * step, (y - 1) * step);
                int down = getGray(img, x * step, (y + 1) * step);
                int left = getGray(img, (x - 1) * step, y * step);
                int right = getGray(img, (x + 1) * step, y * step);

                double lap = (up + down + left + right) - (4.0 * center);
                laplacian[idx++] = lap;
                sum += lap;
            }
        }

        if (idx == 0) return 100.0;
        double mean = sum / idx;
        double varSum = 0;
        for (int i = 0; i < idx; i++) {
            double diff = laplacian[i] - mean;
            varSum += diff * diff;
        }
        return varSum / idx;
    }

    private int getGray(BufferedImage img, int x, int y) {
        int rgb = img.getRGB(x, y);
        int r = (rgb >> 16) & 0xFF;
        int g = (rgb >> 8) & 0xFF;
        int b = rgb & 0xFF;
        return (r + g + b) / 3;
    }
}

