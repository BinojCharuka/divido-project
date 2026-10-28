package com.divido.dto;

/** The CSRF token and the request header that must carry it. */
public record CsrfTokenResponse(String headerName, String token) {
}
