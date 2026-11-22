package com.divido.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Configuration properties for Google Gemini API integration.
 */
@ConfigurationProperties(prefix = "divido.gemini")
public class GeminiProperties {

    /**
     * Gemini API key. Must not be exposed to the frontend or committed to source control.
     */
    private String apiKey = "";

    /**
     * Gemini model name (e.g. gemini-2.5-flash, gemini-1.5-flash, gemini-3.8-flash).
     */
    private String model = "gemini-2.5-flash";

    /**
     * Base URL for Google Generative Language API.
     */
    private String baseUrl = "https://generativelanguage.googleapis.com";

    /**
     * Timeout for Gemini API requests.
     */
    private Duration timeout = Duration.ofSeconds(35);

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public Duration getTimeout() {
        return timeout;
    }

    public void setTimeout(Duration timeout) {
        this.timeout = timeout;
    }
}

