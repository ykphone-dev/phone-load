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
import { DisputeStatusBadge, EmptyState } from "@/features/used-phones/components";
import { StatusFilterLinks } from "@/features/used-phones/components/admin";
import { adminListDisputes } from "@/features/used-phones/server/orders";
import { formatDateTime, formatKRW, productTitle } from "@/features/used-phones/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

type DisputeStatus = "OPEN" | "SELLER_REPLIED" | "RESOLVED";
const STATUSES: DisputeStatus[] = ["OPEN", "SELLER_REPLIED", "RESOLVED"];

type Props = { searchParams: { [key: string]: string | string[] | undefined } };

export default async function AdminDisputesPage({ searchParams }: Props) {
  const raw = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const status = STATUSES.includes(raw as DisputeStatus) ? (raw as DisputeStatus) : undefined;
  const disputes = await adminListDisputes(status);

  return (
    <AdminShell heading="분쟁 관리" description="구매자가 제기한 분쟁을 검토하고 주문의 최종 상태를 결정합니다.">
      <StatusFilterLinks
        basePath="/admin/disputes"
        current={status}
        options={[
          { label: "전체" },
          { value: "OPEN", label: "접수" },
          { value: "SELLER_REPLIED", label: "판매자 답변" },
          { value: "RESOLVED", label: "처리완료" },
        ]}
      />

      {disputes.length === 0 ? (
        <EmptyState title="분쟁이 없습니다." description="조건에 해당하는 분쟁이 없습니다." />
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
                <TableHead>사유</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>접수일</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((d) => (
                <TableRow key={d.id} className={d.status === "OPEN" ? "bg-red-50" : undefined}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/admin/phone-orders/${d.order.id}`} className="hover:underline">
                      {d.order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/phones/${d.order.product.id}`} className="hover:underline">
                      {productTitle(d.order.product)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/sellers/${d.order.seller.id}`} className="hover:underline">
                      {d.order.seller.businessName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {d.order.buyerName}
                    <p className="text-xs text-zinc-500">{d.order.buyerPhone}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatKRW(d.order.price)}</TableCell>
                  <TableCell className="max-w-[240px] truncate" title={d.reason}>
                    {d.reason}
                  </TableCell>
                  <TableCell>
                    <DisputeStatusBadge status={d.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-zinc-500">{formatDateTime(d.createdAt)}</TableCell>
                  <TableCell>
                    <Link href={`/admin/disputes/${d.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
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
