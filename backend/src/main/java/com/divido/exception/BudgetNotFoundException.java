package com.divido.exception;

/** No plan exists for the authenticated user and the requested month. */
public class BudgetNotFoundException extends RuntimeException {

    public BudgetNotFoundException() {
        super("No budget has been set for this month.");
    }
}
