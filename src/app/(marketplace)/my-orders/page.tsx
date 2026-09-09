import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, OrderStatusBadge } from "@/features/used-phones/components";
import { getSessionUser } from "@/features/used-phones/server/auth";
import { listMyOrders } from "@/features/used-phones/server/orders";
import { formatDateTime, formatKRW, productTitle } from "@/features/used-phones/utils";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?from=/my-orders");
  const orders = await listMyOrders();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">내 주문</h1>
      {orders.length === 0 ? (
        <EmptyState title="주문 내역이 없습니다">
          <Link href="/products" className="text-sm underline">상품 보러가기</Link>
        </EmptyState>
      ) : (
        <ul className="divide-y border-y">
          {orders.map((o) => {
            const image = o.product.images[0]?.imageUrl;
            return (
              <li key={o.id}>
                <Link href={`/order/${o.orderNumber}`} className="flex gap-4 py-4 hover:bg-zinc-50">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-zinc-100">
                    {image && <Image src={image} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="flex-1 space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-zinc-500">{o.orderNumber}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="font-medium">{productTitle(o.product)} · {o.product.color}</p>
                    <p className="text-zinc-500">{o.seller.businessName} · {formatDateTime(o.createdAt)}</p>
                    <p className="font-semibold">{formatKRW(o.price)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
