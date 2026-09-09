import { handle, readJsonOptional } from "@/features/used-phones/server/api";
import {
  sellerConfirmDeposit,
  sellerUnconfirmDeposit,
} from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** 판매자 실제 입금 확인. body { confirmed?: false } 면 입금 미확인 처리 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const body = await readJsonOptional<{ confirmed?: boolean }>(request);
    return body.confirmed === false
      ? sellerUnconfirmDeposit(params.id)
      : sellerConfirmDeposit(params.id);
  });
}
