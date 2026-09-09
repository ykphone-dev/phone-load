import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SectionTitle } from "@/features/used-phones/components";
import { SellerRegisterForm } from "@/features/used-phones/components/seller/SellerRegisterForm";
import { AppError } from "@/features/used-phones/server/errors";
import { getMySeller } from "@/features/used-phones/server/sellers";
import type { SellerRegisterInput } from "@/features/used-phones/validations";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SellerRegisterPage() {
  let seller: Awaited<ReturnType<typeof getMySeller>>["seller"];
  try {
    ({ seller } = await getMySeller());
  } catch (err) {
    if (err instanceof AppError && err.status === 401)
      redirect("/sign-in?from=/seller/register");
    throw err;
  }

  if (seller?.status === "APPROVED") redirect("/seller");
  if (seller?.status === "PENDING") redirect("/seller/pending");

  if (seller?.status === "SUSPENDED") {
    return (
      <div className="max-w-2xl">
        <SectionTitle>판매자 입점 신청</SectionTitle>
        <Alert variant="destructive">
          <AlertTitle>판매자 계정이 정지되었습니다</AlertTitle>
          <AlertDescription>
            {seller.rejectReason ? (
              <p className="mb-1">사유: {seller.rejectReason}</p>
            ) : null}
            정지 상태에서는 재신청할 수 없습니다. 고객센터에 문의해주세요.{" "}
            <Link href="/seller/pending" className="underline">
              상태 확인
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const defaultValues: Partial<SellerRegisterInput> | undefined =
    seller?.status === "REJECTED"
      ? {
          businessName: seller.businessName,
          representativeName: seller.representativeName,
          businessNumber: seller.businessNumber,
          mailOrderNumber: seller.mailOrderNumber,
          address: seller.address,
          addressDetail: seller.addressDetail ?? "",
          contactName: seller.contactName,
          contactPhone: seller.contactPhone,
          bankName: seller.bankName,
          bankAccount: seller.bankAccount,
          bankHolder: seller.bankHolder,
          businessLicenseUrl: seller.businessLicenseUrl ?? "",
          mailOrderLicenseUrl: seller.mailOrderLicenseUrl ?? "",
        }
      : undefined;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <SectionTitle>판매자 입점 신청</SectionTitle>
        <p className="text-sm text-zinc-500">
          사업자 회원만 입점할 수 있습니다. 신청 후 관리자 승인이 완료되면
          상품을 등록할 수 있습니다.
        </p>
      </div>

      {seller?.status === "REJECTED" && (
        <Alert variant="destructive">
          <AlertTitle>입점 신청이 반려되었습니다</AlertTitle>
          <AlertDescription>
            <p className="whitespace-pre-wrap">
              반려 사유: {seller.rejectReason ?? "사유가 등록되지 않았습니다."}
            </p>
            <p className="mt-1">아래 내용을 수정한 뒤 다시 신청해주세요.</p>
          </AlertDescription>
        </Alert>
      )}

      <SellerRegisterForm defaultValues={defaultValues} />
    </div>
  );
}
