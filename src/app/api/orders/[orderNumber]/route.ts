import { handle } from "@/features/used-phones/server/api";
import { getBuyerOrderView } from "@/features/used-phones/server/orders";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: { orderNumber: string } },
) {
  return handle(() => getBuyerOrderView(params.orderNumber));
}
