import { handle, readJson } from "@/features/used-phones/server/api";
import { reportDeposit } from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** 구매자: 입금했습니다 { depositorName } */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderNumber: string } },
) {
  return handle(async () =>
    reportDeposit(params.orderNumber, await readJson(request)),
  );
}
