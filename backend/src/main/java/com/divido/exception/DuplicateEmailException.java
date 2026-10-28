package com.divido.exception;

public class DuplicateEmailException extends RuntimeException {

    public DuplicateEmailException(Throwable cause) {
        super("Email is already registered", cause);
    }
}
