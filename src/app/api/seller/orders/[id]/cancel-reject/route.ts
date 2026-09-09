import { handle, readJsonOptional } from "@/features/used-phones/server/api";
import { sellerRejectCancel } from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const body = await readJsonOptional<{ note?: string }>(request);
    return sellerRejectCancel(params.id, body.note);
  });
}
