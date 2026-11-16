package com.divido.exception;

/**
 * DEC-039: the save was based on a version that is no longer current, or a first
 * save found that a reflection already exists for the month.
 */
public class ReflectionConflictException extends RuntimeException {

    public ReflectionConflictException() {
        super("This reflection was changed somewhere else. Reload it before saving again.");
    }
}
