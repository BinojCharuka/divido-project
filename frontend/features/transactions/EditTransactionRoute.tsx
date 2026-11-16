"use client";

import { use } from "react";
import { TransactionDeepLink } from "./TransactionDeepLink";

/** Deep link: loads the transaction and opens its edit form. */
export function EditTransactionRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TransactionDeepLink editId={id} />;
}
