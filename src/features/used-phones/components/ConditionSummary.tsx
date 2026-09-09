import { cn } from "@/lib/utils";
import {
  AVAILABILITY_LABEL,
  BACK_CONDITION_LABEL,
  BATTERY_STATUS_LABEL,
  CONDITION_GRADE_LABEL,
  FRAME_CONDITION_LABEL,
  HISTORY_STATE_LABEL,
  INSPECTION_ITEMS,
  INSPECTION_ITEM_LABEL,
  INSPECTION_RESULT_LABEL,
  SCREEN_CONDITION_LABEL,
  type AvailabilityState,
  type BackCondition,
  type BatteryStatus,
  type ConditionGrade,
  type FrameCondition,
  type HistoryState,
  type InspectionResult,
  type ScreenCondition,
} from "../constants";

type ProductLike = {
  brand: string;
  conditionGrade: string;
  screenCondition: string;
  frameCondition: string;
  backCondition: string;
  batteryHealth: number | null;
  batteryStatus: string | null;
  repairHistory: string;
  repairNote: string | null;
  partsReplacement: string;
  partsNote: string | null;
  notLostOrStolen: boolean;
  normalTermination: string;
  contractDiscount: string;
  inspection?: Partial<
    Record<(typeof INSPECTION_ITEMS)[number], string>
  > | null;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 text-sm last:border-b-0">
      <dt className="shrink-0 text-zinc-500">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

/** 상품 상세/판매자 검토/관리자 화면 공용 상태 요약 */
export function ConditionSummary({
  product,
  showInspection = true,
}: {
  product: ProductLike;
  showInspection?: boolean;
}) {
  const battery =
    product.brand === "APPLE"
      ? product.batteryHealth != null
        ? `${product.batteryHealth}%`
        : "-"
      : product.batteryStatus
        ? BATTERY_STATUS_LABEL[product.batteryStatus as BatteryStatus]
        : "-";

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 font-semibold">외관 상태</h3>
        <dl>
          <Row
            label="외관등급"
            value={
              CONDITION_GRADE_LABEL[product.conditionGrade as ConditionGrade]
            }
          />
          <Row
            label="액정"
            value={
              SCREEN_CONDITION_LABEL[product.screenCondition as ScreenCondition]
            }
          />
          <Row
            label="프레임"
            value={
              FRAME_CONDITION_LABEL[product.frameCondition as FrameCondition]
            }
          />
          <Row
            label="후면"
            value={BACK_CONDITION_LABEL[product.backCondition as BackCondition]}
          />
        </dl>
      </section>

      <section>
        <h3 className="mb-2 font-semibold">추가 정보</h3>
        <dl>
          <Row
            label={product.brand === "APPLE" ? "배터리 성능" : "배터리 상태"}
            value={battery}
          />
          <Row
            label="수리이력"
            value={
              <>
                {HISTORY_STATE_LABEL[product.repairHistory as HistoryState]}
                {product.repairNote && (
                  <span className="block text-xs text-zinc-500">
                    {product.repairNote}
                  </span>
                )}
              </>
            }
          />
          <Row
            label="부품교체"
            value={
              <>
                {HISTORY_STATE_LABEL[product.partsReplacement as HistoryState]}
                {product.partsNote && (
                  <span className="block text-xs text-zinc-500">
                    {product.partsNote}
                  </span>
                )}
              </>
            }
          />
          <Row
            label="분실·도난"
            value={
              product.notLostOrStolen
                ? "판매자 확인: 분실·도난 제품 아님"
                : "미확인"
            }
          />
          <Row
            label="정상해지"
            value={
              AVAILABILITY_LABEL[product.normalTermination as AvailabilityState]
            }
          />
          <Row
            label="선택약정"
            value={
              AVAILABILITY_LABEL[product.contractDiscount as AvailabilityState]
            }
          />
        </dl>
      </section>

      {showInspection && (
        <section>
          <h3 className="mb-2 font-semibold">기능 검사</h3>
          <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-3">
            {INSPECTION_ITEMS.map((item) => {
              const v = (product.inspection?.[item] ??
                "UNKNOWN") as InspectionResult;
              return (
                <div
                  key={item}
                  className="flex justify-between border-b py-1.5 text-sm"
                >
                  <span className="text-zinc-500">
                    {INSPECTION_ITEM_LABEL[item]}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      v === "NORMAL" && "text-emerald-700",
                      v === "ABNORMAL" && "text-rose-700",
                      v === "UNKNOWN" && "text-zinc-400",
                    )}
                  >
                    {INSPECTION_RESULT_LABEL[v]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
