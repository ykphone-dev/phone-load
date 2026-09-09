import { handle, readJsonOptional } from "@/features/used-phones/server/api";
import {
  adminReactivateSeller,
  adminSuspendSeller,
} from "@/features/used-phones/server/sellers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** body { reason?, reactivate?: true } */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const body = await readJsonOptional<{ reason?: string; reactivate?: boolean }>(request);
    return body.reactivate
      ? adminReactivateSeller(params.id)
      : adminSuspendSeller(params.id, body.reason);
  });
}
