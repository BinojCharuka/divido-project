import { apiRequest } from "@/lib/api/client";
import type {
  Transaction,
  TransactionCreate,
  TransactionFilters,
  TransactionPage,
  TransactionUpdate,
} from "@/types/transaction";

/**
 * Transaction API client functions implementing docs/05-api/transactions-api.md.
 */

export async function listTransactions(filters: TransactionFilters = {}): Promise<TransactionPage> {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.set("page", String(filters.page));
  if (filters.size !== undefined) params.set("size", String(filters.size));
  if (filters.type) params.set("type", filters.type);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.incomeSourceId) params.set("incomeSourceId", filters.incomeSourceId);

  const query = params.toString();
  const path = `/api/v1/transactions${query ? `?${query}` : ""}`;
  return apiRequest<TransactionPage>(path, { method: "GET" });
}

export async function getTransaction(id: string): Promise<Transaction> {
  return apiRequest<Transaction>(`/api/v1/transactions/${encodeURIComponent(id)}`, { method: "GET" });
}

export async function createTransaction(input: TransactionCreate): Promise<Transaction> {
  return apiRequest<Transaction>("/api/v1/transactions", {
    method: "POST",
    body: input,
  });
}

export async function updateTransaction(id: string, input: TransactionUpdate): Promise<Transaction> {
  return apiRequest<Transaction>(`/api/v1/transactions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  return apiRequest<void>(`/api/v1/transactions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
