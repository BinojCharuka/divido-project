package com.divido.dto;

import java.time.Instant;
import java.util.List;

/** REFLECTION-003: months that have a reflection. Never includes answer text (DEC-038). */
public record ReflectionListResponse(List<Item> items) {

    public record Item(String month, int answeredCount, Instant updatedAt) {
    }
}
