import { handle, readJsonOptional } from "@/features/used-phones/server/api";
import { buyerMarkDelivered, completeOrder } from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** POST { action?: "DELIVERED" | "COMPLETE" } 기본 COMPLETE(구매확정) */
export async function POST(request: NextRequest, { params }: { params: { orderNumber: string } }) {
  return handle(async () => {
    const body = await readJsonOptional<{ action?: "DELIVERED" | "COMPLETE" }>(request);
    return body.action === "DELIVERED"
      ? buyerMarkDelivered(params.orderNumber)
      : completeOrder(params.orderNumber);
  });
}
