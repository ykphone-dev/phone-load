/**
 * 중고폰 플랫폼 공용 상수 / 라벨.
 * DB enum 값과 1:1 로 맞춰야 한다 (schema-used-phones.ts).
 */

export const BRANDS = ["APPLE", "SAMSUNG", "OTHER"] as const;
export type Brand = (typeof BRANDS)[number];
export const BRAND_LABEL: Record<Brand, string> = {
  APPLE: "Apple",
  SAMSUNG: "Samsung",
  OTHER: "기타",
};

export const STORAGES = ["64GB", "128GB", "256GB", "512GB", "1TB"] as const;

export const CONDITION_GRADES = ["S", "A", "B", "C"] as const;
export type ConditionGrade = (typeof CONDITION_GRADES)[number];
export const CONDITION_GRADE_LABEL: Record<ConditionGrade, string> = {
  S: "S등급 · 거의 새제품 수준",
  A: "A등급 · 미세한 사용감",
  B: "B등급 · 생활기스 존재",
  C: "C등급 · 찍힘 / 스크래치 존재",
};
export const CONDITION_GRADE_SHORT: Record<ConditionGrade, string> = {
  S: "S등급",
  A: "A등급",
  B: "B등급",
  C: "C등급",
};

export const SCREEN_CONDITIONS = [
  "CLEAN",
  "MICRO_SCRATCH",
  "LIGHT_SCRATCH",
  "DENT",
  "BROKEN",
] as const;
export type ScreenCondition = (typeof SCREEN_CONDITIONS)[number];
export const SCREEN_CONDITION_LABEL: Record<ScreenCondition, string> = {
  CLEAN: "깨끗함",
  MICRO_SCRATCH: "미세기스",
  LIGHT_SCRATCH: "생활기스",
  DENT: "찍힘",
  BROKEN: "파손",
};

export const FRAME_CONDITIONS = ["CLEAN", "MICRO_SCRATCH", "DENT"] as const;
export type FrameCondition = (typeof FRAME_CONDITIONS)[number];
export const FRAME_CONDITION_LABEL: Record<FrameCondition, string> = {
  CLEAN: "깨끗함",
  MICRO_SCRATCH: "미세기스",
  DENT: "찍힘 있음",
};

export const BACK_CONDITIONS = ["CLEAN", "SCRATCH", "BROKEN"] as const;
export type BackCondition = (typeof BACK_CONDITIONS)[number];
export const BACK_CONDITION_LABEL: Record<BackCondition, string> = {
  CLEAN: "깨끗함",
  SCRATCH: "기스 있음",
  BROKEN: "파손 있음",
};

export const HISTORY_STATES = ["NONE", "YES", "UNKNOWN"] as const;
export type HistoryState = (typeof HISTORY_STATES)[number];
export const HISTORY_STATE_LABEL: Record<HistoryState, string> = {
  NONE: "없음",
  YES: "있음",
  UNKNOWN: "모름",
};

export const AVAILABILITY_STATES = [
  "POSSIBLE",
  "IMPOSSIBLE",
  "NEED_CHECK",
] as const;
export type AvailabilityState = (typeof AVAILABILITY_STATES)[number];
export const AVAILABILITY_LABEL: Record<AvailabilityState, string> = {
  POSSIBLE: "가능",
  IMPOSSIBLE: "불가능",
  NEED_CHECK: "확인필요",
};

export const BATTERY_STATUSES = ["GOOD", "NORMAL", "REPLACE_RECOMMENDED"] as const;
export type BatteryStatus = (typeof BATTERY_STATUSES)[number];
export const BATTERY_STATUS_LABEL: Record<BatteryStatus, string> = {
  GOOD: "좋음",
  NORMAL: "보통",
  REPLACE_RECOMMENDED: "교체권장",
};

export const INSPECTION_RESULTS = ["NORMAL", "ABNORMAL", "UNKNOWN"] as const;
export type InspectionResult = (typeof INSPECTION_RESULTS)[number];
export const INSPECTION_RESULT_LABEL: Record<InspectionResult, string> = {
  NORMAL: "정상",
  ABNORMAL: "이상",
  UNKNOWN: "미확인",
};

export const INSPECTION_ITEMS = [
  "camera",
  "frontCamera",
  "biometric",
  "speaker",
  "microphone",
  "charging",
  "wirelessCharging",
  "wifi",
  "bluetooth",
  "gps",
  "vibration",
  "buttons",
  "display",
] as const;
export type InspectionItem = (typeof INSPECTION_ITEMS)[number];
export const INSPECTION_ITEM_LABEL: Record<InspectionItem, string> = {
  camera: "카메라",
  frontCamera: "전면카메라",
  biometric: "Face ID / 지문",
  speaker: "스피커",
  microphone: "마이크",
  charging: "충전",
  wirelessCharging: "무선충전",
  wifi: "Wi-Fi",
  bluetooth: "Bluetooth",
  gps: "GPS",
  vibration: "진동",
  buttons: "버튼",
  display: "디스플레이",
};

export const IMAGE_KINDS = [
  "FRONT",
  "BACK",
  "LEFT",
  "RIGHT",
  "SCREEN",
  "CORNER",
  "DENT",
  "SCRATCH",
  "ACCESSORY",
  "ETC",
] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];
export const IMAGE_KIND_LABEL: Record<ImageKind, string> = {
  FRONT: "전면",
  BACK: "후면",
  LEFT: "좌측",
  RIGHT: "우측",
  SCREEN: "액정",
  CORNER: "모서리",
  DENT: "찍힘",
  SCRATCH: "흠집",
  ACCESSORY: "구성품",
  ETC: "기타",
};
/** 상품등록 시 반드시 있어야 하는 사진 종류 */
export const REQUIRED_IMAGE_KINDS: ImageKind[] = [
  "FRONT",
  "BACK",
  "LEFT",
  "RIGHT",
  "SCREEN",
];
export const MAX_PRODUCT_IMAGES = 15;

export const PRODUCT_STATUSES = [
  "DRAFT",
  "ON_SALE",
  "RESERVED",
  "SOLD",
  "STOPPED",
  "DELETED",
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: "작성중",
  ON_SALE: "판매중",
  RESERVED: "주문 진행중",
  SOLD: "판매완료",
  STOPPED: "판매중지",
  DELETED: "삭제됨",
};

export const ORDER_STATUSES = [
  "CREATED",
  "WAITING_DEPOSIT",
  "DEPOSIT_REPORTED",
  "DEPOSIT_CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCEL_REQUESTED",
  "CANCELLED",
  "REFUND_REQUESTED",
  "REFUNDED",
  "DISPUTED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  CREATED: "주문 생성",
  WAITING_DEPOSIT: "입금 대기",
  DEPOSIT_REPORTED: "입금완료 표시 (판매자 확인 대기)",
  DEPOSIT_CONFIRMED: "판매자 입금확인",
  PREPARING: "배송 준비중",
  SHIPPED: "배송중",
  DELIVERED: "배송완료",
  COMPLETED: "거래완료",
  CANCEL_REQUESTED: "취소 요청",
  CANCELLED: "취소완료",
  REFUND_REQUESTED: "환불 요청",
  REFUNDED: "환불완료",
  DISPUTED: "분쟁중",
};

export const REFUND_REASONS = [
  "NOT_AS_DESCRIBED",
  "DEFECTIVE",
  "DAMAGED",
  "WRONG_ITEM",
  "MISSING_PARTS",
  "CHANGE_OF_MIND",
  "OTHER",
] as const;
export type RefundReason = (typeof REFUND_REASONS)[number];
export const REFUND_REASON_LABEL: Record<RefundReason, string> = {
  NOT_AS_DESCRIBED: "상품 상태가 설명과 다름",
  DEFECTIVE: "기기 불량",
  DAMAGED: "파손",
  WRONG_ITEM: "오배송",
  MISSING_PARTS: "구성품 누락",
  CHANGE_OF_MIND: "단순변심",
  OTHER: "기타",
};

export const REFUND_STATUS_LABEL: Record<string, string> = {
  REQUESTED: "환불 요청됨",
  SELLER_REFUNDED: "판매자 환불완료 (구매자 확인 대기)",
  CONFIRMED: "환불 확인됨",
  REJECTED: "판매자 거절",
  WITHDRAWN: "요청 철회",
};

export const DISPUTE_STATUS_LABEL: Record<string, string> = {
  OPEN: "접수",
  SELLER_REPLIED: "판매자 답변",
  RESOLVED: "처리완료",
};

export const SELLER_STATUS_LABEL: Record<string, string> = {
  PENDING: "승인 대기",
  APPROVED: "승인",
  REJECTED: "반려",
  SUSPENDED: "정지",
};

export const CARRIERS = [
  "CJ대한통운",
  "우체국택배",
  "롯데택배",
  "한진택배",
  "로젠택배",
  "편의점택배(CU/GS)",
  "퀵/직접전달",
  "기타",
] as const;

export const BANKS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행",
  "기업은행",
  "카카오뱅크",
  "토스뱅크",
  "케이뱅크",
  "SC제일은행",
  "씨티은행",
  "대구은행",
  "부산은행",
  "경남은행",
  "광주은행",
  "전북은행",
  "제주은행",
  "새마을금고",
  "신협",
  "우체국",
  "수협",
  "산업은행",
] as const;

/** platform_settings 키 */
export const SETTING_KEYS = {
  RESERVATION_MINUTES: "order.reservation_minutes",
} as const;
export const DEFAULT_RESERVATION_MINUTES = 30;

/** 비회원 주문 접근 쿠키 접두어 */
export const ORDER_ACCESS_COOKIE_PREFIX = "yk_order_";
export const ORDER_ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

export const PLATFORM_NAME = "옆커폰";
export const PLATFORM_NOTICE_NOT_PARTY =
  "판매계약 당사자는 상품 판매자입니다. 옆커폰은 통신판매중개 플랫폼이며 판매대금을 보관하지 않습니다.";
