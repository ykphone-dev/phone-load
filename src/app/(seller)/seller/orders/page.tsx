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
} from "@/features/used-phones/components";
import {
  ORDER_STATUSES,
  type OrderStatus,
} from "@/features/used-phones/constants";
import { listSellerOrders } from "@/features/used-phones/server/orders";
import { guardSellerPage } from "@/features/used-phones/server/seller-guard";
import {
  formatDateTime,
  formatKRW,
  productTitle,
} from "@/features/used-phones/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FILTERS: { label: string; value?: OrderStatus }[] = [
  { label: "전체" },
  { label: "입금대기", value: "WAITING_DEPOSIT" },
  { label: "입금확인 요청", value: "DEPOSIT_REPORTED" },
  { label: "입금확인", value: "DEPOSIT_CONFIRMED" },
  { label: "배송준비", value: "PREPARING" },
  { label: "배송중", value: "SHIPPED" },
  { label: "배송완료", value: "DELIVERED" },
  { label: "거래완료", value: "COMPLETED" },
  { label: "취소요청", value: "CANCEL_REQUESTED" },
  { label: "환불요청", value: "REFUND_REQUESTED" },
  { label: "분쟁", value: "DISPUTED" },
];

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  await guardSellerPage();
  const raw = searchParams?.status;
  const status = ORDER_STATUSES.includes(raw as OrderStatus)
    ? (raw as OrderStatus)
    : undefined;
  const orders = await listSellerOrders(status);

  return (
    <div className="space-y-6">
      <SectionTitle>주문관리</SectionTitle>

      <nav className="flex flex-wrap gap-1 border-b">
        {FILTERS.map((f) => {
          const active = f.value === status;
          return (
            <Link
              key={f.label}
              href={
                f.value ? `/seller/orders?status=${f.value}` : "/seller/orders"
              }
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm",
                active
                  ? "border-black font-medium text-black"
                  : "border-transparent text-zinc-500 hover:text-black",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <EmptyState
          title="주문이 없습니다"
          description={
            status
              ? "해당 상태의 주문이 없습니다."
              : "아직 들어온 주문이 없습니다."
          }
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
                <TableHead>입금표시 시각</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {o.orderNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{productTitle(o.product)}</div>
                    <div className="text-xs text-zinc-500">
                      {o.product.color}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{o.buyerName}</div>
                    <div className="text-xs text-zinc-500">{o.buyerPhone}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    {formatKRW(o.price)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-zinc-500">
                    {formatDateTime(o.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-zinc-500">
                    {o.transferReport?.buyerReportedAt
                      ? formatDateTime(o.transferReport.buyerReportedAt)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/seller/orders/${o.id}`}>상세</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
