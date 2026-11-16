import { EditTransactionRoute } from "@/features/transactions/EditTransactionRoute";

// Client-rendered behind the session check, so there is no instant shell to validate.
export const instant = false;

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EditTransactionRoute params={params} />;
}
