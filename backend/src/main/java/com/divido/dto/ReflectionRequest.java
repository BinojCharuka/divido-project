package com.divido.dto;

import java.util.List;

/**
 * REFLECTION-002 body. {@code version} is absent for a first save and is the
 * version last read for an edit (DEC-039). Unknown fields are ignored (DEC-026).
 */
public record ReflectionRequest(Integer version, List<ReflectionAnswerDto> answers) {
}
