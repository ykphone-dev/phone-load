import { KeyValueList, SectionTitle, SellerStatusBadge } from "@/features/used-phones/components";
import { SellerProfileForm } from "@/features/used-phones/components/seller/SellerProfileForm";
import { guardSellerPage } from "@/features/used-phones/server/seller-guard";
import { formatDateTime } from "@/features/used-phones/utils";

export const dynamic = "force-dynamic";

export default async function SellerProfilePage() {
  const { user, seller } = await guardSellerPage();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <SectionTitle right={<SellerStatusBadge status={seller.status} />}>판매자 정보</SectionTitle>
        <p className="text-sm text-zinc-500">
          상호·대표자·사업자등록번호 등 사업자 정보는 변경할 수 없습니다. 변경이 필요하면 고객센터에 문의하세요.
        </p>
      </div>

      <KeyValueList
        items={[
          { label: "계정", value: user.email },
          { label: "상호", value: seller.businessName },
          { label: "대표자", value: seller.representativeName },
          { label: "사업자등록번호", value: seller.businessNumber },
          { label: "통신판매업 신고번호", value: seller.mailOrderNumber },
          { label: "사업장 주소", value: `${seller.address}${seller.addressDetail ? ` ${seller.addressDetail}` : ""}` },
          { label: "담당자", value: `${seller.contactName} / ${seller.contactPhone}` },
          { label: "입금 계좌", value: `${seller.bankName} ${seller.bankAccount} (${seller.bankHolder})` },
          { label: "사업자등록증", value: seller.businessLicenseUrl ? "제출됨" : "미제출" },
          { label: "통신판매업 신고증", value: seller.mailOrderLicenseUrl ? "제출됨" : "미제출" },
          { label: "승인일시", value: formatDateTime(seller.approvedAt) },
          { label: "가입일시", value: formatDateTime(seller.createdAt) },
        ]}
      />

      <section>
        <h3 className="mb-3 text-lg font-semibold">정보 수정</h3>
        <SellerProfileForm
          defaultValues={{
            contactName: seller.contactName,
            contactPhone: seller.contactPhone,
            bankName: seller.bankName,
            bankAccount: seller.bankAccount,
            bankHolder: seller.bankHolder,
            address: seller.address,
            addressDetail: seller.addressDetail ?? "",
          }}
        />
      </section>
    </div>
  );
}
