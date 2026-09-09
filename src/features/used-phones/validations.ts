import { z } from "zod";
import {
  AVAILABILITY_STATES,
  BACK_CONDITIONS,
  BATTERY_STATUSES,
  BRANDS,
  CARRIERS,
  CONDITION_GRADES,
  FRAME_CONDITIONS,
  HISTORY_STATES,
  IMAGE_KINDS,
  INSPECTION_RESULTS,
  MAX_PRODUCT_IMAGES,
  REFUND_REASONS,
  SCREEN_CONDITIONS,
} from "./constants";
import { DISPUTE_RESOLUTIONS } from "./order-state";

const phoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/;
const businessNumberRegex = /^\d{3}-?\d{2}-?\d{5}$/;

// ───────────────────────────── 판매자 ─────────────────────────────

export const sellerRegisterSchema = z.object({
  businessName: z.string().trim().min(1, "상호를 입력하세요").max(100),
  representativeName: z.string().trim().min(1, "대표자명을 입력하세요").max(50),
  businessNumber: z
    .string()
    .trim()
    .regex(
      businessNumberRegex,
      "사업자등록번호 형식이 올바르지 않습니다 (000-00-00000)",
    ),
  mailOrderNumber: z
    .string()
    .trim()
    .min(1, "통신판매업 신고번호를 입력하세요")
    .max(50),
  address: z.string().trim().min(1, "사업장 주소를 입력하세요").max(200),
  addressDetail: z.string().trim().max(200).optional().or(z.literal("")),
  contactName: z.string().trim().min(1, "담당자 이름을 입력하세요").max(50),
  contactPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "휴대폰 번호 형식이 올바르지 않습니다"),
  bankName: z.string().trim().min(1, "입금 은행을 선택하세요").max(50),
  bankAccount: z
    .string()
    .trim()
    .regex(/^[0-9-]{6,30}$/, "계좌번호는 숫자와 하이픈만 입력하세요"),
  bankHolder: z.string().trim().min(1, "예금주를 입력하세요").max(50),
  /** 비공개 버킷 내 경로 (업로드 API 응답값) */
  businessLicenseUrl: z.string().trim().max(500).optional().or(z.literal("")),
  mailOrderLicenseUrl: z.string().trim().max(500).optional().or(z.literal("")),
});
export type SellerRegisterInput = z.infer<typeof sellerRegisterSchema>;

export const sellerProfileUpdateSchema = sellerRegisterSchema.pick({
  contactName: true,
  contactPhone: true,
  bankName: true,
  bankAccount: true,
  bankHolder: true,
  address: true,
  addressDetail: true,
});
export type SellerProfileUpdateInput = z.infer<
  typeof sellerProfileUpdateSchema
>;

// ───────────────────────────── 상품 ─────────────────────────────

const inspectionResult = z.enum(INSPECTION_RESULTS).default("UNKNOWN");
export const inspectionSchema = z.object({
  camera: inspectionResult,
  frontCamera: inspectionResult,
  biometric: inspectionResult,
  speaker: inspectionResult,
  microphone: inspectionResult,
  charging: inspectionResult,
  wirelessCharging: inspectionResult,
  wifi: inspectionResult,
  bluetooth: inspectionResult,
  gps: inspectionResult,
  vibration: inspectionResult,
  buttons: inspectionResult,
  display: inspectionResult,
});
export type InspectionInput = z.infer<typeof inspectionSchema>;

export const productImageSchema = z.object({
  imageUrl: z.string().url(),
  kind: z.enum(IMAGE_KINDS).default("ETC"),
});

export const productFormSchema = z
  .object({
    brand: z.enum(BRANDS),
    model: z.string().trim().min(1, "모델명을 입력하세요").max(100),
    storage: z.string().trim().min(1, "용량을 선택하세요").max(20),
    color: z.string().trim().min(1, "색상을 입력하세요").max(50),
    price: z.coerce
      .number()
      .int("가격은 정수로 입력하세요")
      .min(1000, "가격은 1,000원 이상이어야 합니다")
      .max(100_000_000),

    conditionGrade: z.enum(CONDITION_GRADES),
    screenCondition: z.enum(SCREEN_CONDITIONS),
    frameCondition: z.enum(FRAME_CONDITIONS),
    backCondition: z.enum(BACK_CONDITIONS),

    batteryHealth: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .nullable(),
    batteryStatus: z.enum(BATTERY_STATUSES).optional().nullable(),

    repairHistory: z.enum(HISTORY_STATES).default("UNKNOWN"),
    repairNote: z.string().trim().max(500).optional().or(z.literal("")),
    partsReplacement: z.enum(HISTORY_STATES).default("UNKNOWN"),
    partsNote: z.string().trim().max(500).optional().or(z.literal("")),

    notLostOrStolen: z.boolean(),
    normalTermination: z.enum(AVAILABILITY_STATES).default("NEED_CHECK"),
    contractDiscount: z.enum(AVAILABILITY_STATES).default("NEED_CHECK"),

    imei: z
      .string()
      .trim()
      .regex(/^\d{14,16}$/, "IMEI는 숫자 15자리입니다")
      .optional()
      .or(z.literal("")),
    description: z.string().trim().max(3000).optional().or(z.literal("")),

    inspection: inspectionSchema,
    images: z
      .array(productImageSchema)
      .max(
        MAX_PRODUCT_IMAGES,
        `사진은 최대 ${MAX_PRODUCT_IMAGES}장까지 등록할 수 있습니다`,
      ),

    /** true 면 ON_SALE 로 등록, false 면 DRAFT 저장 */
    publish: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (
      data.brand === "APPLE" &&
      (data.batteryHealth == null || Number.isNaN(data.batteryHealth))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["batteryHealth"],
        message: "Apple 제품은 배터리 성능(%)을 입력하세요",
      });
    }
    if (data.brand === "SAMSUNG" && !data.batteryStatus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["batteryStatus"],
        message: "Samsung 제품은 배터리 상태를 선택하세요",
      });
    }
    if (data.repairHistory === "YES" && !data.repairNote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["repairNote"],
        message: "수리 내용을 입력하세요",
      });
    }
    if (data.partsReplacement === "YES" && !data.partsNote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["partsNote"],
        message: "부품교체 내용을 입력하세요",
      });
    }
    if (data.publish) {
      if (!data.notLostOrStolen) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["notLostOrStolen"],
          message: "분실·도난 제품이 아님을 확인해야 판매 등록할 수 있습니다",
        });
      }
      if (data.images.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["images"],
          message:
            "판매 등록에는 사진이 최소 1장 필요합니다 (전면·후면·좌측·우측·액정 5장 권장)",
        });
      }
    }
  });
export type ProductFormInput = z.infer<typeof productFormSchema>;

export const productListQuerySchema = z.object({
  brand: z.enum(BRANDS).optional(),
  model: z.string().trim().max(100).optional(),
  storage: z.string().trim().max(20).optional(),
  grade: z.enum(CONDITION_GRADES).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["latest", "price_asc", "price_desc"]).default("latest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

// ───────────────────────────── 주문 ─────────────────────────────

export const createOrderSchema = z.object({
  productId: z.string().min(1),
  buyerName: z.string().trim().min(1, "구매자명을 입력하세요").max(50),
  buyerPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "휴대폰 번호 형식이 올바르지 않습니다"),
  shippingPostalCode: z.string().trim().max(10).optional().or(z.literal("")),
  shippingAddress: z.string().trim().min(1, "배송주소를 입력하세요").max(200),
  shippingAddressDetail: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal("")),
  shippingMemo: z.string().trim().max(200).optional().or(z.literal("")),
  /** 비회원 주문 조회 비밀번호. 회원이면 생략 가능. */
  password: z
    .string()
    .min(4, "비밀번호는 4자 이상 입력하세요")
    .max(50)
    .optional()
    .or(z.literal("")),
  agreeNotParty: z.literal(true, {
    errorMap: () => ({
      message: "판매계약 당사자 고지에 동의해야 주문할 수 있습니다",
    }),
  }),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderLookupSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .regex(/^ORDER-\d{8}-\d{6}$/, "주문번호 형식이 올바르지 않습니다"),
  buyerPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "휴대폰 번호 형식이 올바르지 않습니다"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});
export type OrderLookupInput = z.infer<typeof orderLookupSchema>;

export const depositReportSchema = z.object({
  depositorName: z.string().trim().min(1, "입금자명을 입력하세요").max(50),
});
export type DepositReportInput = z.infer<typeof depositReportSchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export const shipmentSchema = z.object({
  carrier: z.enum(CARRIERS),
  trackingNumber: z.string().trim().min(1, "송장번호를 입력하세요").max(50),
  shippedAt: z.string().optional().or(z.literal("")),
});
export type ShipmentInput = z.infer<typeof shipmentSchema>;

export const refundRequestSchema = z.object({
  reason: z.enum(REFUND_REASONS),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  imageUrls: z.array(z.string().url()).max(10).default([]),
  refundBankName: z
    .string()
    .trim()
    .min(1, "환불받을 은행을 선택하세요")
    .max(50),
  refundAccount: z
    .string()
    .trim()
    .regex(/^[0-9-]{6,30}$/, "계좌번호는 숫자와 하이픈만 입력하세요"),
  refundHolder: z.string().trim().min(1, "예금주를 입력하세요").max(50),
});
export type RefundRequestInput = z.infer<typeof refundRequestSchema>;

export const sellerRefundDecisionSchema = z.object({
  decision: z.enum(["REFUNDED", "REJECTED"]),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const disputeOpenSchema = z.object({
  reason: z.string().trim().min(1, "분쟁 사유를 입력하세요").max(200),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  imageUrls: z.array(z.string().url()).max(10).default([]),
});
export type DisputeOpenInput = z.infer<typeof disputeOpenSchema>;

export const disputeSellerReplySchema = z.object({
  reply: z.string().trim().min(1, "답변을 입력하세요").max(3000),
});

export const disputeResolveSchema = z.object({
  adminNote: z.string().trim().min(1, "처리 메모를 입력하세요").max(3000),
  resolutionStatus: z.enum(DISPUTE_RESOLUTIONS as [string, ...string[]]),
});

// ───────────────────────────── 관리자 ─────────────────────────────

export const sellerRejectSchema = z.object({
  reason: z.string().trim().min(1, "반려 사유를 입력하세요").max(1000),
});

export const settingsSchema = z.object({
  reservationMinutes: z.coerce
    .number()
    .int()
    .min(5)
    .max(24 * 60),
});
