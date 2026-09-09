import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EmptyState,
  OrderStatusBadge,
  SectionTitle,
  StatCard,
} from "@/features/used-phones/components";
import {
  listSellerOrders,
  sellerOrderStats,
} from "@/features/used-phones/server/orders";
import { sellerProductStats } from "@/features/used-phones/server/products";
import { guardSellerPage } from "@/features/used-phones/server/seller-guard";
import {
  formatDateTime,
  formatKRW,
  productTitle,
} from "@/features/used-phones/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const IN_PROGRESS = [
  "WAITING_DEPOSIT",
  "DEPOSIT_REPORTED",
  "DEPOSIT_CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
] as const;

function sum(stats: Partial<Record<string, number>>, keys: readonly string[]) {
  return keys.reduce((acc, k) => acc + (stats[k] ?? 0), 0);
}

export default async function SellerDashboardPage() {
  const { seller } = await guardSellerPage();

  const [productStats, orderStats, todo] = await Promise.all([
    sellerProductStats(),
    sellerOrderStats(),
    listSellerOrders([
      "DEPOSIT_REPORTED",
      "CANCEL_REQUESTED",
      "REFUND_REQUESTED",
      "DISPUTED",
      "DEPOSIT_CONFIRMED",
      "PREPARING",
    ]),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">대시보드</h1>
          <p className="text-sm text-zinc-500">{seller.businessName}</p>
        </div>
        <Button asChild>
          <Link href="/seller/products/new">상품 등록</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="판매중 상품" value={productStats.ON_SALE ?? 0} />
        <StatCard
          label="주문 진행중"
          value={sum(orderStats, IN_PROGRESS)}
          hint="입금대기~배송완료"
        />
        <StatCard
          label="입금확인 대기"
          value={orderStats.DEPOSIT_REPORTED ?? 0}
          hint="구매자가 입금완료를 표시함"
        />
        <StatCard
          label="배송 대기"
          value={sum(orderStats, ["DEPOSIT_CONFIRMED", "PREPARING"])}
          hint="입금확인 후 송장 미등록"
        />
        <StatCard label="거래완료" value={orderStats.COMPLETED ?? 0} />
      </div>

      <section>
        <SectionTitle
          right={
            <Link
              href="/seller/orders"
              className="text-sm text-zinc-500 underline-offset-4 hover:underline"
            >
              전체 주문 보기
            </Link>
          }
        >
          처리가 필요한 주문
        </SectionTitle>
        {todo.length === 0 ? (
          <EmptyState
            title="처리할 주문이 없습니다"
            description="입금확인, 배송, 취소·환불·분쟁 요청이 여기에 표시됩니다."
          />
        ) : (
          <div className="overflow-x-auto border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>주문번호</TableHead>
                  <TableHead>상품</TableHead>
                  <TableHead>구매자</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>주문일시</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {todo.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">
                      {o.orderNumber}
                    </TableCell>
                    <TableCell>{productTitle(o.product)}</TableCell>
                    <TableCell>{o.buyerName}</TableCell>
                    <TableCell className="text-right">
                      {formatKRW(o.price)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-zinc-500">
                      {formatDateTime(o.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/seller/orders/${o.id}`}>처리</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
