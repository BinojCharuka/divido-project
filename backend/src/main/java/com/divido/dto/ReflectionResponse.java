package com.divido.dto;

import java.time.Instant;
import java.util.List;

/** REFLECTION-001/002 response: the stored answers for one month, in question order. */
public record ReflectionResponse(String month,
                                 int questionSetVersion,
                                 int version,
                                 List<ReflectionAnswerDto> answers,
                                 Instant createdAt,
                                 Instant updatedAt) {
}
