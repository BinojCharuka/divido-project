package com.divido.controller;

import com.divido.CsrfSupport;
import com.divido.TestcontainersConfiguration;
import com.divido.dto.receipt.ConfidenceScores;
import com.divido.dto.receipt.ExpenseClassification;
import com.divido.dto.receipt.MerchantInfo;
import com.divido.dto.receipt.OcrResult;
import com.divido.dto.receipt.ReceiptItem;
import com.divido.dto.receipt.ReceiptQuality;
import com.divido.dto.receipt.ReceiptScanResponse;
import com.divido.dto.receipt.TransactionInfo;
import com.divido.service.GeminiReceiptScannerService;
import com.divido.service.ReceiptOcrService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ReceiptScanControllerIntegrationTest {

    private static final String PASSWORD = "correct-horse-battery";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @MockitoBean
    private ReceiptOcrService ocrService;

    @MockitoBean
    private GeminiReceiptScannerService scannerService;

    @AfterEach
    void cleanUpUserData() {
        jdbc.update("DELETE FROM transactions");
        jdbc.update("DELETE FROM categories WHERE user_id IS NOT NULL");
        jdbc.update("DELETE FROM app_users");
    }

    @Test
    void unauthenticatedScanIsRejected() {
        var post = mvc.post().uri("/api/v1/receipts/scan")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"image\":\"base64data\"}")
                .exchange();

        assertThat(post).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(post).bodyJson().extractingPath("$.code").isEqualTo("UNAUTHENTICATED");
    }

    @Test
    void mutatingScanRequiresCsrf() {
        MockHttpSession session = registerAndLogin("alice@example.com");

        var postNoCsrf = mvc.post().uri("/api/v1/receipts/scan")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"image\":\"base64data\"}")
                .exchange();

        assertThat(postNoCsrf).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(postNoCsrf).bodyJson().extractingPath("$.code").isEqualTo("CSRF_INVALID");
    }

    @Test
    void emptyPayloadReturnsBadRequest() {
        MockHttpSession session = registerAndLogin("bob@example.com");

        var result = postWithCsrf("/api/v1/receipts/scan", "{\"image\":\"\"}", session);
        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("INVALID_RECEIPT_IMAGE");
    }

    @Test
    void shortCircuitsWhenOcrIsUnreadableWithoutCallingGemini() {
        MockHttpSession session = registerAndLogin("dave@example.com");

        OcrResult unreadableOcr = OcrResult.failed("Blurry or unreadable receipt image");
        when(ocrService.extractText(any(), any())).thenReturn(unreadableOcr);

        String base64 = Base64.getEncoder().encodeToString("dummy".getBytes());
        String jsonPayload = String.format("{\"image\":\"%s\",\"mimeType\":\"image/png\"}", base64);
        var result = postWithCsrf("/api/v1/receipts/scan", jsonPayload, session);

        assertThat(result).hasStatus(HttpStatus.OK);
        assertThat(result).bodyJson().extractingPath("$.success").isEqualTo(false);
        assertThat(result).bodyJson().extractingPath("$.receiptQuality.isReadable").isEqualTo(false);
        verifyNoInteractions(scannerService);
    }

    @Test
    void scanValidReceiptReturnsStructuredJson() throws IOException {
        MockHttpSession session = registerAndLogin("carol@example.com");

        byte[] imageBytes = createSampleReceiptImage();
        String base64 = Base64.getEncoder().encodeToString(imageBytes);

        OcrResult validOcr = new OcrResult(
                true,
                true,
                92.5,
                "KEELLS SUPER\nFresh Milk 1L 450.00\nTOTAL LKR 1250.00",
                List.of("KEELLS SUPER", "Fresh Milk 1L 450.00", "TOTAL LKR 1250.00"),
                "eng",
                true,
                true,
                List.of(),
                null
        );
        when(ocrService.extractText(any(), any())).thenReturn(validOcr);

        UUID groceriesId = UUID.randomUUID();
        ReceiptScanResponse mockResponse = new ReceiptScanResponse(
                true,
                ReceiptQuality.clean(),
                new MerchantInfo("Keells Super", "Kollupitiya", "Galle Rd, Colombo", "0112345678"),
                new TransactionInfo(
                        LocalDate.of(2026, 11, 22),
                        "14:30",
                        "LKR",
                        new BigDecimal("1250.00"),
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        new BigDecimal("1250.00"),
                        new BigDecimal("1500.00"),
                        new BigDecimal("250.00")
                ),
                List.of(new ReceiptItem("Fresh Milk 1L", 1, new BigDecimal("450.00"), new BigDecimal("450.00"))),
                new ExpenseClassification("Grocery Shopping", "Groceries", groceriesId),
                new ConfidenceScores(0.95, 0.90, 0.98, 0.90),
                "Keells Super Total: LKR 1250.00"
        );

        when(scannerService.scanReceiptText(any(), any())).thenReturn(mockResponse);

        String jsonPayload = String.format("{\"image\":\"%s\",\"mimeType\":\"image/png\"}", base64);
        var result = postWithCsrf("/api/v1/receipts/scan", jsonPayload, session);

        assertThat(result).hasStatus(HttpStatus.OK);
        assertThat(result).bodyJson().extractingPath("$.success").isEqualTo(true);
        assertThat(result).bodyJson().extractingPath("$.merchant.name").isEqualTo("Keells Super");
        assertThat(result).bodyJson().extractingPath("$.transaction.total").isEqualTo(1250.00);
        assertThat(result).bodyJson().extractingPath("$.transaction.currency").isEqualTo("LKR");
        assertThat(result).bodyJson().extractingPath("$.items[0].name").isEqualTo("Fresh Milk 1L");
        assertThat(result).bodyJson().extractingPath("$.expense.suggestedCategory").isEqualTo("Groceries");
        assertThat(result).bodyJson().extractingPath("$.confidence.total").isEqualTo(0.98);
    }

    private byte[] createSampleReceiptImage() throws IOException {
        BufferedImage img = new BufferedImage(300, 300, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, 300, 300);
        g.setColor(Color.BLACK);
        g.drawString("KEELLS SUPER", 50, 50);
        g.drawString("TOTAL LKR 1250.00", 50, 100);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }

    private MockHttpSession registerAndLogin(String email) {
        String regJson = """
                {
                    "email": "%s",
                    "password": "%s"
                }
                """.formatted(email, PASSWORD);

        var regRes = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/register"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(regJson)
                .exchange();
        assertThat(regRes).hasStatus(HttpStatus.CREATED);

        var loginRes = CsrfSupport.fetch(mvc).apply(mvc.post().uri("/api/v1/auth/login"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(regJson)
                .exchange();
        assertThat(loginRes).hasStatus(HttpStatus.OK);

        return (MockHttpSession) loginRes.getMvcResult().getRequest().getSession(false);
    }

    private MvcTestResult postWithCsrf(String uri, String body, MockHttpSession session) {
        var request = CsrfSupport.fetch(mvc).apply(mvc.post().uri(uri));
        if (session != null) {
            request.session(session);
        }
        return request.contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .exchange();
    }
}
