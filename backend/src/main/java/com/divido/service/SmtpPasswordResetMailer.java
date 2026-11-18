package com.divido.service;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Sends reset emails through SMTP on a background thread, so a request for an existing
 * account takes about as long as one for an unknown email (DEC-045). Locally the SMTP
 * server is Mailpit (compose.yaml). With {@code divido.mail.enabled=false}, or with no
 * SMTP host configured, nothing is sent and a warning without the link is logged.
 */
@Component
public class SmtpPasswordResetMailer implements PasswordResetMailer {

    private static final Logger log = LoggerFactory.getLogger(SmtpPasswordResetMailer.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final boolean enabled;
    private final String from;
    private final ExecutorService executor = Executors.newSingleThreadExecutor(runnable -> {
        Thread thread = new Thread(runnable, "password-reset-mail");
        thread.setDaemon(true);
        return thread;
    });

    public SmtpPasswordResetMailer(ObjectProvider<JavaMailSender> mailSender,
            @Value("${divido.mail.enabled:false}") boolean enabled,
            @Value("${divido.mail.from:Divido <no-reply@divido.local>}") String from) {
        this.mailSender = mailSender;
        this.enabled = enabled;
        this.from = from;
    }

    @Override
    public void send(String to, String displayName, String resetLink, Duration validFor) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (!enabled || sender == null) {
            log.warn("Password reset email not sent: mail is not configured (divido.mail.enabled / spring.mail.host)");
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("Reset your Divido password");
        message.setText("""
                Hi %s,

                Someone asked to reset the password for your Divido account. If this was you, \
                open this link within %d minutes to choose a new password:

                %s

                The link works once. If you didn't ask for this, you can ignore this email: \
                your password stays the same.

                Divido
                """.formatted(displayName, validFor.toMinutes(), resetLink));
        executor.execute(() -> {
            try {
                sender.send(message);
            } catch (MailException ex) {
                // The exception type only: its message could repeat the content.
                log.warn("Password reset email could not be sent ({})", ex.getClass().getSimpleName());
            }
        });
    }

    @PreDestroy
    void shutdown() {
        executor.shutdown();
    }
}
