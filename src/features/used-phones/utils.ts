import dayjs from "dayjs";

/** 원화 표시. 850000 → "850,000원" */
export function formatKRW(amount: number | string | null | undefined) {
  const n = Number(amount ?? 0);
  return `${new Intl.NumberFormat("ko-KR").format(n)}원`;
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "-";
  return dayjs(date).format("YYYY.MM.DD HH:mm");
}

export function formatDateOnly(date: Date | string | null | undefined) {
  if (!date) return "-";
  return dayjs(date).format("YYYY.MM.DD");
}

/**
 * IMEI 마스킹. 소비자 화면에서는 전체 IMEI 를 절대 노출하지 않는다.
 * 356938035643809 → "3569********809"
 */
export function maskImei(imei: string | null | undefined) {
  if (!imei) return null;
  const clean = imei.replace(/\s+/g, "");
  if (clean.length <= 7) return "*".repeat(clean.length);
  return `${clean.slice(0, 4)}${"*".repeat(clean.length - 7)}${clean.slice(-3)}`;
}

/** 계좌번호 표시용: 숫자와 하이픈만 남긴다 */
export function normalizeAccount(account: string) {
  return account.replace(/[^0-9-]/g, "");
}

/** 휴대폰 번호 정규화: 숫자만 */
export function normalizePhone(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

/** 사업자등록번호 정규화: 숫자 10자리 */
export function normalizeBusinessNumber(value: string) {
  return value.replace(/[^0-9]/g, "");
}

/** 주문번호: ORDER-YYYYMMDD-XXXXXX (6자리 난수, 유니크 제약으로 충돌 시 재시도) */
export function generateOrderNumber(now: Date = new Date(), random?: number) {
  const date = dayjs(now).format("YYYYMMDD");
  const n =
    random ?? Math.floor(Math.random() * 1_000_000);
  return `ORDER-${date}-${String(n).padStart(6, "0")}`;
}

export function isOrderNumber(value: string) {
  return /^ORDER-\d{8}-\d{6}$/.test(value);
}

/** 상품 표시명: "iPhone 15 Pro 256GB" */
export function productTitle(p: { model: string; storage: string }) {
  return `${p.model} ${p.storage}`;
}

export function minutesLeft(until: Date | string | null | undefined) {
  if (!until) return null;
  const diff = dayjs(until).diff(dayjs(), "minute");
  return diff < 0 ? 0 : diff;
}

/** 배열 안전 접근 */
export function first<T>(arr: T[] | undefined | null): T | undefined {
  return arr && arr.length > 0 ? arr[0] : undefined;
}
