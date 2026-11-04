package com.divido.exception;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/** Several field rules failed at once; each entry becomes a {@code fieldErrors} item. */
public class ValidationErrorsException extends RuntimeException {

    private final Map<String, String> fieldErrors;

    public ValidationErrorsException(Map<String, String> fieldErrors) {
        super("Validation failed.");
        this.fieldErrors = Collections.unmodifiableMap(new LinkedHashMap<>(fieldErrors));
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
