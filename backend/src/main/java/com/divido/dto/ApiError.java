package com.divido.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/**
 * Error body from the proposed OpenAPI {@code ApiError} schema. {@code requestId}
 * is not emitted because no correlation ID exists yet.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(int status, String code, String message, Map<String, String> fieldErrors) {
    public ApiError(int status, String code, String message) {
        this(status, code, message, null);
    }

    public ApiError(String code, String message) {
        this(400, code, message, null);
    }
}
