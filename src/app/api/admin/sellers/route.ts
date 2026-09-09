import { handle, searchParamsToObject } from "@/features/used-phones/server/api";
import { adminListSellers } from "@/features/used-phones/server/sellers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { status } = searchParamsToObject(request.url);
  return handle(() => adminListSellers(status as any));
}
