import { handle } from "@/features/used-phones/server/api";
import { adminApproveSeller } from "@/features/used-phones/server/sellers";

export const dynamic = "force-dynamic";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  return handle(() => adminApproveSeller(params.id));
}
