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
import { SectionTitle, StatCard } from "@/features/used-phones/components";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/features/used-phones/constants";
import { adminDashboardStats } from "@/features/used-phones/server/orders";
import { formatKRW } from "@/features/used-phones/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MarketplaceDashboardPage() {
  const stats = await adminDashboardStats();
  const totalByStatus = ORDER_STATUSES.reduce((a, s) => a + (stats.byStatus[s] ?? 0), 0);

  return (
    <AdminShell heading="중고폰 현황" description="중고폰 마켓플레이스 운영 지표 요약입니다.">
      <section className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/sellers?status=PENDING" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          승인 대기 판매자 보기
        </Link>
        <Link href="/admin/disputes?status=OPEN" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          진행중 분쟁 보기
        </Link>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="입점 판매자 수" value={stats.approvedSellers.toLocaleString("ko-KR")} hint="승인 상태 판매자" />
        <StatCard label="판매중 상품 수" value={stats.onSaleProducts.toLocaleString("ko-KR")} />
        <StatCard label="오늘 상품 등록 수" value={stats.productsToday.toLocaleString("ko-KR")} hint="오늘 0시 이후 등록" />
        <StatCard label="주문 수" value={stats.totalOrders.toLocaleString("ko-KR")} hint="전체 누적" />
        <StatCard label="입금완료 주문 수" value={stats.depositConfirmed.toLocaleString("ko-KR")} hint="판매자 입금확인 이후 단계" />
        <StatCard label="거래완료 수" value={stats.completed.toLocaleString("ko-KR")} />
        <StatCard label="거래금액 GMV" value={formatKRW(stats.gmv)} hint="거래완료 주문 합계" />
        <StatCard label="분쟁률" value={`${stats.disputeRate}%`} hint="분쟁 발생 주문 / 전체 주문" />
      </section>

      <section className="max-w-2xl">
        <SectionTitle>주문 상태별 건수</SectionTitle>
        <div className="overflow-x-auto border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">건수</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ORDER_STATUSES.map((s) => {
                const n = stats.byStatus[s] ?? 0;
                return (
                  <TableRow key={s} className={n === 0 ? "text-zinc-400" : undefined}>
                    <TableCell>{ORDER_STATUS_LABEL[s]}</TableCell>
                    <TableCell className="text-right tabular-nums">{n.toLocaleString("ko-KR")}</TableCell>
                    <TableCell className="text-right">
                      {n > 0 && (
                        <Link href={`/admin/phone-orders?status=${s}`} className="text-xs underline">
                          보기
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-semibold">
                <TableCell>합계</TableCell>
                <TableCell className="text-right tabular-nums">{totalByStatus.toLocaleString("ko-KR")}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>
    </AdminShell>
  );
}
