import Link from "next/link";
import { OrderLookupForm } from "@/features/used-phones/components/market/OrderLookupForm";
import { getSessionContext } from "@/features/used-phones/server/auth";

export const dynamic = "force-dynamic";

export default async function OrderLookupPage({ searchParams }: { searchParams: { orderNumber?: string } }) {
  const ctx = await getSessionContext();
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">주문조회</h1>
        <p className="text-sm text-zinc-500">주문 시 입력한 휴대폰번호와 비밀번호로 조회합니다.</p>
      </div>
      <OrderLookupForm defaultOrderNumber={searchParams.orderNumber ?? ""} />
      {ctx.user && (
        <p className="text-center text-sm text-zinc-500">
          로그인 상태로 주문했다면 <Link href="/my-orders" className="underline">내 주문</Link>에서 바로 확인할 수 있습니다.
        </p>
      )}
    </div>
  );
}
