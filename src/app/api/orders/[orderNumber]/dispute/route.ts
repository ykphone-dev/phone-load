import { handle, readJson } from "@/features/used-phones/server/api";
import { openDispute } from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** 구매자: 문제가 해결되지 않았습니다 → 분쟁 접수 */
export async function POST(request: NextRequest, { params }: { params: { orderNumber: string } }) {
  return handle(async () => openDispute(params.orderNumber, await readJson(request)));
}
