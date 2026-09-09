import { createId } from "@paralleldrive/cuid2";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * 옆커폰 중고폰 거래 플랫폼 MVP 스키마.
 *
 * 원칙
 *  - 플랫폼은 돈을 받지 않는다. 결제/정산/지갑 테이블은 없다.
 *  - bank_transfer_reports 는 실제 금융정보가 아니라 "버튼을 눌렀다"는 기록이다.
 *  - 기존 Hiyori 테이블(products, orders 등)과 이름이 겹치지 않도록 phone_ 접두어를 사용한다.
 */

// ───────────────────────────── enums ─────────────────────────────

export const sellerStatusEnum = pgEnum("seller_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
]);

export const phoneBrandEnum = pgEnum("phone_brand", [
  "APPLE",
  "SAMSUNG",
  "OTHER",
]);

export const phoneProductStatusEnum = pgEnum("phone_product_status", [
  "DRAFT",
  "ON_SALE",
  "RESERVED",
  "SOLD",
  "STOPPED",
  "DELETED",
]);

export const conditionGradeEnum = pgEnum("condition_grade", [
  "S",
  "A",
  "B",
  "C",
]);

export const screenConditionEnum = pgEnum("screen_condition", [
  "CLEAN",
  "MICRO_SCRATCH",
  "LIGHT_SCRATCH",
  "DENT",
  "BROKEN",
]);

export const frameConditionEnum = pgEnum("frame_condition", [
  "CLEAN",
  "MICRO_SCRATCH",
  "DENT",
]);

export const backConditionEnum = pgEnum("back_condition", [
  "CLEAN",
  "SCRATCH",
  "BROKEN",
]);

export const historyStateEnum = pgEnum("history_state", [
  "NONE",
  "YES",
  "UNKNOWN",
]);

export const availabilityEnum = pgEnum("availability_state", [
  "POSSIBLE",
  "IMPOSSIBLE",
  "NEED_CHECK",
]);

export const batteryStatusEnum = pgEnum("battery_status", [
  "GOOD",
  "NORMAL",
  "REPLACE_RECOMMENDED",
]);

export const inspectionResultEnum = pgEnum("inspection_result", [
  "NORMAL",
  "ABNORMAL",
  "UNKNOWN",
]);

export const productImageKindEnum = pgEnum("product_image_kind", [
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
]);

export const phoneOrderStatusEnum = pgEnum("phone_order_status", [
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
]);

export const refundReasonEnum = pgEnum("refund_reason", [
  "NOT_AS_DESCRIBED",
  "DEFECTIVE",
  "DAMAGED",
  "WRONG_ITEM",
  "MISSING_PARTS",
  "CHANGE_OF_MIND",
  "OTHER",
]);

export const refundStatusEnum = pgEnum("refund_status", [
  "REQUESTED",
  "SELLER_REFUNDED",
  "CONFIRMED",
  "REJECTED",
  "WITHDRAWN",
]);

export const disputeStatusEnum = pgEnum("dispute_status", [
  "OPEN",
  "SELLER_REPLIED",
  "RESOLVED",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
};

// ───────────────────────────── sellers ─────────────────────────────

export const sellers = pgTable(
  "sellers",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: uuid("user_id").notNull().unique(),

    businessName: text("business_name").notNull(),
    representativeName: text("representative_name").notNull(),
    businessNumber: text("business_number").notNull().unique(),
    mailOrderNumber: text("mail_order_number").notNull(),
    address: text("address").notNull(),
    addressDetail: text("address_detail"),

    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone").notNull(),

    bankName: text("bank_name").notNull(),
    bankAccount: text("bank_account").notNull(),
    bankHolder: text("bank_holder").notNull(),

    businessLicenseUrl: text("business_license_url"),
    mailOrderLicenseUrl: text("mail_order_license_url"),

    status: sellerStatusEnum("status").notNull().default("PENDING"),
    rejectReason: text("reject_reason"),
    approvedAt: timestamp("approved_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (t) => ({
    statusIdx: index("sellers_status_idx").on(t.status),
  }),
);

export type SelectSeller = InferSelectModel<typeof sellers>;
export type InsertSeller = InferInsertModel<typeof sellers>;

// ───────────────────────────── products ─────────────────────────────

export const phoneProducts = pgTable(
  "phone_products",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    sellerId: text("seller_id")
      .notNull()
      .references(() => sellers.id, { onDelete: "restrict" }),

    brand: phoneBrandEnum("brand").notNull(),
    model: text("model").notNull(),
    storage: text("storage").notNull(),
    color: text("color").notNull(),
    /** 판매가 (원). 소수점 없음. */
    price: integer("price").notNull(),
    /** MVP 에서는 항상 1. 향후 동일 상태 다수 재고용. */
    quantity: integer("quantity").notNull().default(1),

    conditionGrade: conditionGradeEnum("condition_grade").notNull(),
    screenCondition: screenConditionEnum("screen_condition").notNull(),
    frameCondition: frameConditionEnum("frame_condition").notNull(),
    backCondition: backConditionEnum("back_condition").notNull(),

    /** Apple: 배터리 성능 % */
    batteryHealth: integer("battery_health"),
    /** Samsung: 배터리 상태 */
    batteryStatus: batteryStatusEnum("battery_status"),

    repairHistory: historyStateEnum("repair_history")
      .notNull()
      .default("UNKNOWN"),
    repairNote: text("repair_note"),
    partsReplacement: historyStateEnum("parts_replacement")
      .notNull()
      .default("UNKNOWN"),
    partsNote: text("parts_note"),

    /** 판매자가 "분실·도난 제품이 아닙니다" 에 체크했는지 */
    notLostOrStolen: boolean("not_lost_or_stolen").notNull().default(false),
    normalTermination: availabilityEnum("normal_termination")
      .notNull()
      .default("NEED_CHECK"),
    contractDiscount: availabilityEnum("contract_discount")
      .notNull()
      .default("NEED_CHECK"),

    /** 소비자에게는 전체를 노출하지 않는다. 판매자/관리자만 조회. */
    imei: text("imei"),
    description: text("description"),

    status: phoneProductStatusEnum("status").notNull().default("DRAFT"),
    ...timestamps,
  },
  (t) => ({
    sellerIdx: index("phone_products_seller_idx").on(t.sellerId),
    statusIdx: index("phone_products_status_idx").on(t.status),
    brandModelIdx: index("phone_products_brand_model_idx").on(t.brand, t.model),
  }),
);

export type SelectPhoneProduct = InferSelectModel<typeof phoneProducts>;
export type InsertPhoneProduct = InferInsertModel<typeof phoneProducts>;

export const phoneProductImages = pgTable(
  "phone_product_images",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    productId: text("product_id")
      .notNull()
      .references(() => phoneProducts.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    kind: productImageKindEnum("kind").notNull().default("ETC"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    productIdx: index("phone_product_images_product_idx").on(t.productId),
  }),
);

export type SelectPhoneProductImage = InferSelectModel<
  typeof phoneProductImages
>;
export type InsertPhoneProductImage = InferInsertModel<
  typeof phoneProductImages
>;

export const phoneProductInspections = pgTable("phone_product_inspections", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),
  productId: text("product_id")
    .notNull()
    .unique()
    .references(() => phoneProducts.id, { onDelete: "cascade" }),

  camera: inspectionResultEnum("camera").notNull().default("UNKNOWN"),
  frontCamera: inspectionResultEnum("front_camera")
    .notNull()
    .default("UNKNOWN"),
  biometric: inspectionResultEnum("biometric").notNull().default("UNKNOWN"),
  speaker: inspectionResultEnum("speaker").notNull().default("UNKNOWN"),
  microphone: inspectionResultEnum("microphone").notNull().default("UNKNOWN"),
  charging: inspectionResultEnum("charging").notNull().default("UNKNOWN"),
  wirelessCharging: inspectionResultEnum("wireless_charging")
    .notNull()
    .default("UNKNOWN"),
  wifi: inspectionResultEnum("wifi").notNull().default("UNKNOWN"),
  bluetooth: inspectionResultEnum("bluetooth").notNull().default("UNKNOWN"),
  gps: inspectionResultEnum("gps").notNull().default("UNKNOWN"),
  vibration: inspectionResultEnum("vibration").notNull().default("UNKNOWN"),
  buttons: inspectionResultEnum("buttons").notNull().default("UNKNOWN"),
  display: inspectionResultEnum("display").notNull().default("UNKNOWN"),
});

export type SelectPhoneProductInspection = InferSelectModel<
  typeof phoneProductInspections
>;
export type InsertPhoneProductInspection = InferInsertModel<
  typeof phoneProductInspections
>;

// ───────────────────────────── orders ─────────────────────────────

export const phoneOrders = pgTable(
  "phone_orders",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    orderNumber: text("order_number").notNull().unique(),

    productId: text("product_id")
      .notNull()
      .references(() => phoneProducts.id, { onDelete: "restrict" }),
    sellerId: text("seller_id")
      .notNull()
      .references(() => sellers.id, { onDelete: "restrict" }),
    /** 회원 주문이면 auth.users.id, 비회원이면 null */
    buyerId: uuid("buyer_id"),

    buyerName: text("buyer_name").notNull(),
    buyerPhone: text("buyer_phone").notNull(),
    /** 비회원 주문 조회용 비밀번호 (scrypt 해시) */
    buyerPasswordHash: text("buyer_password_hash"),
    /** 주문 생성 브라우저에 쿠키로 내려주는 접근 토큰 (해시 저장) */
    accessTokenHash: text("access_token_hash").notNull(),

    shippingPostalCode: text("shipping_postal_code"),
    shippingAddress: text("shipping_address").notNull(),
    shippingAddressDetail: text("shipping_address_detail"),
    shippingMemo: text("shipping_memo"),

    /** 주문 생성 시점의 상품가격 복사본 (원) */
    price: integer("price").notNull(),

    status: phoneOrderStatusEnum("status").notNull().default("WAITING_DEPOSIT"),
    /** 취소/환불 요청 직전 상태. 요청 거절 시 복원용. */
    statusBeforeRequest: phoneOrderStatusEnum("status_before_request"),
    cancelReason: text("cancel_reason"),
    /** 이 시각까지 입금완료 표시가 없으면 자동취소 */
    reservedUntil: timestamp("reserved_until", {
      withTimezone: true,
      mode: "date",
    }),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }),
    ...timestamps,
  },
  (t) => ({
    sellerIdx: index("phone_orders_seller_idx").on(t.sellerId),
    buyerIdx: index("phone_orders_buyer_idx").on(t.buyerId),
    statusIdx: index("phone_orders_status_idx").on(t.status),
    productIdx: index("phone_orders_product_idx").on(t.productId),
  }),
);

export type SelectPhoneOrder = InferSelectModel<typeof phoneOrders>;
export type InsertPhoneOrder = InferInsertModel<typeof phoneOrders>;

/** 실제 금융정보가 아니라 입금 "표시/확인" 기록 */
export const phoneBankTransferReports = pgTable("phone_bank_transfer_reports", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),
  orderId: text("order_id")
    .notNull()
    .unique()
    .references(() => phoneOrders.id, { onDelete: "cascade" }),
  /** 구매자가 입력한 입금자명 (판매자 대조용) */
  depositorName: text("depositor_name"),
  buyerReportedAt: timestamp("buyer_reported_at", {
    withTimezone: true,
    mode: "date",
  }),
  sellerConfirmedAt: timestamp("seller_confirmed_at", {
    withTimezone: true,
    mode: "date",
  }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export type SelectBankTransferReport = InferSelectModel<
  typeof phoneBankTransferReports
>;

export const phoneShipments = pgTable("phone_shipments", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),
  orderId: text("order_id")
    .notNull()
    .unique()
    .references(() => phoneOrders.id, { onDelete: "cascade" }),
  carrier: text("carrier").notNull(),
  trackingNumber: text("tracking_number").notNull(),
  shippedAt: timestamp("shipped_at", { withTimezone: true, mode: "date" }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: "date" }),
});

export type SelectPhoneShipment = InferSelectModel<typeof phoneShipments>;

export const phoneRefundRequests = pgTable(
  "phone_refund_requests",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    orderId: text("order_id")
      .notNull()
      .references(() => phoneOrders.id, { onDelete: "cascade" }),
    reason: refundReasonEnum("reason").notNull(),
    description: text("description"),
    imageUrls: json("image_urls").$type<string[]>().default([]).notNull(),

    /** 판매자가 환불금을 보낼 구매자 계좌 */
    refundBankName: text("refund_bank_name").notNull(),
    refundAccount: text("refund_account").notNull(),
    refundHolder: text("refund_holder").notNull(),

    status: refundStatusEnum("status").notNull().default("REQUESTED"),
    sellerNote: text("seller_note"),

    requestedAt: timestamp("requested_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    refundedAt: timestamp("refunded_at", { withTimezone: true, mode: "date" }),
    confirmedAt: timestamp("confirmed_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (t) => ({
    orderIdx: index("phone_refund_requests_order_idx").on(t.orderId),
  }),
);

export type SelectRefundRequest = InferSelectModel<typeof phoneRefundRequests>;

export const phoneDisputes = pgTable(
  "phone_disputes",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    orderId: text("order_id")
      .notNull()
      .references(() => phoneOrders.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    description: text("description"),
    imageUrls: json("image_urls").$type<string[]>().default([]).notNull(),

    status: disputeStatusEnum("status").notNull().default("OPEN"),
    sellerReply: text("seller_reply"),
    sellerRepliedAt: timestamp("seller_replied_at", {
      withTimezone: true,
      mode: "date",
    }),
    adminNote: text("admin_note"),
    /** 관리자가 분쟁 종료 시 주문을 어떤 상태로 마감했는지 */
    resolutionStatus: phoneOrderStatusEnum("resolution_status"),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "date" }),
  },
  (t) => ({
    orderIdx: index("phone_disputes_order_idx").on(t.orderId),
    statusIdx: index("phone_disputes_status_idx").on(t.status),
  }),
);

export type SelectDispute = InferSelectModel<typeof phoneDisputes>;

// ───────────────────────────── audit / settings ─────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: uuid("user_id"),
    actorRole: text("actor_role").notNull(), // BUYER | GUEST | SELLER | ADMIN | SYSTEM
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    oldValue: json("old_value"),
    newValue: json("new_value"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    entityIdx: index("audit_logs_entity_idx").on(t.entityType, t.entityId),
  }),
);

export type SelectAuditLog = InferSelectModel<typeof auditLogs>;
export type InsertAuditLog = InferInsertModel<typeof auditLogs>;

export const platformSettings = pgTable("platform_settings", {
  key: text("key").notNull().primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// ───────────────────────────── relations ─────────────────────────────

export const sellersRelations = relations(sellers, ({ many }) => ({
  products: many(phoneProducts),
  orders: many(phoneOrders),
}));

export const phoneProductsRelations = relations(
  phoneProducts,
  ({ one, many }) => ({
    seller: one(sellers, {
      fields: [phoneProducts.sellerId],
      references: [sellers.id],
    }),
    images: many(phoneProductImages),
    inspection: one(phoneProductInspections, {
      fields: [phoneProducts.id],
      references: [phoneProductInspections.productId],
    }),
    orders: many(phoneOrders),
  }),
);

export const phoneProductImagesRelations = relations(
  phoneProductImages,
  ({ one }) => ({
    product: one(phoneProducts, {
      fields: [phoneProductImages.productId],
      references: [phoneProducts.id],
    }),
  }),
);

export const phoneProductInspectionsRelations = relations(
  phoneProductInspections,
  ({ one }) => ({
    product: one(phoneProducts, {
      fields: [phoneProductInspections.productId],
      references: [phoneProducts.id],
    }),
  }),
);

export const phoneOrdersRelations = relations(phoneOrders, ({ one, many }) => ({
  product: one(phoneProducts, {
    fields: [phoneOrders.productId],
    references: [phoneProducts.id],
  }),
  seller: one(sellers, {
    fields: [phoneOrders.sellerId],
    references: [sellers.id],
  }),
  transferReport: one(phoneBankTransferReports, {
    fields: [phoneOrders.id],
    references: [phoneBankTransferReports.orderId],
  }),
  shipment: one(phoneShipments, {
    fields: [phoneOrders.id],
    references: [phoneShipments.orderId],
  }),
  refundRequests: many(phoneRefundRequests),
  disputes: many(phoneDisputes),
}));

export const phoneBankTransferReportsRelations = relations(
  phoneBankTransferReports,
  ({ one }) => ({
    order: one(phoneOrders, {
      fields: [phoneBankTransferReports.orderId],
      references: [phoneOrders.id],
    }),
  }),
);

export const phoneShipmentsRelations = relations(phoneShipments, ({ one }) => ({
  order: one(phoneOrders, {
    fields: [phoneShipments.orderId],
    references: [phoneOrders.id],
  }),
}));

export const phoneRefundRequestsRelations = relations(
  phoneRefundRequests,
  ({ one }) => ({
    order: one(phoneOrders, {
      fields: [phoneRefundRequests.orderId],
      references: [phoneOrders.id],
    }),
  }),
);

export const phoneDisputesRelations = relations(phoneDisputes, ({ one }) => ({
  order: one(phoneOrders, {
    fields: [phoneDisputes.orderId],
    references: [phoneOrders.id],
  }),
}));
