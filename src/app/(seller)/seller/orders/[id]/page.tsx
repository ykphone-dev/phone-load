import {
  CopyButton,
  DisputeStatusBadge,
  KeyValueList,
  OrderProgress,
  OrderStatusBadge,
  RefundStatusBadge,
  SectionTitle,
} from "@/features/used-phones/components";
import { SellerOrderActions } from "@/features/used-phones/components/seller/SellerOrderActions";
import { REFUND_REASON_LABEL, type RefundReason } from "@/features/used-phones/constants";
import { AppError } from "@/features/used-phones/server/errors";
import { getSellerOrderView, type SellerOrderView } from "@/features/used-phones/server/orders";
import { guardSellerPage } from "@/features/used-phones/server/seller-guard";
import { formatDateTime, formatKRW, minutesLeft, productTitle } from "@/features/used-phones/utils";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function EvidenceImages({ urls }: { urls: string[] }) {
  if (!urls?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((u) => (
        <a key={u} href={u} target="_blank" rel="noreferrer" className="relative block h-20 w-20 overflow-hidden border bg-zinc-50">
          <Image src={u} alt="" fill sizes="80px" className="object-cover" />
        </a>
      ))}
    </div>
  );
}

export default async function SellerOrderDetailPage({ params }: { params: { id: string } }) {
  await guardSellerPage();

  let order: SellerOrderView;
  try {
    order = await getSellerOrderView(params.id);
  } catch (err) {
    if (err instanceof AppError && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }

  const thumb = order.product.images[0]?.imageUrl;
  const left = minutesLeft(order.reservedUntil);
  const activeRefund = order.refundRequests.find((r) => ["REQUESTED", "REJECTED"].includes(r.status)) ?? null;
  const openDispute = order.disputes.find((d) => d.status !== "RESOLVED") ?? null;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <SectionTitle
          right={
            <Link href="/seller/orders" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
              목록으로
            </Link>
          }
        >
          주문 상세
        </SectionTitle>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-mono">{order.orderNumber}</span>
          <CopyButton value={order.orderNumber} />
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <OrderProgress status={order.status} />

      <section>
        <h3 className="mb-2 font-semibold">처리</h3>
        <SellerOrderActions
          orderId={order.id}
          status={order.status}
          activeRefund={
            activeRefund
              ? {
                  status: activeRefund.status,
                  refundBankName: activeRefund.refundBankName,
                  refundAccount: activeRefund.refundAccount,
                  refundHolder: activeRefund.refundHolder,
                }
              : null
          }
          openDispute={openDispute ? { id: openDispute.id, sellerReply: openDispute.sellerReply } : null}
        />
      </section>

      <section>
        <h3 className="mb-2 font-semibold">주문 정보</h3>
        <KeyValueList
          items={[
            { label: "주문번호", value: order.orderNumber },
            { label: "상태", value: <OrderStatusBadge status={order.status} /> },
            { label: "주문일시", value: formatDateTime(order.createdAt) },
            { label: "금액", value: <span className="font-semibold">{formatKRW(order.price)}</span> },
            {
              label: "입금기한",
              value: order.reservedUntil
                ? `${formatDateTime(order.reservedUntil)}${left != null ? ` (${left > 0 ? `${left}분 남음` : "기한 만료"})` : ""}`
                : "-",
            },
            ...(order.cancelReason ? [{ label: "취소 사유", value: order.cancelReason }] : []),
            ...(order.completedAt ? [{ label: "거래완료", value: formatDateTime(order.completedAt) }] : []),
          ]}
        />
      </section>

      <section>
        <h3 className="mb-2 font-semibold">상품</h3>
        <div className="flex items-center gap-3 border p-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden border bg-zinc-50">
            {thumb ? <Image src={thumb} alt="" fill sizes="64px" className="object-cover" /> : null}
          </div>
          <div className="min-w-0">
            <p className="font-medium">{productTitle(order.product)}</p>
            <p className="text-xs text-zinc-500">
              {order.product.color} · {order.product.conditionGrade}등급
            </p>
            <Link href={`/products/${order.product.id}`} className="text-xs underline-offset-4 hover:underline" target="_blank">
              상품 페이지 보기
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-semibold">구매자 / 배송지</h3>
        <KeyValueList
          items={[
            { label: "이름", value: order.buyerName },
            {
              label: "휴대폰",
              value: (
                <span className="inline-flex items-center gap-2">
                  {order.buyerPhone}
                  <CopyButton value={order.buyerPhone} />
                </span>
              ),
            },
            {
              label: "주소",
              value: `${order.shippingPostalCode ? `(${order.shippingPostalCode}) ` : ""}${order.shippingAddress}`,
            },
            { label: "상세주소", value: order.shippingAddressDetail ?? "-" },
            { label: "배송 메모", value: order.shippingMemo ?? "-" },
          ]}
        />
      </section>

      <section>
        <h3 className="mb-2 font-semibold">입금 정보</h3>
        <KeyValueList
          items={[
            { label: "구매자 입금표시", value: formatDateTime(order.transferReport?.buyerReportedAt) },
            { label: "입금자명", value: order.transferReport?.depositorName ?? "-" },
            { label: "판매자 확인", value: formatDateTime(order.transferReport?.sellerConfirmedAt) },
            { label: "입금 계좌", value: `${order.seller.bankName} ${order.seller.bankAccount} (${order.seller.bankHolder})` },
          ]}
        />
      </section>

      <section>
        <h3 className="mb-2 font-semibold">배송 정보</h3>
        {order.shipment ? (
          <KeyValueList
            items={[
              { label: "택배사", value: order.shipment.carrier },
              {
                label: "송장번호",
                value: (
                  <span className="inline-flex items-center gap-2">
                    {order.shipment.trackingNumber}
                    <CopyButton value={order.shipment.trackingNumber} />
                  </span>
                ),
              },
              { label: "발송일", value: formatDateTime(order.shipment.shippedAt) },
              { label: "배송완료", value: formatDateTime(order.shipment.deliveredAt) },
            ]}
          />
        ) : (
          <p className="text-sm text-zinc-500">아직 송장이 등록되지 않았습니다.</p>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-semibold">환불 요청</h3>
        {order.refundRequests.length === 0 ? (
          <p className="text-sm text-zinc-500">환불 요청이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {order.refundRequests.map((r) => (
              <div key={r.id} className="space-y-2 border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{REFUND_REASON_LABEL[r.reason as RefundReason] ?? r.reason}</span>
                  <RefundStatusBadge status={r.status} />
                </div>
                {r.description && <p className="whitespace-pre-wrap text-zinc-700">{r.description}</p>}
                <EvidenceImages urls={r.imageUrls} />
                <KeyValueList
                  className="border-y-0"
                  items={[
                    { label: "요청일시", value: formatDateTime(r.requestedAt) },
                    { label: "환불 계좌", value: `${r.refundBankName} ${r.refundAccount} (${r.refundHolder})` },
                    { label: "판매자 환불", value: formatDateTime(r.refundedAt) },
                    { label: "구매자 확인", value: formatDateTime(r.confirmedAt) },
                    ...(r.sellerNote ? [{ label: "판매자 메모", value: r.sellerNote }] : []),
                  ]}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-semibold">분쟁</h3>
        {order.disputes.length === 0 ? (
          <p className="text-sm text-zinc-500">분쟁 내역이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {order.disputes.map((d) => (
              <div key={d.id} className="space-y-2 border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{d.reason}</span>
                  <DisputeStatusBadge status={d.status} />
                </div>
                {d.description && <p className="whitespace-pre-wrap text-zinc-700">{d.description}</p>}
                <EvidenceImages urls={d.imageUrls} />
                <KeyValueList
                  className="border-y-0"
                  items={[
                    { label: "접수일시", value: formatDateTime(d.createdAt) },
                    {
                      label: "판매자 답변",
                      value: d.sellerReply ? (
                        <span className="whitespace-pre-wrap">
                          {d.sellerReply}
                          <span className="ml-1 text-xs text-zinc-400">({formatDateTime(d.sellerRepliedAt)})</span>
                        </span>
                      ) : (
                        "-"
                      ),
                    },
                    { label: "관리자 처리", value: d.adminNote ? <span className="whitespace-pre-wrap">{d.adminNote}</span> : "-" },
                    ...(d.resolutionStatus ? [{ label: "처리 결과", value: <OrderStatusBadge status={d.resolutionStatus} /> }] : []),
                  ]}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
