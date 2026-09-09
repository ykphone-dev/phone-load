import AdminShell from "@/components/admin/AdminShell";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, OrderStatusBadge } from "@/features/used-phones/components";
import { StatusFilterLinks } from "@/features/used-phones/components/admin";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from "@/features/used-phones/constants";
import { adminListOrders } from "@/features/used-phones/server/orders";
import { formatDateTime, formatKRW, productTitle } from "@/features/used-phones/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { searchParams: { [key: string]: string | string[] | undefined } };

export default async function AdminPhoneOrdersPage({ searchParams }: Props) {
  const raw = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const status = ORDER_STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : undefined;
  const orders = await adminListOrders(status);

  return (
    <AdminShell heading="중고폰 주문" description="전체 주문을 조회하고 필요 시 판매자·구매자를 대신해 상태를 처리합니다.">
      <StatusFilterLinks
        basePath="/admin/phone-orders"
        current={status}
        options={[{ label: "전체" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))]}
      />

      {orders.length === 0 ? (
        <EmptyState title="주문이 없습니다." description="조건에 해당하는 주문이 없습니다." />
      ) : (
        <div className="overflow-x-auto border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>주문번호</TableHead>
                <TableHead>상품</TableHead>
                <TableHead>판매자</TableHead>
                <TableHead>구매자</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>주문일시</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className={o.status === "DISPUTED" ? "bg-red-50" : undefined}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/admin/phone-orders/${o.id}`} className="hover:underline">
                      {o.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/phones/${o.product.id}`} className="hover:underline">
                      {productTitle(o.product)}
                    </Link>
                    <p className="text-xs text-zinc-500">{o.product.color}</p>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/sellers/${o.seller.id}`} className="hover:underline">
                      {o.seller.businessName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {o.buyerName}
                    <p className="text-xs text-zinc-500">{o.buyerPhone}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatKRW(o.price)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-zinc-500">{formatDateTime(o.createdAt)}</TableCell>
                  <TableCell>
                    <Link href={`/admin/phone-orders/${o.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      상세
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminShell>
  );
}
