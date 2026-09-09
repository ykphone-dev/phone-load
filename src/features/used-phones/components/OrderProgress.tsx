import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, type OrderStatus } from "../constants";
import { PROGRESS_STEPS, progressIndex } from "../order-state";
import { OrderStatusBadge } from "./StatusBadge";

const STEP_LABEL: Record<string, string> = {
  WAITING_DEPOSIT: "입금 대기",
  DEPOSIT_REPORTED: "입금 표시",
  DEPOSIT_CONFIRMED: "입금 확인",
  SHIPPED: "배송중",
  DELIVERED: "배송완료",
  COMPLETED: "거래완료",
};

/** 소비자/판매자 주문 상세 상단 진행 타임라인 */
export function OrderProgress({ status }: { status: OrderStatus }) {
  const idx = progressIndex(status);
  const offTrack = idx < 0;
  return (
    <div className="space-y-3">
      {offTrack && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">현재 상태</span>
          <OrderStatusBadge status={status} />
        </div>
      )}
      <ol className="flex w-full items-center">
        {PROGRESS_STEPS.map((step, i) => {
          const done = !offTrack && i <= idx;
          const current = !offTrack && i === idx;
          return (
            <li key={step} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    i === 0
                      ? "bg-transparent"
                      : done
                        ? "bg-black"
                        : "bg-zinc-200",
                  )}
                />
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                    done
                      ? "border-black bg-black text-white"
                      : "border-zinc-300 bg-white text-zinc-400",
                    current && "ring-2 ring-black/20",
                  )}
                >
                  {i + 1}
                </div>
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    i === PROGRESS_STEPS.length - 1
                      ? "bg-transparent"
                      : done && i < idx
                        ? "bg-black"
                        : "bg-zinc-200",
                  )}
                />
              </div>
              <span
                className={cn(
                  "mt-1 text-center text-[11px] leading-tight",
                  done ? "text-black" : "text-zinc-400",
                )}
              >
                {STEP_LABEL[step] ?? ORDER_STATUS_LABEL[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
