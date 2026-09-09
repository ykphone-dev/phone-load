import { handle, readJsonOptional } from "@/features/used-phones/server/api";
import { sellerDecideRefund } from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** 판매자 환불 처리 { decision: "REFUNDED" | "REJECTED", note? } (기본 REFUNDED) */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const body = await readJsonOptional<{ decision?: "REFUNDED" | "REJECTED"; note?: string }>(request);
    return sellerDecideRefund(params.id, { decision: body.decision ?? "REFUNDED", note: body.note });
  });
}
