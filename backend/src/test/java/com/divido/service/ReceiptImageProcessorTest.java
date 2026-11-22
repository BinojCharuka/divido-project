package com.divido.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReceiptImageProcessorTest {

    private ReceiptImageProcessor processor;

    @BeforeEach
    void setUp() {
        processor = new ReceiptImageProcessor();
    }

    @Test
    void rejectsEmptyOrNullBytes() {
        assertThatThrownBy(() -> processor.processImage(null, "image/jpeg"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be empty");

        assertThatThrownBy(() -> processor.processImage(new byte[0], "image/jpeg"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be empty");
    }

    @Test
    void rejectsUnsupportedMimeType() {
        byte[] fakeBytes = new byte[]{1, 2, 3, 4};
        assertThatThrownBy(() -> processor.processImage(fakeBytes, "application/pdf"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported image format");
    }

    @Test
    void processesValidImageSuccessfully() throws IOException {
        BufferedImage img = new BufferedImage(300, 400, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, 300, 400);
        g.setColor(Color.BLACK);
        g.drawString("SUPERMARKET RECEIPT", 50, 50);
        g.drawString("Total: LKR 1250.00", 50, 100);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        byte[] bytes = baos.toByteArray();

        ReceiptImageProcessor.ProcessedReceiptImage result = processor.processImage(bytes, "image/png");

        assertThat(result).isNotNull();
        assertThat(result.bytes()).isNotEmpty();
        assertThat(result.mimeType()).isEqualTo("image/png");
        assertThat(result.isReadable()).isTrue();
    }

    @Test
    void warnsOnLowResolutionImage() throws IOException {
        BufferedImage img = new BufferedImage(80, 80, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, 80, 80);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpeg", baos);
        byte[] bytes = baos.toByteArray();

        ReceiptImageProcessor.ProcessedReceiptImage result = processor.processImage(bytes, "image/jpeg");

        assertThat(result.warnings()).anyMatch(w -> w.contains("resolution is very low"));
    }
}

