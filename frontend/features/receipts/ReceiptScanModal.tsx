"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  FileText,
  Loader2,
  Receipt,
  RotateCcw,
  Sparkles,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { scanReceipt } from "@/lib/api/receipts";
import type { ReceiptScanResponse } from "@/types/receipt";

export interface ExtractedExpenseData {
  amount: string;
  date: string;
  description: string;
  categoryId?: string;
  purpose?: string;
  merchantName?: string;
}

interface ReceiptScanModalProps {
  onClose: () => void;
  onApply: (data: ExtractedExpenseData) => void;
}

export function ReceiptScanModal({ onClose, onApply }: ReceiptScanModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showItems, setShowItems] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image file exceeds the 10MB size limit.");
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    let url: string | null = null;
    try {
      if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
        url = URL.createObjectURL(file);
      }
    } catch {
      // Vitest / environment fallback
    }
    setPreviewUrl(url);

    // Auto-start scanning on selection for smooth UX
    triggerScan(file);
  };

  const triggerScan = async (file: File) => {
    setScanning(true);
    setErrorMessage(null);
    setScanResult(null);

    try {
      const result = await scanReceipt(file);
      if (!result.success) {
        setErrorMessage(
          result.receiptQuality?.warnings?.[0] ||
            "Receipt could not be analyzed. Please ensure image is clear and try again."
        );
      } else {
        setScanResult(result);
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to scan receipt. Please try again.";
      setErrorMessage(errorMsg);
    } finally {
      setScanning(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleReset = () => {
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {
        // Safe fallback
      }
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setErrorMessage(null);
    setScanning(false);
  };

  const handleApplyToForm = () => {
    if (!scanResult || !scanResult.transaction) return;

    const tx = scanResult.transaction;
    const merchant = scanResult.merchant?.name || "";
    const purpose = scanResult.expense?.purpose || "";

    // Generate descriptive text: "Merchant - Item1, Item2" or purpose
    let desc = merchant;
    if (scanResult.items && scanResult.items.length > 0) {
      const itemNames = scanResult.items
        .map((i) => i.name)
        .slice(0, 3)
        .join(", ");
      desc = merchant ? `${merchant} - ${itemNames}` : itemNames;
    } else if (purpose) {
      desc = merchant ? `${merchant} (${purpose})` : purpose;
    }

    onApply({
      amount: tx.total != null ? String(tx.total) : "",
      date: tx.date || new Date().toISOString().split("T")[0],
      description: desc,
      categoryId: scanResult.expense?.matchedCategoryId || undefined,
      purpose: purpose || undefined,
      merchantName: merchant || undefined,
    });
  };

  return (
    <Modal
      className="receipt-scan-modal max-w-lg"
      title="AI Smart Receipt Scanner"
      eyebrow="POWERED BY GEMINI"
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 text-zinc-200">
        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
          }}
        />

        {/* Error Alert */}
        {errorMessage && (
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs"
            role="alert"
          >
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Scanning Error</span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* State 1: Upload or Capture */}
        {!selectedFile && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl text-center transition-colors cursor-pointer ${
              isDragOver
                ? "border-emerald-400 bg-emerald-950/20"
                : "border-white/[0.12] hover:border-emerald-500/40 bg-[#0a110d]"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#34d399] flex items-center justify-center mb-3 shadow-inner">
              <Receipt size={28} strokeWidth={2} />
            </div>

            <h4 className="text-sm font-semibold text-white mb-1">
              Drop your receipt here, or browse
            </h4>
            <p className="text-xs text-zinc-400 max-w-xs mb-4">
              Upload a clear photo or screenshot of your receipt. Gemini AI will extract merchant,
              items, totals and category.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                className="!text-xs !py-2 !px-3.5 flex items-center gap-1.5"
              >
                <Upload size={14} />
                <span>Upload image</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => cameraInputRef.current?.click()}
                className="!text-xs !py-2 !px-3.5 flex items-center gap-1.5"
              >
                <Camera size={14} />
                <span>Take photo</span>
              </Button>
            </div>

            <span className="text-[10px] text-zinc-500 mt-3">
              Supports JPG, PNG, WebP up to 10MB
            </span>
          </div>
        )}

        {/* State 2: Preview & Scanning Animation */}
        {selectedFile && scanning && (
          <div className="flex flex-col items-center justify-center p-6 bg-[#0a110d] border border-white/[0.08] rounded-2xl text-center relative overflow-hidden">
            {/* Visual Scan Line Animation */}
            <div className="relative w-40 h-48 rounded-xl overflow-hidden border border-emerald-500/30 shadow-lg mb-4 bg-zinc-900">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  className="w-full h-full object-cover filter brightness-75"
                />
              )}
              {/* Laser scanning beam */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#34d399] to-transparent shadow-[0_0_12px_#34d399] animate-pulse top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
              <Loader2 size={16} className="animate-spin text-[#34d399]" />
              <span>Analyzing with Gemini AI...</span>
            </div>
            <p className="text-xs text-zinc-400">
              Extracting line items, totals, dates, and matching categories.
            </p>
          </div>
        )}

        {/* State 3: Extraction Result */}
        {selectedFile && !scanning && scanResult && (
          <div className="flex flex-col gap-3">
            {/* Quality Warnings */}
            {scanResult.receiptQuality?.warnings &&
              scanResult.receiptQuality.warnings.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block">Quality Notice</span>
                    <ul className="list-disc list-inside mt-0.5 text-[11px] text-amber-300/90 space-y-0.5">
                      {scanResult.receiptQuality.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            {/* Extracted Details Card */}
            <div className="p-4 rounded-xl bg-[#111914] border border-white/[0.08] flex flex-col gap-3">
              {/* Header: Merchant & Total */}
              <div className="flex items-start justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-400">Merchant</span>
                  <span className="text-base font-bold text-white">
                    {scanResult.merchant?.name || "Unidentified Merchant"}
                  </span>
                  {scanResult.merchant?.branch && (
                    <span className="text-[11px] text-zinc-400">
                      {scanResult.merchant.branch}
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-xs text-zinc-400">Extracted Total</span>
                  <span className="text-lg font-bold text-[#34d399] tracking-tight">
                    {scanResult.transaction?.currency || "LKR"}{" "}
                    {scanResult.transaction?.total != null
                      ? Number(scanResult.transaction.total).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"}
                  </span>
                </div>
              </div>

              {/* Grid: Date, Category & Purpose */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#18231c] border border-white/[0.05]">
                  <span className="text-zinc-400 block text-[10px] uppercase font-medium">
                    Transaction Date
                  </span>
                  <span className="font-semibold text-white mt-0.5 block">
                    {scanResult.transaction?.date || "Not detected"}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#18231c] border border-white/[0.05]">
                  <span className="text-zinc-400 block text-[10px] uppercase font-medium">
                    Suggested Category
                  </span>
                  <span className="font-semibold text-[#34d399] mt-0.5 flex items-center gap-1">
                    <Sparkles size={12} />
                    {scanResult.expense?.suggestedCategory || "Groceries"}
                  </span>
                </div>
              </div>

              {/* Optional: Financial Breakdown Details */}
              {(scanResult.transaction?.subtotal != null ||
                scanResult.transaction?.tax != null ||
                scanResult.transaction?.discount != null) && (
                <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 pt-1">
                  {scanResult.transaction?.subtotal != null && (
                    <span>Subtotal: {scanResult.transaction.subtotal}</span>
                  )}
                  {scanResult.transaction?.tax != null && scanResult.transaction.tax > 0 && (
                    <span>Tax: {scanResult.transaction.tax}</span>
                  )}
                  {scanResult.transaction?.discount != null && scanResult.transaction.discount > 0 && (
                    <span>Discount: -{scanResult.transaction.discount}</span>
                  )}
                </div>
              )}

              {/* Items Accordion Toggle */}
              {scanResult.items && scanResult.items.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowItems(!showItems)}
                    className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer py-1"
                  >
                    <span>
                      Purchased Items ({scanResult.items.length})
                    </span>
                    {showItems ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showItems && (
                    <div className="mt-2 flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                      {scanResult.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white/[0.02]"
                        >
                          <span className="text-zinc-300 truncate max-w-[200px]">
                            {item.quantity ? `${item.quantity}x ` : ""}
                            {item.name}
                          </span>
                          <span className="text-zinc-400 font-mono">
                            {item.totalPrice != null
                              ? Number(item.totalPrice).toFixed(2)
                              : item.unitPrice != null
                              ? Number(item.unitPrice).toFixed(2)
                              : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Form Populate Action */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                className="!text-xs !py-2.5 flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>Scan another</span>
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={handleApplyToForm}
                className="flex-1 !text-xs !py-2.5 flex items-center justify-center gap-1.5 !bg-[#34d399] !text-[#07100b] hover:!bg-[#22c55e]"
              >
                <CheckCircle2 size={16} />
                <span>Populate Expense Form</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
