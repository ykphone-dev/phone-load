import { handle, readJsonOptional } from "@/features/used-phones/server/api";
import {
  cancelBeforeDeposit,
  requestCancel,
} from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 구매자 취소. 입금 전이면 즉시 취소, 입금확인 후면 취소요청.
 * body: { reason?: string, afterDeposit?: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderNumber: string } },
) {
  return handle(async () => {
    const body = await readJsonOptional<{
      reason?: string;
      afterDeposit?: boolean;
    }>(request);
    return body.afterDeposit
      ? requestCancel(params.orderNumber, body)
      : cancelBeforeDeposit(params.orderNumber, body);
  });
}
