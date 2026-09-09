import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  KeyValueList,
  SectionTitle,
  SellerStatusBadge,
} from "@/features/used-phones/components";
import { AppError } from "@/features/used-phones/server/errors";
import { getMySeller } from "@/features/used-phones/server/sellers";
import { formatDateTime } from "@/features/used-phones/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SellerPendingPage() {
  let seller: Awaited<ReturnType<typeof getMySeller>>["seller"];
  try {
    ({ seller } = await getMySeller());
  } catch (err) {
    if (err instanceof AppError && err.status === 401)
      redirect("/sign-in?from=/seller/pending");
    throw err;
  }

  if (!seller) redirect("/seller/register");
  if (seller.status === "APPROVED") redirect("/seller");

  return (
    <div className="max-w-2xl space-y-6">
      <SectionTitle right={<SellerStatusBadge status={seller.status} />}>
        판매자 승인 상태
      </SectionTitle>

      {seller.status === "PENDING" && (
        <Alert>
          <AlertTitle>승인 대기 중입니다</AlertTitle>
          <AlertDescription>
            관리자가 제출하신 사업자 정보와 서류를 검토하고 있습니다. 승인이
            완료되면 상품 등록과 주문 관리를 이용할 수 있습니다. 보통 1~2
            영업일이 소요됩니다.
          </AlertDescription>
        </Alert>
      )}

      {seller.status === "REJECTED" && (
        <Alert variant="destructive">
          <AlertTitle>입점 신청이 반려되었습니다</AlertTitle>
          <AlertDescription>
            <p className="whitespace-pre-wrap">
              반려 사유: {seller.rejectReason ?? "사유가 등록되지 않았습니다."}
            </p>
            <div className="mt-3">
              <Button asChild size="sm">
                <Link href="/seller/register">수정 후 재신청</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {seller.status === "SUSPENDED" && (
        <Alert variant="destructive">
          <AlertTitle>판매자 계정이 정지되었습니다</AlertTitle>
          <AlertDescription>
            {seller.rejectReason ? (
              <p className="whitespace-pre-wrap">사유: {seller.rejectReason}</p>
            ) : null}
            <p className="mt-1">
              판매중이던 상품은 모두 판매중지 처리되었습니다. 문의는 고객센터를
              이용해주세요.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <KeyValueList
        items={[
          { label: "상호", value: seller.businessName },
          { label: "대표자", value: seller.representativeName },
          { label: "사업자등록번호", value: seller.businessNumber },
          { label: "통신판매업 신고번호", value: seller.mailOrderNumber },
          {
            label: "담당자",
            value: `${seller.contactName} / ${seller.contactPhone}`,
          },
          { label: "신청일시", value: formatDateTime(seller.createdAt) },
          { label: "최종 변경", value: formatDateTime(seller.updatedAt) },
        ]}
      />

      <div className="text-sm text-zinc-500">
        <Link href="/products" className="underline">
          쇼핑몰로 돌아가기
        </Link>
      </div>
    </div>
  );
}
