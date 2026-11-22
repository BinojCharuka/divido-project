export interface ReceiptQuality {
  isReadable: boolean;
  isBlurry: boolean;
  warnings: string[];
}

export interface MerchantInfo {
  name: string | null;
  branch: string | null;
  address: string | null;
  contact: string | null;
}

export interface TransactionInfo {
  date: string | null;
  time: string | null;
  currency: string;
  subtotal: number | null;
  discount: number | null;
  tax: number | null;
  serviceCharge: number | null;
  total: number | null;
  amountPaid: number | null;
  change: number | null;
}

export interface ReceiptItem {
  name: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
}

export interface ExpenseClassification {
  purpose: string | null;
  suggestedCategory: string | null;
  matchedCategoryId: string | null;
}

export interface ConfidenceScores {
  merchant: number | null;
  date: number | null;
  total: number | null;
  purpose: number | null;
}

export interface MappedTransaction {
  type: "EXPENSE";
  amount: string;
  date: string;
  categoryId?: string;
  description: string;
  paymentMethod?: string;
}

export interface ReceiptScanResponse {
  success: boolean;
  receiptQuality: ReceiptQuality;
  merchant: MerchantInfo | null;
  transaction: TransactionInfo | null;
  items: ReceiptItem[];
  expense: ExpenseClassification | null;
  confidence: ConfidenceScores | null;
  rawText: string | null;
  uncertainFields?: string[];
  mappedTransaction?: MappedTransaction | null;
  error?: string | null;
}
