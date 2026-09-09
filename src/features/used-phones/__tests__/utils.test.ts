import {
  formatKRW,
  generateOrderNumber,
  isOrderNumber,
  maskImei,
  normalizeBusinessNumber,
  normalizePhone,
  productTitle,
} from "../utils";

describe("utils", () => {
  test("formatKRW", () => {
    expect(formatKRW(850000)).toBe("850,000원");
    expect(formatKRW("1200")).toBe("1,200원");
    expect(formatKRW(null)).toBe("0원");
  });

  test("maskImei 는 앞 4자리·뒤 3자리만 남긴다", () => {
    expect(maskImei("356938035643809")).toBe("3569********809");
    expect(maskImei(null)).toBeNull();
    expect(maskImei("1234")).toBe("****");
  });

  test("주문번호 형식 ORDER-YYYYMMDD-XXXXXX", () => {
    const n = generateOrderNumber(new Date("2026-09-09T10:00:00+09:00"), 123);
    expect(n).toBe("ORDER-20260909-000123");
    expect(isOrderNumber(n)).toBe(true);
    expect(isOrderNumber("ORDER-2026-1")).toBe(false);
    expect(isOrderNumber(generateOrderNumber())).toBe(true);
  });

  test("정규화", () => {
    expect(normalizePhone("010-1234-5678")).toBe("01012345678");
    expect(normalizeBusinessNumber("123-45-67890")).toBe("1234567890");
    expect(productTitle({ model: "iPhone 15 Pro", storage: "256GB" })).toBe(
      "iPhone 15 Pro 256GB",
    );
  });
});
