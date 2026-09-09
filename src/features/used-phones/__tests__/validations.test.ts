import { INSPECTION_ITEMS } from "../constants";
import { createOrderSchema, productFormSchema, sellerRegisterSchema } from "../validations";

const inspection = Object.fromEntries(INSPECTION_ITEMS.map((k) => [k, "NORMAL"]));

const baseProduct = {
  brand: "APPLE",
  model: "iPhone 15 Pro",
  storage: "256GB",
  color: "블랙",
  price: 850000,
  conditionGrade: "A",
  screenCondition: "MICRO_SCRATCH",
  frameCondition: "CLEAN",
  backCondition: "CLEAN",
  batteryHealth: 89,
  repairHistory: "NONE",
  partsReplacement: "NONE",
  notLostOrStolen: true,
  normalTermination: "POSSIBLE",
  contractDiscount: "NEED_CHECK",
  imei: "356938035643809",
  inspection,
  images: [{ imageUrl: "https://x.supabase.co/storage/v1/object/public/phone-images/a.webp", kind: "FRONT" }],
  publish: true,
};

describe("productFormSchema", () => {
  test("정상 입력 통과", () => {
    expect(productFormSchema.safeParse(baseProduct).success).toBe(true);
  });

  test("Apple 은 배터리 성능 % 필수", () => {
    const r = productFormSchema.safeParse({ ...baseProduct, batteryHealth: undefined });
    expect(r.success).toBe(false);
    if (r.success === false) expect(r.error.issues[0].path).toEqual(["batteryHealth"]);
  });

  test("Samsung 은 배터리 상태 필수", () => {
    const r = productFormSchema.safeParse({ ...baseProduct, brand: "SAMSUNG", batteryHealth: undefined });
    expect(r.success).toBe(false);
    if (r.success === false) expect(r.error.issues[0].path).toEqual(["batteryStatus"]);
  });

  test("판매 등록 시 분실·도난 확인 체크와 사진 1장 이상 필수, 임시저장은 예외", () => {
    expect(productFormSchema.safeParse({ ...baseProduct, notLostOrStolen: false }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...baseProduct, images: [] }).success).toBe(false);
    expect(
      productFormSchema.safeParse({ ...baseProduct, notLostOrStolen: false, images: [], publish: false }).success,
    ).toBe(true);
  });

  test("수리이력 '있음' 이면 내용 필수", () => {
    expect(productFormSchema.safeParse({ ...baseProduct, repairHistory: "YES" }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...baseProduct, repairHistory: "YES", repairNote: "액정 교체" }).success).toBe(true);
  });

  test("사진 최대 15장", () => {
    const images = Array.from({ length: 16 }, (_, i) => ({ imageUrl: `https://x.co/${i}.webp`, kind: "ETC" }));
    expect(productFormSchema.safeParse({ ...baseProduct, images }).success).toBe(false);
  });
});

describe("createOrderSchema", () => {
  const base = {
    productId: "p1",
    buyerName: "홍길동",
    buyerPhone: "010-1234-5678",
    shippingAddress: "서울시 강남구",
    password: "1234",
    agreeNotParty: true,
  };
  test("정상", () => {
    expect(createOrderSchema.safeParse(base).success).toBe(true);
  });
  test("판매계약 당사자 고지 미동의 시 실패", () => {
    expect(createOrderSchema.safeParse({ ...base, agreeNotParty: false }).success).toBe(false);
  });
  test("휴대폰 형식", () => {
    expect(createOrderSchema.safeParse({ ...base, buyerPhone: "02-123-4567" }).success).toBe(false);
  });
});

describe("sellerRegisterSchema", () => {
  test("사업자등록번호/계좌 형식", () => {
    const base = {
      businessName: "OO모바일",
      representativeName: "김대표",
      businessNumber: "123-45-67890",
      mailOrderNumber: "2026-서울강남-01234",
      address: "서울시 강남구",
      contactName: "김담당",
      contactPhone: "01012345678",
      bankName: "국민은행",
      bankAccount: "123456-01-123456",
      bankHolder: "OO모바일",
    };
    expect(sellerRegisterSchema.safeParse(base).success).toBe(true);
    expect(sellerRegisterSchema.safeParse({ ...base, businessNumber: "12345" }).success).toBe(false);
    expect(sellerRegisterSchema.safeParse({ ...base, bankAccount: "abc" }).success).toBe(false);
  });
});
