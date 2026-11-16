package com.divido.service;

import java.util.List;

/**
 * Approved reflection question sets (DEC-034). Only these IDs are accepted; the
 * question wording lives in the frontend. A new set gets a new version so stored
 * answers never need rewriting.
 */
public final class ReflectionQuestions {

    public static final int CURRENT_VERSION = 1;

    /** Version 1, in display order. All questions are optional. */
    public static final List<String> V1 = List.of("what-went-well", "what-felt-difficult", "what-to-change");

    private ReflectionQuestions() {
    }

    public static List<String> current() {
        return V1;
    }
}
