import AdminShell from "@/components/admin/AdminShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  DisputeStatusBadge,
  KeyValueList,
  OrderStatusBadge,
  SectionTitle,
} from "@/features/used-phones/components";
import { DisputeResolveForm } from "@/features/used-phones/components/admin";
import { DISPUTE_STATUS_LABEL, ORDER_STATUS_LABEL } from "@/features/used-phones/constants";
import { AppError } from "@/features/used-phones/server/errors";
import { adminGetDispute } from "@/features/used-phones/server/orders";
import { formatDateTime, formatKRW, productTitle } from "@/features/used-phones/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

const RESOLUTION_LABEL: Record<string, string> = {
  COMPLETED: "거래완료로 종결",
  REFUNDED: "환불완료로 종결",
  CANCELLED: "취소완료로 종결",
};

export default async function AdminDisputeDetailPage({ params }: Props) {
  let data: Awaited<ReturnType<typeof adminGetDispute>>;
  try {
    data = await adminGetDispute(params.id);
  } catch (err) {
    if (err instanceof AppError) {
      if (err.status === 404) notFound();
      if (err.status === 401 || err.status === 403) redirect("/sign-in");
    }
    throw err;
  }
  const { dispute, order } = data;
  const resolved = dispute.status === "RESOLVED";

  return (
    <AdminShell
      heading={`분쟁 · ${order.orderNumber}`}
      description={`분쟁 상세 · ${DISPUTE_STATUS_LABEL[dispute.status] ?? dispute.status}`}
      showBackButton
    >
      <section className="mb-6 flex flex-wrap items-center justify-between gap-3 border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <DisputeStatusBadge status={dispute.status} />
          <span className="text-sm text-zinc-500">접수 {formatDateTime(dispute.createdAt)}</span>
          {dispute.resolvedAt && <span className="text-sm text-zinc-500">· 처리 {formatDateTime(dispute.resolvedAt)}</span>}
        </div>
        <Link href={`/admin/phone-orders/${order.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          주문 상세 보기
        </Link>
      </section>

      {resolved && (
        <Alert className="mb-6">
          <AlertTitle>
            처리완료 · {RESOLUTION_LABEL[dispute.resolutionStatus ?? ""] ?? ORDER_STATUS_LABEL[dispute.resolutionStatus] ?? "-"}
          </AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{dispute.adminNote || "관리자 메모 없음"}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle>주문 요약</SectionTitle>
          <KeyValueList
            items={[
              {
                label: "주문번호",
                value: (
                  <Link href={`/admin/phone-orders/${order.id}`} className="font-mono underline">
                    {order.orderNumber}
                  </Link>
                ),
              },
              { label: "주문 상태", value: <OrderStatusBadge status={order.status} /> },
              {
                label: "판매자",
                value: (
                  <Link href={`/admin/sellers/${order.seller.id}`} className="underline">
                    {order.seller.businessName}
                  </Link>
                ),
              },
              { label: "판매자 연락처", value: `${order.seller.contactName} (${order.seller.contactPhone})` },
              { label: "소비자", value: `${order.buyerName} (${order.buyerPhone})` },
              {
                label: "상품",
                value: (
                  <Link href={`/admin/phones/${order.product.id}`} className="underline">
                    {productTitle(order.product)} · {order.product.color}
                  </Link>
                ),
              },
              { label: "결제금액", value: <span className="font-semibold">{formatKRW(order.price)}</span> },
              { label: "주문일시", value: formatDateTime(order.createdAt) },
            ]}
          />
        </section>

        <section className="space-y-8">
          <div>
            <SectionTitle>구매자 분쟁 내용</SectionTitle>
            <KeyValueList
              items={[
                { label: "사유", value: <span className="font-medium">{dispute.reason}</span> },
                {
                  label: "설명",
                  value: dispute.description ? <span className="whitespace-pre-wrap">{dispute.description}</span> : "-",
                },
                {
                  label: "첨부 사진",
                  value:
                    dispute.imageUrls && dispute.imageUrls.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {dispute.imageUrls.map((u, i) => (
                          <a key={u + i} href={u} target="_blank" rel="noreferrer" className="relative block h-20 w-20 overflow-hidden border bg-zinc-100">
                            <Image src={u} alt={`분쟁 사진 ${i + 1}`} fill sizes="80px" className="object-cover" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-400">첨부 사진 없음</span>
                    ),
                },
              ]}
            />
          </div>

          <div>
            <SectionTitle>판매자 답변</SectionTitle>
            {dispute.sellerReply ? (
              <div className="border p-3 text-sm">
                <p className="whitespace-pre-wrap">{dispute.sellerReply}</p>
                <p className="mt-2 text-xs text-zinc-500">답변일 {formatDateTime(dispute.sellerRepliedAt)}</p>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">미답변</p>
            )}
          </div>

          {!resolved && dispute.adminNote && (
            <div>
              <SectionTitle>기존 관리자 메모</SectionTitle>
              <p className="whitespace-pre-wrap border p-3 text-sm">{dispute.adminNote}</p>
            </div>
          )}
        </section>
      </div>

      <section className="mt-10 max-w-2xl">
        <SectionTitle>분쟁 처리</SectionTitle>
        {resolved ? (
          <p className="text-sm text-zinc-500">이미 처리된 분쟁입니다. 처리 결과는 상단에 표시됩니다.</p>
        ) : (
          <DisputeResolveForm disputeId={dispute.id} />
        )}
      </section>
    </AdminShell>
  );
}
