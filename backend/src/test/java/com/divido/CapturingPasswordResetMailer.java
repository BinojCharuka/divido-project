package com.divido;

import com.divido.service.PasswordResetMailer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/** Records reset emails instead of sending them; tests read the link from here. */
@TestConfiguration(proxyBeanMethods = false)
public class CapturingPasswordResetMailer {

    public record Sent(String to, String displayName, String link, Duration validFor) {

        /** The token from the link's {@code #token=} fragment. */
        public String token() {
            return link.substring(link.indexOf("#token=") + "#token=".length());
        }
    }

    public static final class Outbox implements PasswordResetMailer {

        private final List<Sent> sent = new CopyOnWriteArrayList<>();

        @Override
        public void send(String to, String displayName, String resetLink, Duration validFor) {
            sent.add(new Sent(to, displayName, resetLink, validFor));
        }

        public List<Sent> sent() {
            return List.copyOf(sent);
        }

        public Sent last() {
            return sent.getLast();
        }

        public void clear() {
            sent.clear();
        }
    }

    @Bean
    @Primary
    Outbox capturingPasswordResetMailer() {
        return new Outbox();
    }
}
