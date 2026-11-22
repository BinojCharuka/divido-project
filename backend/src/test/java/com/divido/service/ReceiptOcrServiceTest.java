package com.divido.service;

import com.divido.dto.receipt.OcrResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class ReceiptOcrServiceTest {

    private ReceiptOcrService ocrService;

    @BeforeEach
    void setUp() {
        JsonMapper jsonMapper = JsonMapper.builder().build();
        ocrService = new ReceiptOcrService(jsonMapper);
        ocrService.init();
    }

    @Test
    void verifiesScriptPathResolutionAndDiagnostics() {
        Path scriptPath = ocrService.getOrRefreshScriptPath();
        assertThat(scriptPath).isNotNull();
        assertThat(scriptPath).exists();
        assertThat(scriptPath.toFile().length()).isGreaterThan(0L);
        assertThat(scriptPath.toFile().canRead()).isTrue();
    }

    @Test
    void rejectsEmptyBytesGracefully() {
        OcrResult result = ocrService.extractText(null, "image/jpeg");
        assertThat(result.success()).isFalse();
        assertThat(result.isReadable()).isFalse();
        assertThat(result.safeWarnings()).anyMatch(w -> w.contains("empty"));
    }

    @Test
    void extractsTextFromReceiptImageLocally() throws IOException {
        BufferedImage img = new BufferedImage(500, 350, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, 500, 350);
        g.setColor(Color.BLACK);
        g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 18));
        g.drawString("KEELLS SUPERMARKET", 40, 50);
        g.drawString("Fresh Milk 1L      450.00", 40, 100);
        g.drawString("White Bread        180.00", 40, 140);
        g.drawString("TOTAL LKR          630.00", 40, 200);
        g.drawString("CASH TENDERED     1000.00", 40, 240);
        g.drawString("CHANGE             370.00", 40, 280);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        byte[] imageBytes = baos.toByteArray();

        OcrResult result = ocrService.extractText(imageBytes, "image/png");

        assertThat(result).isNotNull();
        assertThat(result.success()).isTrue();
        assertThat(result.safeRawText()).contains("KEELLS");
    }
}
