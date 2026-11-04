import type { KakeiboGroup } from "./category";

/**
 * Transaction models matching docs/05-api/transactions-api.md and docs/05-api/openapi.yaml.
 */

export type TransactionType = "INCOME" | "EXPENSE";

export type PaymentMethod = "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "BANK_TRANSFER" | "OTHER";

export interface TransactionCategory {
  id: string;
  name: string;
  group: KakeiboGroup;
}

export interface IncomeSourceRef {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string; // Transmitted as decimal string, e.g. "2400.00"
  date: string; // ISO date-only: "YYYY-MM-DD"
  category?: TransactionCategory | null;
  incomeSource?: IncomeSourceRef | null;
  description?: string | null;
  paymentMethod?: PaymentMethod | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCreate {
  type: TransactionType;
  amount: string;
  date: string;
  categoryId?: string;
  incomeSourceId?: string;
  description?: string;
  paymentMethod?: string;
}

/**
 * PATCH body. Omitted fields are left unchanged; `null` clears an optional field
 * (income source, description, payment method), matching the backend's
 * presence-tracking update semantics.
 */
export interface TransactionUpdate {
  amount?: string;
  date?: string;
  categoryId?: string;
  incomeSourceId?: string | null;
  description?: string | null;
  paymentMethod?: string | null;
}

export interface TransactionPage {
  items: Transaction[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface TransactionFilters {
  page?: number;
  size?: number;
  type?: TransactionType;
  from?: string;
  to?: string;
  categoryId?: string;
  incomeSourceId?: string;
}
