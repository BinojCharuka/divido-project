package com.divido.exception;

/** The signed-in user has no reflection for the requested month. */
public class ReflectionNotFoundException extends RuntimeException {

    public ReflectionNotFoundException() {
        super("No reflection has been saved for this month.");
    }
}
