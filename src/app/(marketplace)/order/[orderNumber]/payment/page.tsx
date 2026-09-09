import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderStatusBadge } from "@/features/used-phones/components";
import { BankTransferPanel } from "@/features/used-phones/components/market/BankTransferPanel";
import { DepositCountdown } from "@/features/used-phones/components/market/DepositCountdown";
import { DepositReportForm } from "@/features/used-phones/components/market/DepositReportForm";
import { AppError } from "@/features/used-phones/server/errors";
import { getBuyerOrderView } from "@/features/used-phones/server/orders";
import { productTitle } from "@/features/used-phones/utils";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ params }: { params: { orderNumber: string } }) {
  let order: Awaited<ReturnType<typeof getBuyerOrderView>>;
  try {
    order = await getBuyerOrderView(params.orderNumber);
  } catch (err) {
    if (err instanceof AppError && err.status === 403) redirect(`/order/lookup?orderNumber=${params.orderNumber}`);
    notFound();
  }

  if (order.status !== "WAITING_DEPOSIT") {
    redirect(`/order/${order.orderNumber}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-1 text-center">
        <p className="text-sm text-zinc-500">주문이 접수되었습니다</p>
        <h1 className="text-2xl font-semibold">계좌이체 안내</h1>
        <p className="font-mono text-sm">{order.orderNumber}</p>
        <div className="flex items-center justify-center gap-2 pt-1 text-sm">
          <OrderStatusBadge status={order.status} />
          <DepositCountdown reservedUntil={order.reservedUntil ? order.reservedUntil.toISOString() : null} />
        </div>
      </div>

      <div className="border p-4 text-sm">
        <p className="font-medium">{productTitle(order.product)} · {order.product.color}</p>
        <p className="text-zinc-500">{order.seller.businessName}</p>
      </div>

      <BankTransferPanel amount={order.price} seller={order.seller} />

      <DepositReportForm orderNumber={order.orderNumber} defaultName={order.buyerName} />

      <div className="flex justify-between text-xs text-zinc-500">
        <Link href={`/order/${order.orderNumber}`} className="underline">주문 상세 보기</Link>
        <Link href="/products" className="underline">쇼핑 계속하기</Link>
      </div>
    </div>
  );
}
