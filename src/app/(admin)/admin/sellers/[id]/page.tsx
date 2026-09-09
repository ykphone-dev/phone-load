import AdminShell from "@/components/admin/AdminShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
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
  KeyValueList,
  ProductStatusBadge,
  SectionTitle,
  SellerStatusBadge,
} from "@/features/used-phones/components";
import { SellerAdminActions } from "@/features/used-phones/components/admin";
import { SELLER_STATUS_LABEL } from "@/features/used-phones/constants";
import { AppError } from "@/features/used-phones/server/errors";
import { adminGetSeller } from "@/features/used-phones/server/sellers";
import {
  formatDateTime,
  formatKRW,
  productTitle,
} from "@/features/used-phones/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

function formatBusinessNumber(v: string) {
  const d = v.replace(/[^0-9]/g, "");
  return d.length === 10
    ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
    : v;
}

function DocumentLink({ url, label }: { url: string | null; label: string }) {
  if (!url) {
    return (
      <span className="text-zinc-400">{label.replace(" 보기", "")} 미제출</span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      {label}
    </a>
  );
}

export default async function AdminSellerDetailPage({ params }: Props) {
  let data: Awaited<ReturnType<typeof adminGetSeller>>;
  try {
    data = await adminGetSeller(params.id);
  } catch (err) {
    if (err instanceof AppError) {
      if (err.status === 404) notFound();
      if (err.status === 401 || err.status === 403) redirect("/sign-in");
    }
    throw err;
  }
  const {
    seller,
    businessLicenseSignedUrl,
    mailOrderLicenseSignedUrl,
    products,
  } = data;

  return (
    <AdminShell
      heading={seller.businessName}
      description={`판매자 상세 · ${SELLER_STATUS_LABEL[seller.status] ?? seller.status}`}
      showBackButton
    >
      <section className="mb-6 flex flex-wrap items-center justify-between gap-3 border p-4">
        <div className="flex items-center gap-3">
          <SellerStatusBadge status={seller.status} />
          <span className="text-sm text-zinc-500">
            신청일 {formatDateTime(seller.createdAt)}
            {seller.approvedAt &&
              ` · 승인일 ${formatDateTime(seller.approvedAt)}`}
          </span>
        </div>
        <SellerAdminActions sellerId={seller.id} status={seller.status} />
      </section>

      {seller.rejectReason && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>
            {seller.status === "SUSPENDED" ? "정지 사유" : "반려 사유"}
          </AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {seller.rejectReason}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle>사업자 정보</SectionTitle>
          <KeyValueList
            items={[
              { label: "상호", value: seller.businessName },
              { label: "대표자", value: seller.representativeName },
              {
                label: "사업자등록번호",
                value: formatBusinessNumber(seller.businessNumber),
              },
              { label: "통신판매업 신고번호", value: seller.mailOrderNumber },
              {
                label: "사업장 주소",
                value: [seller.address, seller.addressDetail]
                  .filter(Boolean)
                  .join(" "),
              },
              { label: "담당자", value: seller.contactName },
              { label: "담당자 휴대폰", value: seller.contactPhone },
              {
                label: "회원 ID",
                value: (
                  <span className="font-mono text-xs">{seller.userId}</span>
                ),
              },
              { label: "최근 수정", value: formatDateTime(seller.updatedAt) },
            ]}
          />
        </section>

        <section className="space-y-8">
          <div>
            <SectionTitle>계좌정보</SectionTitle>
            <KeyValueList
              items={[
                { label: "은행", value: seller.bankName },
                {
                  label: "계좌번호",
                  value: (
                    <span className="tabular-nums">{seller.bankAccount}</span>
                  ),
                },
                { label: "예금주", value: seller.bankHolder },
              ]}
            />
            <p className="mt-2 text-xs text-zinc-500">
              구매자는 주문 후 이 계좌로 직접 송금합니다. 플랫폼은 판매대금을
              보관하지 않습니다.
            </p>
          </div>
          <div>
            <SectionTitle>제출 서류</SectionTitle>
            <KeyValueList
              items={[
                {
                  label: "사업자등록증",
                  value: (
                    <DocumentLink
                      url={businessLicenseSignedUrl}
                      label="사업자등록증 보기"
                    />
                  ),
                },
                {
                  label: "통신판매업 신고증",
                  value: (
                    <DocumentLink
                      url={mailOrderLicenseSignedUrl}
                      label="통신판매업 신고증 보기"
                    />
                  ),
                },
              ]}
            />
            <p className="mt-2 text-xs text-zinc-500">
              서류 링크는 일정 시간 후 만료됩니다. 만료 시 페이지를
              새로고침하세요.
            </p>
          </div>
        </section>
      </div>

      <section className="mt-10">
        <SectionTitle
          right={
            <span className="text-sm text-zinc-500">
              최근 {products.length}건
            </span>
          }
        >
          등록 상품
        </SectionTitle>
        {products.length === 0 ? (
          <EmptyState title="등록된 상품이 없습니다." />
        ) : (
          <div className="overflow-x-auto border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상품</TableHead>
                  <TableHead>색상</TableHead>
                  <TableHead>등급</TableHead>
                  <TableHead className="text-right">가격</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>등록일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/phones/${p.id}`}
                        className="hover:underline"
                      >
                        {productTitle(p)}
                      </Link>
                    </TableCell>
                    <TableCell>{p.color}</TableCell>
                    <TableCell>{p.conditionGrade}등급</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatKRW(p.price)}
                    </TableCell>
                    <TableCell>
                      <ProductStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-500">
                      {formatDateTime(p.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
