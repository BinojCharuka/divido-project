import { TransactionsRoute } from "@/features/transactions/TransactionsRoute";

// Client-rendered behind the session check, so there is no instant shell to validate.
export const instant = false;

export default function Page() {
  return <TransactionsRoute />;
}
