import { handle, readJson } from "@/features/used-phones/server/api";
import { adminRejectSeller } from "@/features/used-phones/server/sellers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const { reason } = await readJson<{ reason: string }>(request);
    return adminRejectSeller(params.id, reason);
  });
}
