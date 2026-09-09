import { handle, readJson } from "@/features/used-phones/server/api";
import {
  confirmRefund,
  requestRefund,
  withdrawRefund,
} from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
type Ctx = { params: { orderNumber: string } };

/** 구매자 환불 요청 */
export async function POST(request: NextRequest, { params }: Ctx) {
  return handle(async () => requestRefund(params.orderNumber, await readJson(request)));
}

/** PATCH { action: "CONFIRM" | "WITHDRAW" } : 환불금 확인 / 요청 철회 */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { action } = await readJson<{ action: "CONFIRM" | "WITHDRAW" }>(request);
    return action === "WITHDRAW"
      ? withdrawRefund(params.orderNumber)
      : confirmRefund(params.orderNumber);
  });
}
