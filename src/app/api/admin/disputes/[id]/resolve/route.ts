import { handle, readJson } from "@/features/used-phones/server/api";
import { adminResolveDispute } from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** { adminNote, resolutionStatus: COMPLETED | REFUNDED | CANCELLED } */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => adminResolveDispute(params.id, await readJson(request)));
}
