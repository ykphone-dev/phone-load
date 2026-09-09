import AdminShell from "@/components/admin/AdminShell";
import { buttonVariants } from "@/components/ui/button";
import {
  CopyButton,
  DisputeStatusBadge,
  EmptyState,
  KeyValueList,
  OrderProgress,
  OrderStatusBadge,
  RefundStatusBadge,
  SectionTitle,
} from "@/features/used-phones/components";
import { AdminOrderActions } from "@/features/used-phones/components/admin";
import {
  ORDER_STATUS_LABEL,
  REFUND_REASON_LABEL,
  type RefundReason,
} from "@/features/used-phones/constants";
import { AppError } from "@/features/used-phones/server/errors";
import { adminGetOrder } from "@/features/used-phones/server/orders";
import { formatDateTime, formatKRW, productTitle } from "@/features/used-phones/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

function Thumbs({ urls, alt }: { urls: string[]; alt: string }) {
  if (!urls || urls.length === 0) return <span className="text-zinc-400">첨부 사진 없음</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((u, i) => (
        <a key={u + i} href={u} target="_blank" rel="noreferrer" className="relative block h-20 w-20 overflow-hidden border bg-zinc-100">
          <Image src={u} alt={`${alt} ${i + 1}`} fill sizes="80px" className="object-cover" />
        </a>
      ))}
    </div>
  );
}

export default async function AdminPhoneOrderDetailPage({ params }: Props) {
  let order: Awaited<ReturnType<typeof adminGetOrder>>;
  try {
    order = await adminGetOrder(params.id);
  } catch (err) {
    if (err instanceof AppError) {
      if (err.status === 404) notFound();
      if (err.status === 401 || err.status === 403) redirect("/sign-in");
    }
    throw err;
  }

  const { product, seller, transferReport, shipment, refundRequests, disputes } = order;

  return (
    <AdminShell
      heading={`주문 ${order.orderNumber}`}
      description={`주문 상세 · ${ORDER_STATUS_LABEL[order.status] ?? order.status}`}
      showBackButton
    >
      <section className="mb-6 border p-4">
        <OrderProgress status={order.status} />
      </section>

      <section className="mb-8 border p-4">
        <SectionTitle right={<OrderStatusBadge status={order.status} />}>관리자 처리</SectionTitle>
        <AdminOrderActions orderId={order.id} status={order.status} />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle>주문 정보</SectionTitle>
          <KeyValueList
            items={[
              {
                label: "주문번호",
                value: (
                  <span className="inline-flex items-center gap-2">
                    <span className="font-mono">{order.orderNumber}</span>
                    <CopyButton value={order.orderNumber} />
                  </span>
                ),
              },
              { label: "상태", value: <OrderStatusBadge status={order.status} /> },
              {
                label: "요청 전 상태",
                value: order.statusBeforeRequest ? ORDER_STATUS_LABEL[order.statusBeforeRequest] : "-",
              },
              { label: "결제금액", value: <span className="font-semibold">{formatKRW(order.price)}</span> },
              { label: "주문일시", value: formatDateTime(order.createdAt) },
              { label: "입금기한", value: formatDateTime(order.reservedUntil) },
              { label: "거래완료", value: formatDateTime(order.completedAt) },
              { label: "취소 사유", value: order.cancelReason || "-" },
              { label: "주문 유형", value: order.buyerId ? "회원 주문" : "비회원 주문" },
            ]}
          />
        </section>

        <section>
          <SectionTitle>상품</SectionTitle>
          <div className="flex gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-zinc-100">
              {product.images[0]?.imageUrl ? (
                <Image src={product.images[0].imageUrl} alt={product.model} fill sizes="96px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">사진 없음</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <KeyValueList
                items={[
                  {
                    label: "상품",
                    value: (
                      <Link href={`/admin/phones/${product.id}`} className="font-medium underline">
                        {productTitle(product)}
                      </Link>
                    ),
                  },
                  { label: "색상 / 등급", value: `${product.color} · ${product.conditionGrade}등급` },
                  { label: "현재 판매가", value: formatKRW(product.price) },
                ]}
              />
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>판매자</SectionTitle>
          <KeyValueList
            items={[
              {
                label: "상호",
                value: (
                  <Link href={`/admin/sellers/${seller.id}`} className="font-medium underline">
                    {seller.businessName}
                  </Link>
                ),
              },
              { label: "담당자", value: `${seller.contactName} (${seller.contactPhone})` },
              {
                label: "입금 계좌",
                value: `${seller.bankName} ${seller.bankAccount} (${seller.bankHolder})`,
              },
            ]}
          />
        </section>

        <section>
          <SectionTitle>구매자 / 배송지</SectionTitle>
          <KeyValueList
            items={[
              { label: "구매자", value: order.buyerName },
              { label: "휴대폰", value: order.buyerPhone },
              { label: "우편번호", value: order.shippingPostalCode || "-" },
              {
                label: "배송주소",
                value: [order.shippingAddress, order.shippingAddressDetail].filter(Boolean).join(" "),
              },
              { label: "배송 메모", value: order.shippingMemo || "-" },
            ]}
          />
        </section>

        <section>
          <SectionTitle>입금 기록</SectionTitle>
          {transferReport ? (
            <KeyValueList
              items={[
                { label: "입금자명", value: transferReport.depositorName || "-" },
                { label: "구매자 입금 표시", value: formatDateTime(transferReport.buyerReportedAt) },
                {
                  label: "판매자 입금 확인",
                  value: transferReport.sellerConfirmedAt ? (
                    formatDateTime(transferReport.sellerConfirmedAt)
                  ) : (
                    <span className="text-amber-700">미확인</span>
                  ),
                },
              ]}
            />
          ) : (
            <p className="text-sm text-zinc-400">입금 기록이 없습니다.</p>
          )}
        </section>

        <section>
          <SectionTitle>배송</SectionTitle>
          {shipment ? (
            <KeyValueList
              items={[
                { label: "택배사", value: shipment.carrier },
                {
                  label: "송장번호",
                  value: (
                    <span className="inline-flex items-center gap-2">
                      <span className="font-mono">{shipment.trackingNumber}</span>
                      <CopyButton value={shipment.trackingNumber} />
                    </span>
                  ),
                },
                { label: "발송일", value: formatDateTime(shipment.shippedAt) },
                { label: "배송완료", value: formatDateTime(shipment.deliveredAt) },
              ]}
            />
          ) : (
            <p className="text-sm text-zinc-400">배송 정보가 없습니다.</p>
          )}
        </section>
      </div>

      <section className="mt-10">
        <SectionTitle right={<span className="text-sm text-zinc-500">{refundRequests.length}건</span>}>환불 요청</SectionTitle>
        {refundRequests.length === 0 ? (
          <EmptyState title="환불 요청이 없습니다." />
        ) : (
          <div className="space-y-4">
            {refundRequests.map((r) => (
              <div key={r.id} className="border p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <RefundStatusBadge status={r.status} />
                    <span className="text-sm font-medium">{REFUND_REASON_LABEL[r.reason as RefundReason] ?? r.reason}</span>
                  </div>
                  <span className="text-xs text-zinc-500">요청 {formatDateTime(r.requestedAt)}</span>
                </div>
                <KeyValueList
                  items={[
                    { label: "상세 설명", value: r.description ? <span className="whitespace-pre-wrap">{r.description}</span> : "-" },
                    { label: "첨부 사진", value: <Thumbs urls={r.imageUrls} alt="환불 사진" /> },
                    {
                      label: "환불 계좌",
                      value: `${r.refundBankName} ${r.refundAccount} (${r.refundHolder})`,
                    },
                    { label: "판매자 메모", value: r.sellerNote ? <span className="whitespace-pre-wrap">{r.sellerNote}</span> : "-" },
                    { label: "판매자 환불", value: formatDateTime(r.refundedAt) },
                    { label: "구매자 확인", value: formatDateTime(r.confirmedAt) },
                  ]}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <SectionTitle right={<span className="text-sm text-zinc-500">{disputes.length}건</span>}>분쟁</SectionTitle>
        {disputes.length === 0 ? (
          <EmptyState title="분쟁 내역이 없습니다." />
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 border p-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <DisputeStatusBadge status={d.status} />
                    <span className="truncate text-sm font-medium">{d.reason}</span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    접수 {formatDateTime(d.createdAt)}
                    {d.resolvedAt && ` · 처리 ${formatDateTime(d.resolvedAt)}`}
                    {d.resolutionStatus && ` · 결과: ${ORDER_STATUS_LABEL[d.resolutionStatus]}`}
                  </p>
                </div>
                <Link href={`/admin/disputes/${d.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  분쟁 상세
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
