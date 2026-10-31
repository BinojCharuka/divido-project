import { isValidMoneyAmount } from "@/lib/formatting/money";
import type { TransactionCreate, TransactionUpdate } from "@/types/transaction";

export type FieldErrors = Record<string, string>;

/**
 * Validates an expense entry matching AC-006, AC-007, and BR-003.
 */
export function validateExpense(input: Partial<TransactionCreate> | Partial<TransactionUpdate>): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.amount || !isValidMoneyAmount(input.amount)) {
    errors.amount = "Please enter a valid amount greater than 0.";
  }

  if (!input.categoryId || input.categoryId.trim() === "") {
    errors.categoryId = "Please choose a category.";
  }

  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.date = "Please select a valid date.";
  }

  if (input.description && input.description.length > 500) {
    errors.description = "Description cannot exceed 500 characters.";
  }

  return errors;
}

/**
 * Validates an income entry matching AC-009 and BR-003.
 */
export function validateIncome(input: Partial<TransactionCreate> | Partial<TransactionUpdate>): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.amount || !isValidMoneyAmount(input.amount)) {
    errors.amount = "Please enter a valid amount greater than 0.";
  }

  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.date = "Please select a valid date.";
  }

  if (input.description && input.description.length > 500) {
    errors.description = "Description cannot exceed 500 characters.";
  }

  return errors;
}
