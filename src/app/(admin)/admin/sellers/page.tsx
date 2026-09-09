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
import { EmptyState, SellerStatusBadge } from "@/features/used-phones/components";
import { StatusFilterLinks } from "@/features/used-phones/components/admin";
import { adminListSellers } from "@/features/used-phones/server/sellers";
import { formatDateTime } from "@/features/used-phones/utils";
import type { SelectSeller } from "@/lib/supabase/schema";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUSES: SelectSeller["status"][] = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

type Props = { searchParams: { [key: string]: string | string[] | undefined } };

function formatBusinessNumber(v: string) {
  const d = v.replace(/[^0-9]/g, "");
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : v;
}

function formatPhone(v: string) {
  const d = v.replace(/[^0-9]/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return v;
}

export default async function AdminSellersPage({ searchParams }: Props) {
  const raw = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const status = STATUSES.includes(raw as SelectSeller["status"]) ? (raw as SelectSeller["status"]) : undefined;
  const sellers = await adminListSellers(status);

  return (
    <AdminShell heading="판매자 관리" description="입점 신청 승인·반려, 판매자 정지 및 해제를 처리합니다.">
      <StatusFilterLinks
        basePath="/admin/sellers"
        current={status}
        options={[
          { label: "전체" },
          { value: "PENDING", label: "승인 대기" },
          { value: "APPROVED", label: "승인" },
          { value: "REJECTED", label: "반려" },
          { value: "SUSPENDED", label: "정지" },
        ]}
      />

      {sellers.length === 0 ? (
        <EmptyState title="판매자가 없습니다." description="조건에 해당하는 판매자가 없습니다." />
      ) : (
        <div className="overflow-x-auto border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>상호</TableHead>
                <TableHead>대표자</TableHead>
                <TableHead>사업자번호</TableHead>
                <TableHead>담당자 휴대폰</TableHead>
                <TableHead className="text-right">상품수</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>신청일</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.map((s) => (
                <TableRow key={s.id} className={s.status === "PENDING" ? "bg-amber-50" : undefined}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/sellers/${s.id}`} className="hover:underline">
                      {s.businessName}
                    </Link>
                  </TableCell>
                  <TableCell>{s.representativeName}</TableCell>
                  <TableCell className="tabular-nums">{formatBusinessNumber(s.businessNumber)}</TableCell>
                  <TableCell className="tabular-nums">{formatPhone(s.contactPhone)}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.productCount}</TableCell>
                  <TableCell>
                    <SellerStatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-zinc-500">{formatDateTime(s.createdAt)}</TableCell>
                  <TableCell>
                    <Link href={`/admin/sellers/${s.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
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
