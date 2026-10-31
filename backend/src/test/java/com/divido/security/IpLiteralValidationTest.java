package com.divido.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class IpLiteralValidationTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "127.0.0.1",
            "0.0.0.0",
            "255.255.255.255",
            "192.168.1.1",
            "10.0.0.254",
            "172.16.0.5",
            "8.8.8.8",
            "::1",
            "::",
            "2001:db8::1",
            "fe80::1ff:fe23:4567:890a",
            "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
            "2001:db8:85a3::8a2e:370:7334",
            "::ffff:192.0.2.1"
    })
    void validIpLiteralsAccepted(String ip) {
        assertThat(RateLimitingFilter.isValidIpLiteral(ip))
                .as("Expected %s to be valid IP literal", ip)
                .isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "localhost",
            "LOCALHOST",
            "LocalHost",
            "example.com",
            "sub.domain.org",
            "google.com",
            "internal.corp",
            "attacker.invalid"
    })
    void localhostAndOrdinaryDnsHostnamesRejected(String hostname) {
        assertThat(RateLimitingFilter.isValidIpLiteral(hostname))
                .as("Expected hostname %s to be rejected without DNS lookup", hostname)
                .isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "127.1",
            "10.1",
            "192.168.1",
            "10.0.1",
            "192.168.01.1",  // octet with leading zero
            "010.0.0.1",     // octet with leading zero
            "192.168.1.1.1", // five octets
            "256.0.0.1",     // out of range octet
            "999.999.999.999"
    })
    void ipv4ShorthandAndInvalidFormsRejected(String ip) {
        assertThat(RateLimitingFilter.isValidIpLiteral(ip))
                .as("Expected shorthand or invalid IPv4 %s to be rejected", ip)
                .isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "192.168.1.1:8080",
            "127.0.0.1:443",
            "[::1]:8080",
            "[2001:db8::1]:443",
            "localhost:8080",
            "example.com:443"
    })
    void hostnamesAndIpsWithPortsRejected(String hostPort) {
        assertThat(RateLimitingFilter.isValidIpLiteral(hostPort))
                .as("Expected host with port %s to be rejected", hostPort)
                .isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            ":::",                                     // triple colon
            ":::: ",
            "2001::db8::1",                            // multiple double colons
            ":1:2:3:4:5:6:7:8",                        // starts with single colon
            "1:2:3:4:5:6:7:8:",                        // ends with single colon
            "1:2:3:4:5:6:7:8:9",                       // 9 segments
            "2001:0db8:85a3:0000:0000:8a2e:0370:7334:1", // 9 segments
            "1:2:3:4:5:6:7:8::",                       // 8 segments with double colon (would be 9+ total)
            "2001:00db8::1",                           // segment longer than 4 chars
            "fe80:1:2:3:4:5:6:7:8:9",
            "::ffff:256.0.0.1",                        // invalid embedded IPv4 octet
            "::ffff:192.168.1",                        // shorthand embedded IPv4
            "2001:db8:1:2:3:4:5::192.0.2.1"            // too many IPv6 segments before embedded IPv4
    })
    void malformedIpv6Rejected(String ipv6) {
        assertThat(RateLimitingFilter.isValidIpLiteral(ipv6))
                .as("Expected malformed IPv6 %s to be rejected", ipv6)
                .isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            " 127.0.0.1",
            "127.0.0.1 ",
            "127. 0.0.1",
            " ::1",
            "::1 ",
            "\t127.0.0.1",
            "\n127.0.0.1",
            "",
            "   ",
            "invalid-ip"
    })
    void whitespaceAndInvalidValuesRejected(String value) {
        assertThat(RateLimitingFilter.isValidIpLiteral(value))
                .as("Expected whitespace/invalid %s to be rejected", value)
                .isFalse();
    }

    @Test
    void nullRejectedSafely() {
        assertThat(RateLimitingFilter.isValidIpLiteral(null)).isFalse();
    }

    @Test
    void nonExistentHostnameRejectedInstantlyWithoutDnsResolution() {
        // A non-resolving literal parser completes in sub-millisecond time.
        // If InetAddress.getByName() were used, this non-existent domain would trigger
        // an OS / DNS lookup that could block or timeout for seconds.
        String nonExistentDomain = "definitely-non-existent-hostname-xyz-9876543210.invalid";
        long start = System.nanoTime();
        boolean result = RateLimitingFilter.isValidIpLiteral(nonExistentDomain);
        long elapsedMicros = (System.nanoTime() - start) / 1_000;

        assertThat(result).isFalse();
        assertThat(elapsedMicros)
                .as("Validation must be an in-memory lexical check taking under 5 milliseconds")
                .isLessThan(5_000);
    }
}
