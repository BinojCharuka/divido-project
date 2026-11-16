import { TransactionDeepLink } from "@/features/transactions/TransactionDeepLink";

// Client-rendered behind the session check, so there is no instant shell to validate.
export const instant = false;

/** Deep link: opens the expense form over the transaction list. */
export default function Page() {
  return <TransactionDeepLink type="EXPENSE" />;
}
