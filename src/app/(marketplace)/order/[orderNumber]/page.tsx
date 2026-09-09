import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  DisputeStatusBadge,
  KeyValueList,
  OrderProgress,
  OrderStatusBadge,
  RefundStatusBadge,
  SectionTitle,
} from "@/features/used-phones/components";
import { BankTransferPanel } from "@/features/used-phones/components/market/BankTransferPanel";
import { BuyerOrderActions } from "@/features/used-phones/components/market/BuyerOrderActions";
import { DepositCountdown } from "@/features/used-phones/components/market/DepositCountdown";
import {
  REFUND_REASON_LABEL,
  type RefundReason,
} from "@/features/used-phones/constants";
import { AppError } from "@/features/used-phones/server/errors";
import { getBuyerOrderView } from "@/features/used-phones/server/orders";
import {
  formatDateTime,
  formatKRW,
  productTitle,
} from "@/features/used-phones/utils";

export const dynamic = "force-dynamic";

export default async function BuyerOrderPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  let order: Awaited<ReturnType<typeof getBuyerOrderView>>;
  try {
    order = await getBuyerOrderView(params.orderNumber);
  } catch (err) {
    if (err instanceof AppError && err.status === 403)
      redirect(`/order/lookup?orderNumber=${params.orderNumber}`);
    notFound();
  }

  const image = order.product.images[0]?.imageUrl;
  const waiting =
    order.status === "WAITING_DEPOSIT" || order.status === "DEPOSIT_REPORTED";
  const activeRefund = order.refundRequests.find(
    (r) => r.status !== "WITHDRAWN" && r.status !== "CONFIRMED",
  );
  const sellerRefunded = order.refundRequests.some(
    (r) => r.status === "SELLER_REFUNDED",
  );
  const hasOpenDispute = order.disputes.some((d) => d.status !== "RESOLVED");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm text-zinc-500">주문번호</p>
          <h1 className="font-mono text-xl font-semibold">
            {order.orderNumber}
          </h1>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <OrderProgress status={order.status} />

      <section>
        <SectionTitle>주문 상품</SectionTitle>
        <div className="flex gap-4 border p-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-zinc-100">
            {image && (
              <Image
                src={image}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            )}
          </div>
          <div className="space-y-1 text-sm">
            <Link
              href={`/products/${order.product.id}`}
              className="font-medium hover:underline"
            >
              {productTitle(order.product)} · {order.product.color}
            </Link>
            <p className="text-zinc-500">
              {order.product.conditionGrade}등급 · {order.seller.businessName}
            </p>
            <p className="text-lg font-semibold">{formatKRW(order.price)}</p>
          </div>
        </div>
      </section>

      {waiting && (
        <section>
          <SectionTitle
            right={
              order.status === "WAITING_DEPOSIT" ? (
                <DepositCountdown
                  reservedUntil={
                    order.reservedUntil
                      ? order.reservedUntil.toISOString()
                      : null
                  }
                />
              ) : null
            }
          >
            입금 계좌
          </SectionTitle>
          <BankTransferPanel amount={order.price} seller={order.seller} />
        </section>
      )}

      <section>
        <SectionTitle>진행</SectionTitle>
        <BuyerOrderActions
          orderNumber={order.orderNumber}
          status={order.status}
          buyerName={order.buyerName}
          sellerRefunded={sellerRefunded}
          hasOpenDispute={hasOpenDispute}
        />
      </section>

      <section>
        <SectionTitle>주문 정보</SectionTitle>
        <KeyValueList
          items={[
            { label: "주문일시", value: formatDateTime(order.createdAt) },
            {
              label: "구매자",
              value: `${order.buyerName} / ${order.buyerPhone}`,
            },
            {
              label: "배송지",
              value: [
                order.shippingPostalCode,
                order.shippingAddress,
                order.shippingAddressDetail,
              ]
                .filter(Boolean)
                .join(" "),
            },
            { label: "배송메모", value: order.shippingMemo || "-" },
            { label: "결제수단", value: "판매자 계좌 직접 이체" },
            {
              label: "입금 표시",
              value: order.transferReport?.buyerReportedAt
                ? `${formatDateTime(order.transferReport.buyerReportedAt)} (입금자명 ${order.transferReport.depositorName ?? "-"})`
                : "-",
            },
            {
              label: "판매자 입금확인",
              value: formatDateTime(order.transferReport?.sellerConfirmedAt),
            },
            ...(order.cancelReason
              ? [{ label: "취소 사유", value: order.cancelReason }]
              : []),
          ]}
        />
      </section>

      {order.shipment && (
        <section>
          <SectionTitle>배송 정보</SectionTitle>
          <KeyValueList
            items={[
              { label: "택배사", value: order.shipment.carrier },
              {
                label: "송장번호",
                value: (
                  <span className="font-mono">
                    {order.shipment.trackingNumber}
                  </span>
                ),
              },
              {
                label: "발송일",
                value: formatDateTime(order.shipment.shippedAt),
              },
              {
                label: "배송완료",
                value: formatDateTime(order.shipment.deliveredAt),
              },
            ]}
          />
          <p className="mt-2 text-xs text-zinc-500">
            송장번호로 택배사 홈페이지에서 배송을 조회할 수 있습니다.
          </p>
        </section>
      )}

      {activeRefund && (
        <section>
          <SectionTitle
            right={<RefundStatusBadge status={activeRefund.status} />}
          >
            환불 요청
          </SectionTitle>
          <KeyValueList
            items={[
              {
                label: "사유",
                value: REFUND_REASON_LABEL[activeRefund.reason as RefundReason],
              },
              { label: "내용", value: activeRefund.description || "-" },
              {
                label: "환불 계좌",
                value: `${activeRefund.refundBankName} ${activeRefund.refundAccount} (${activeRefund.refundHolder})`,
              },
              {
                label: "요청일시",
                value: formatDateTime(activeRefund.requestedAt),
              },
              { label: "판매자 메모", value: activeRefund.sellerNote || "-" },
              {
                label: "판매자 환불처리",
                value: formatDateTime(activeRefund.refundedAt),
              },
            ]}
          />
        </section>
      )}

      {order.disputes.length > 0 && (
        <section>
          <SectionTitle>분쟁</SectionTitle>
          <div className="space-y-3">
            {order.disputes.map((d) => (
              <div key={d.id} className="space-y-2 border p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{d.reason}</p>
                  <DisputeStatusBadge status={d.status} />
                </div>
                {d.description && (
                  <p className="whitespace-pre-wrap text-zinc-600">
                    {d.description}
                  </p>
                )}
                <p className="text-xs text-zinc-500">
                  접수 {formatDateTime(d.createdAt)}
                </p>
                {d.sellerReply && (
                  <div className="border-l-2 pl-3">
                    <p className="text-xs text-zinc-500">판매자 답변</p>
                    <p className="whitespace-pre-wrap">{d.sellerReply}</p>
                  </div>
                )}
                {d.status === "RESOLVED" && (
                  <div className="border-l-2 border-emerald-500 pl-3">
                    <p className="text-xs text-zinc-500">
                      관리자 처리 결과 ({formatDateTime(d.resolvedAt)})
                    </p>
                    <p className="whitespace-pre-wrap">{d.adminNote}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
