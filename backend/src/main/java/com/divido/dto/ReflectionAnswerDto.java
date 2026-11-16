package com.divido.dto;

/** One answer to one approved question. Used in requests and responses. */
public record ReflectionAnswerDto(String questionId, String answer) {
}
