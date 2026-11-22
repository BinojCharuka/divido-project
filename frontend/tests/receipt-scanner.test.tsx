import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReceiptScanModal } from "@/features/receipts/ReceiptScanModal";
import { TransactionFormDialog } from "@/features/transactions/TransactionFormDialog";
import * as receiptsApi from "@/lib/api/receipts";
import type { ReceiptScanResponse } from "@/types/receipt";

describe("ReceiptScanModal", () => {
  it("renders upload options and hints", () => {
    render(<ReceiptScanModal onClose={vi.fn()} onApply={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Receipt Scanner" })).toBeInTheDocument();
    expect(screen.getByText("Upload image")).toBeInTheDocument();
    expect(screen.getByText("Take photo")).toBeInTheDocument();
    expect(screen.getByText(/Supports JPG, PNG, WebP up to 10MB/i)).toBeInTheDocument();
  });

  it("shows an error when a non-image file is provided", async () => {
    render(<ReceiptScanModal onClose={vi.fn()} onApply={vi.fn()} />);

    const fakeFile = new File(["dummy text content"], "test.pdf", { type: "application/pdf" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    expect(await screen.findByText(/Please select a valid image file/i)).toBeInTheDocument();
  });

  it("scans image, renders extracted details, and invokes onApply callback", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onClose = vi.fn();

    const mockResponse: ReceiptScanResponse = {
      success: true,
      receiptQuality: {
        isReadable: true,
        isBlurry: false,
        warnings: ["Low resolution image. Please verify digits."],
      },
      merchant: {
        name: "Keells Super",
        branch: "Kollupitiya",
        address: "Galle Rd, Colombo",
        contact: "0112345678",
      },
      transaction: {
        date: "2026-11-22",
        time: "14:30",
        currency: "LKR",
        subtotal: 630.0,
        discount: 0,
        tax: 0,
        serviceCharge: 0,
        total: 630.0,
        amountPaid: 1000.0,
        change: 370.0,
      },
      items: [
        { name: "Fresh Milk 1L", quantity: 1, unitPrice: 450.0, totalPrice: 450.0 },
        { name: "Bread", quantity: 1, unitPrice: 180.0, totalPrice: 180.0 },
      ],
      expense: {
        purpose: "Grocery Shopping",
        suggestedCategory: "Groceries",
        matchedCategoryId: "cat-groceries-uuid",
      },
      confidence: {
        merchant: 0.95,
        date: 0.9,
        total: 0.98,
        purpose: 0.9,
      },
      rawText: "Keells Super Kollupitiya Total 630.00",
    };

    vi.spyOn(receiptsApi, "scanReceipt").mockResolvedValueOnce(mockResponse);

    render(<ReceiptScanModal onClose={onClose} onApply={onApply} />);

    const fakeImage = new File(["dummy image bytes"], "receipt.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, fakeImage);

    // Verify extracted details and memory purge notification are shown
    expect(await screen.findByText("Keells Super")).toBeInTheDocument();
    expect(screen.getByText("Details extracted • Cached receipt image deleted from memory")).toBeInTheDocument();
    expect(screen.getByText("LKR 630.00")).toBeInTheDocument();
    expect(screen.getByText("2026-11-22")).toBeInTheDocument();
    expect(screen.getByText(/Groceries/)).toBeInTheDocument();
    expect(screen.getByText("Low resolution image. Please verify digits.")).toBeInTheDocument();

    // Click "Populate Expense Form"
    const populateBtn = screen.getByRole("button", { name: "Populate Expense Form" });
    await user.click(populateBtn);

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({
      amount: "630",
      date: "2026-11-22",
      description: "Keells Super - Fresh Milk 1L, Bread",
      categoryId: "cat-groceries-uuid",
      purpose: "Grocery Shopping",
      merchantName: "Keells Super",
    });
  });

  it("temporarily caches preview and automatically revokes/purges it after extraction", async () => {
    const user = userEvent.setup();
    const mockCreateObjectURL = vi.fn().mockReturnValue("blob:http://localhost/receipt-123");
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const mockResponse: ReceiptScanResponse = {
      success: true,
      receiptQuality: { isReadable: true, isBlurry: false, warnings: [] },
      merchant: { name: "Arpico", branch: "Hyde Park", address: "Colombo", contact: "0112345678" },
      transaction: {
        total: 1200.0,
        date: "2026-11-22",
        currency: "LKR",
        time: "10:30",
        subtotal: 1200.0,
        discount: 0,
        tax: 0,
        serviceCharge: 0,
        amountPaid: 1200.0,
        change: 0,
      },
      rawText: "Arpico Supercentre 1200",
      items: [],
      expense: null,
      confidence: null,
    };
    vi.spyOn(receiptsApi, "scanReceipt").mockResolvedValueOnce(mockResponse);

    render(<ReceiptScanModal onClose={vi.fn()} onApply={vi.fn()} />);

    const file = new File(["receipt data"], "arpico.png", { type: "image/png" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    // Verify preview URL was created
    expect(mockCreateObjectURL).toHaveBeenCalledWith(file);

    // Verify extraction completes and cached image is purged from memory
    expect(await screen.findByText("Arpico")).toBeInTheDocument();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/receipt-123");
    expect(screen.getByText("Details extracted • Cached receipt image deleted from memory")).toBeInTheDocument();
  });
});

describe("TransactionFormDialog with AI Scan pre-population", () => {
  it("pre-populates values from initialValues and shows AI badge", async () => {
    render(
      <TransactionFormDialog
        type="EXPENSE"
        initialValues={{
          amount: "630.00",
          date: "2026-11-22",
          description: "Keells Super - Fresh Milk 1L, Bread",
          isAiScanned: true,
        }}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(screen.getByText(/Auto-filled from your receipt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Amount/)).toHaveValue("630.00");
    expect(screen.getByLabelText(/^Date/)).toHaveValue("2026-11-22");
    expect(screen.getByLabelText(/^Description/)).toHaveValue("Keells Super - Fresh Milk 1L, Bread");
  });
});
