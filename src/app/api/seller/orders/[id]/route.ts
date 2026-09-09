import { handle } from "@/features/used-phones/server/api";
import { getSellerOrderView } from "@/features/used-phones/server/orders";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return handle(() => getSellerOrderView(params.id));
}
