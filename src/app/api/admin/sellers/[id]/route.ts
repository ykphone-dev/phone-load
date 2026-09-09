import { handle } from "@/features/used-phones/server/api";
import { adminGetSeller } from "@/features/used-phones/server/sellers";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return handle(() => adminGetSeller(params.id));
}
