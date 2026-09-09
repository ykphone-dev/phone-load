import { handle, readJsonOptional } from "@/features/used-phones/server/api";
import {
  sellerApproveCancel,
  sellerCancelBeforeDeposit,
} from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** 취소 승인(입금 후) 또는 판매자 직접 취소(입금 전). body { reason? } */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const body = await readJsonOptional<{ reason?: string; beforeDeposit?: boolean }>(request);
    return body.beforeDeposit
      ? sellerCancelBeforeDeposit(params.id, body.reason)
      : sellerApproveCancel(params.id);
  });
}
