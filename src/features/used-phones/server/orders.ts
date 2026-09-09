import "server-only";
import db from "@/lib/supabase/db";
import {
  phoneBankTransferReports,
  phoneDisputes,
  phoneOrders,
  phoneProductImages,
  phoneProducts,
  phoneRefundRequests,
  phoneShipments,
  sellers,
  type SelectPhoneOrder,
} from "@/lib/supabase/schema";
import { and, asc, desc, eq, inArray, lt, sql, type SQL } from "drizzle-orm";
import type { OrderStatus, ProductStatus } from "../constants";
import { nextStatus, type Actor, type TransitionKey } from "../order-state";
import { generateOrderNumber, normalizePhone } from "../utils";
import {
  cancelOrderSchema,
  createOrderSchema,
  depositReportSchema,
  disputeOpenSchema,
  disputeResolveSchema,
  disputeSellerReplySchema,
  orderLookupSchema,
  refundRequestSchema,
  sellerRefundDecisionSchema,
  shipmentSchema,
  type CreateOrderInput,
  type DisputeOpenInput,
  type OrderLookupInput,
  type RefundRequestInput,
  type ShipmentInput,
} from "../validations";
import { logAudit, type AuditActorRole } from "./audit";
import {
  getSessionUser,
  isAdminUser,
  requireAdmin,
  requireApprovedSeller,
} from "./auth";
import { AppError, conflict, forbidden, notFound } from "./errors";
import { getOrderAccessCookie } from "./guest-access";
import {
  generateAccessToken,
  hashPassword,
  hashToken,
  tokenMatches,
  verifyPassword,
} from "./password";
import { sellerBankView } from "./sellers";
import { getReservationMinutes } from "./settings";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ───────────────────────────── 공통 ─────────────────────────────

async function loadOrder(where: SQL) {
  return db.query.phoneOrders.findFirst({
    where,
    with: {
      product: {
        columns: { imei: false },
        with: {
          images: { orderBy: [asc(phoneProductImages.sortOrder)], limit: 3 },
        },
      },
      seller: true,
      transferReport: true,
      shipment: true,
      refundRequests: { orderBy: [desc(phoneRefundRequests.requestedAt)] },
      disputes: { orderBy: [desc(phoneDisputes.createdAt)] },
    },
  });
}

async function findOrderByNumber(orderNumber: string) {
  return loadOrder(eq(phoneOrders.orderNumber, orderNumber));
}

async function findOrderById(orderId: string) {
  return loadOrder(eq(phoneOrders.id, orderId));
}

type LoadedOrder = NonNullable<Awaited<ReturnType<typeof findOrderByNumber>>>;

/**
 * 상태 전이 + 감사로그를 한 번에. 트랜잭션 안에서만 호출한다.
 * 동시 갱신 방지를 위해 where 에 현재 상태를 함께 건다.
 */
async function transition(
  tx: Tx,
  order: SelectPhoneOrder,
  key: TransitionKey,
  actor: Actor,
  meta: {
    userId?: string | null;
    actorRole: AuditActorRole;
    set?: Partial<SelectPhoneOrder>;
    restoreTo?: OrderStatus | null;
    adminChoice?: OrderStatus;
    note?: unknown;
  },
) {
  const to = nextStatus(key, order.status, actor, {
    restoreTo: meta.restoreTo,
    adminChoice: meta.adminChoice,
  });

  const [updated] = await tx
    .update(phoneOrders)
    .set({ status: to, updatedAt: new Date(), ...(meta.set ?? {}) })
    .where(
      and(eq(phoneOrders.id, order.id), eq(phoneOrders.status, order.status)),
    )
    .returning();

  if (!updated) {
    throw conflict(
      "주문 상태가 방금 변경되었습니다. 새로고침 후 다시 시도하세요.",
    );
  }

  await logAudit(
    {
      userId: meta.userId ?? null,
      actorRole: meta.actorRole,
      action: `ORDER_${key}`,
      entityType: "phone_order",
      entityId: order.id,
      oldValue: { status: order.status },
      newValue: { status: to, ...(meta.note ? { note: meta.note } : {}) },
    },
    tx,
  );
  return updated;
}

/** 상품 상태 변경 (기대 상태와 일치할 때만) */
async function setProductStatus(
  tx: Tx,
  productId: string,
  from: ProductStatus | ProductStatus[],
  to: ProductStatus,
) {
  const fromArr = Array.isArray(from) ? from : [from];
  await tx
    .update(phoneProducts)
    .set({ status: to, updatedAt: new Date() })
    .where(
      and(
        eq(phoneProducts.id, productId),
        inArray(phoneProducts.status, fromArr),
      ),
    );
}

/**
 * 입금기한이 지난 WAITING_DEPOSIT 주문을 자동취소하고 상품을 ON_SALE 로 되돌린다.
 * 상품 목록/상세, 판매자·관리자 주문목록 로드 시와 cron 에서 호출.
 */
export async function expireStaleReservations() {
  const now = new Date();
  return db.transaction(async (tx) => {
    const expired = await tx
      .update(phoneOrders)
      .set({
        status: "CANCELLED",
        cancelReason: "입금 기한 만료 자동취소",
        updatedAt: now,
      })
      .where(
        and(
          eq(phoneOrders.status, "WAITING_DEPOSIT"),
          lt(phoneOrders.reservedUntil, now),
        ),
      )
      .returning({ id: phoneOrders.id, productId: phoneOrders.productId });

    for (const o of expired) {
      await setProductStatus(tx, o.productId, "RESERVED", "ON_SALE");
      await logAudit(
        {
          actorRole: "SYSTEM",
          action: "ORDER_EXPIRE",
          entityType: "phone_order",
          entityId: o.id,
          oldValue: { status: "WAITING_DEPOSIT" },
          newValue: { status: "CANCELLED" },
          ip: null,
        },
        tx,
      );
    }
    return expired.length;
  });
}

// ───────────────────────────── 소비자 접근 ─────────────────────────────

type BuyerAccess = {
  order: LoadedOrder;
  actor: Actor;
  actorRole: AuditActorRole;
  userId: string | null;
};

/** 주문번호로 주문을 찾고, 현재 요청자가 볼 권한이 있는지 확인 */
async function resolveBuyerAccess(orderNumber: string): Promise<BuyerAccess> {
  const order = await findOrderByNumber(orderNumber);
  if (!order) throw notFound("주문을 찾을 수 없습니다.");

  const user = await getSessionUser();
  if (user && isAdminUser(user)) {
    return { order, actor: "ADMIN", actorRole: "ADMIN", userId: user.id };
  }
  if (user && order.buyerId && order.buyerId === user.id) {
    return { order, actor: "BUYER", actorRole: "BUYER", userId: user.id };
  }
  const cookieToken = getOrderAccessCookie(orderNumber);
  if (tokenMatches(cookieToken, order.accessTokenHash)) {
    return {
      order,
      actor: "BUYER",
      actorRole: user ? "BUYER" : "GUEST",
      userId: user?.id ?? null,
    };
  }
  throw forbidden(
    "이 주문을 조회할 권한이 없습니다. 주문조회에서 주문번호와 비밀번호로 확인하세요.",
  );
}

/** 소비자 주문 상세 뷰. 판매자 계좌는 이 화면에서만 노출된다. */
export async function getBuyerOrderView(orderNumber: string) {
  const { order, actor } = await resolveBuyerAccess(orderNumber);
  const { accessTokenHash, buyerPasswordHash, seller, ...rest } = order;
  return {
    ...rest,
    seller: sellerBankView(seller),
    viewerIsAdmin: actor === "ADMIN",
  };
}
export type BuyerOrderView = Awaited<ReturnType<typeof getBuyerOrderView>>;

/** 비회원 주문조회: 주문번호 + 휴대폰 + 비밀번호 → 접근 토큰 발급 */
export async function lookupGuestOrder(raw: OrderLookupInput) {
  const input = orderLookupSchema.parse(raw);
  const order = await db.query.phoneOrders.findFirst({
    where: eq(phoneOrders.orderNumber, input.orderNumber),
  });
  const genericError = new AppError("주문 정보가 일치하지 않습니다.", 404);
  if (!order) throw genericError;
  if (normalizePhone(order.buyerPhone) !== normalizePhone(input.buyerPhone))
    throw genericError;
  if (!verifyPassword(input.password, order.buyerPasswordHash))
    throw genericError;

  // 새 토큰 발급 (기존 브라우저 쿠키는 무효화됨)
  const token = generateAccessToken();
  await db
    .update(phoneOrders)
    .set({ accessTokenHash: hashToken(token), updatedAt: new Date() })
    .where(eq(phoneOrders.id, order.id));
  return { orderNumber: order.orderNumber, token };
}

/** 회원 본인 주문 목록 */
export async function listMyOrders() {
  const user = await getSessionUser();
  if (!user) return [];
  return db.query.phoneOrders.findMany({
    where: eq(phoneOrders.buyerId, user.id),
    orderBy: [desc(phoneOrders.createdAt)],
    columns: { accessTokenHash: false, buyerPasswordHash: false },
    with: {
      product: {
        columns: { imei: false },
        with: {
          images: { orderBy: [asc(phoneProductImages.sortOrder)], limit: 1 },
        },
      },
      seller: { columns: { businessName: true } },
    },
  });
}

// ───────────────────────────── 주문 생성 ─────────────────────────────

function isUniqueViolation(err: unknown) {
  return Boolean(
    err && typeof err === "object" && (err as any).code === "23505",
  );
}

/**
 * 주문 생성.
 *  1) 상품 ON_SALE → RESERVED 를 조건부 UPDATE 로 원자적으로 잡는다 (동시구매 방지)
 *  2) 주문 생성 시점 가격을 orders.price 에 복사 (판매자가 이후 가격을 바꿔도 불변)
 *  3) 입금기한(reserved_until) 설정
 *  4) 접근 토큰 발급 → 호출자가 쿠키에 심는다
 */
export async function createOrder(raw: CreateOrderInput) {
  const input = createOrderSchema.parse(raw);
  const user = await getSessionUser();

  if (!user && !input.password) {
    throw new AppError("비회원 주문은 주문조회 비밀번호가 필요합니다.");
  }

  const reservationMinutes = await getReservationMinutes();
  const token = generateAccessToken();

  for (let attempt = 0; attempt < 5; attempt++) {
    const orderNumber = generateOrderNumber();
    try {
      const order = await db.transaction(async (tx) => {
        const [product] = await tx
          .update(phoneProducts)
          .set({ status: "RESERVED", updatedAt: new Date() })
          .where(
            and(
              eq(phoneProducts.id, input.productId),
              eq(phoneProducts.status, "ON_SALE"),
            ),
          )
          .returning();

        if (!product) {
          throw conflict(
            "이 상품은 방금 다른 고객이 주문했거나 현재 판매중이 아닙니다.",
          );
        }

        const seller = await tx.query.sellers.findFirst({
          where: eq(sellers.id, product.sellerId),
        });
        if (!seller || seller.status !== "APPROVED") {
          throw conflict("현재 주문을 받을 수 없는 판매자입니다.");
        }

        const reservedUntil = new Date(
          Date.now() + reservationMinutes * 60 * 1000,
        );
        const [o] = await tx
          .insert(phoneOrders)
          .values({
            orderNumber,
            productId: product.id,
            sellerId: product.sellerId,
            buyerId: user?.id ?? null,
            buyerName: input.buyerName,
            buyerPhone: normalizePhone(input.buyerPhone),
            buyerPasswordHash: input.password
              ? hashPassword(input.password)
              : null,
            accessTokenHash: hashToken(token),
            shippingPostalCode: input.shippingPostalCode || null,
            shippingAddress: input.shippingAddress,
            shippingAddressDetail: input.shippingAddressDetail || null,
            shippingMemo: input.shippingMemo || null,
            price: product.price,
            status: "WAITING_DEPOSIT",
            reservedUntil,
          })
          .returning();

        await tx.insert(phoneBankTransferReports).values({ orderId: o.id });

        await logAudit(
          {
            userId: user?.id ?? null,
            actorRole: user ? "BUYER" : "GUEST",
            action: "ORDER_CREATED",
            entityType: "phone_order",
            entityId: o.id,
            newValue: {
              orderNumber,
              productId: product.id,
              price: product.price,
              status: "WAITING_DEPOSIT",
              reservedUntil,
            },
          },
          tx,
        );
        await logAudit(
          {
            userId: user?.id ?? null,
            actorRole: "SYSTEM",
            action: "PRODUCT_RESERVED",
            entityType: "phone_product",
            entityId: product.id,
            oldValue: { status: "ON_SALE" },
            newValue: { status: "RESERVED", orderId: o.id },
          },
          tx,
        );
        return o;
      });
      return { order, token, reservationMinutes };
    } catch (err) {
      if (isUniqueViolation(err) && attempt < 4) continue; // 주문번호 충돌 → 재시도
      throw err;
    }
  }
  throw new AppError("주문번호 생성에 실패했습니다. 다시 시도해주세요.", 500);
}

// ───────────────────────────── 소비자 액션 ─────────────────────────────

export async function reportDeposit(
  orderNumber: string,
  raw: { depositorName: string },
) {
  const input = depositReportSchema.parse(raw);
  const { order, actor, actorRole, userId } =
    await resolveBuyerAccess(orderNumber);
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, "REPORT_DEPOSIT", actor, {
      userId,
      actorRole,
      note: { depositorName: input.depositorName },
    });
    await tx
      .update(phoneBankTransferReports)
      .set({ buyerReportedAt: new Date(), depositorName: input.depositorName })
      .where(eq(phoneBankTransferReports.orderId, order.id));
    return updated;
  });
}

/** 입금 전 즉시 취소 */
export async function cancelBeforeDeposit(
  orderNumber: string,
  raw: { reason?: string } = {},
) {
  const input = cancelOrderSchema.parse(raw);
  const { order, actor, actorRole, userId } =
    await resolveBuyerAccess(orderNumber);
  return db.transaction(async (tx) => {
    const updated = await transition(
      tx,
      order,
      "CANCEL_BEFORE_DEPOSIT",
      actor,
      {
        userId,
        actorRole,
        set: { cancelReason: input.reason || "구매자 취소 (입금 전)" },
      },
    );
    await setProductStatus(tx, order.productId, "RESERVED", "ON_SALE");
    return updated;
  });
}

/** 입금 후 취소 요청 (판매자 승인 필요) */
export async function requestCancel(
  orderNumber: string,
  raw: { reason?: string } = {},
) {
  const input = cancelOrderSchema.parse(raw);
  const { order, actor, actorRole, userId } =
    await resolveBuyerAccess(orderNumber);
  return db.transaction(async (tx) =>
    transition(tx, order, "REQUEST_CANCEL", actor, {
      userId,
      actorRole,
      set: {
        cancelReason: input.reason || null,
        statusBeforeRequest: order.status,
      },
    }),
  );
}

export async function requestRefund(
  orderNumber: string,
  raw: RefundRequestInput,
) {
  const input = refundRequestSchema.parse(raw);
  const { order, actor, actorRole, userId } =
    await resolveBuyerAccess(orderNumber);
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, "REQUEST_REFUND", actor, {
      userId,
      actorRole,
      set: { statusBeforeRequest: order.status },
      note: { reason: input.reason },
    });
    const [rr] = await tx
      .insert(phoneRefundRequests)
      .values({
        orderId: order.id,
        reason: input.reason,
        description: input.description || null,
        imageUrls: input.imageUrls,
        refundBankName: input.refundBankName,
        refundAccount: input.refundAccount,
        refundHolder: input.refundHolder,
      })
      .returning();
    await logAudit(
      {
        userId,
        actorRole,
        action: "REFUND_REQUESTED",
        entityType: "refund_request",
        entityId: rr.id,
        newValue: { orderId: order.id, reason: input.reason },
      },
      tx,
    );
    return updated;
  });
}

export async function withdrawRefund(orderNumber: string) {
  const { order, actor, actorRole, userId } =
    await resolveBuyerAccess(orderNumber);
  const active = order.refundRequests.find((r) =>
    ["REQUESTED", "REJECTED"].includes(r.status),
  );
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, "WITHDRAW_REFUND", actor, {
      userId,
      actorRole,
      restoreTo: order.statusBeforeRequest,
      set: { statusBeforeRequest: null },
    });
    if (active) {
      await tx
        .update(phoneRefundRequests)
        .set({ status: "WITHDRAWN" })
        .where(eq(phoneRefundRequests.id, active.id));
    }
    return updated;
  });
}

/** 구매자: 환불금 입금 확인 → REFUNDED */
export async function confirmRefund(orderNumber: string) {
  const { order, actor, actorRole, userId } =
    await resolveBuyerAccess(orderNumber);
  const active = order.refundRequests.find(
    (r) => r.status === "SELLER_REFUNDED",
  );
  if (!active && actor !== "ADMIN") {
    throw conflict("판매자가 아직 환불완료 처리를 하지 않았습니다.");
  }
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, "CONFIRM_REFUND", actor, {
      userId,
      actorRole,
      set: { statusBeforeRequest: null },
    });
    if (active) {
      await tx
        .update(phoneRefundRequests)
        .set({ status: "CONFIRMED", confirmedAt: new Date() })
        .where(eq(phoneRefundRequests.id, active.id));
    }
    // 기기가 돌아왔으므로 판매자가 재검수 후 다시 올리도록 STOPPED
    await setProductStatus(tx, order.productId, "SOLD", "STOPPED");
    return updated;
  });
}

export async function openDispute(orderNumber: string, raw: DisputeOpenInput) {
  const input = disputeOpenSchema.parse(raw);
  const { order, actor, actorRole, userId } =
    await resolveBuyerAccess(orderNumber);
  if (order.disputes.some((d) => d.status !== "RESOLVED")) {
    throw conflict("이미 진행 중인 분쟁이 있습니다.");
  }
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, "OPEN_DISPUTE", actor, {
      userId,
      actorRole,
      set: { statusBeforeRequest: order.statusBeforeRequest ?? order.status },
      note: { reason: input.reason },
    });
    const [d] = await tx
      .insert(phoneDisputes)
      .values({
        orderId: order.id,
        reason: input.reason,
        description: input.description || null,
        imageUrls: input.imageUrls,
      })
      .returning();
    await logAudit(
      {
        userId,
        actorRole,
        action: "DISPUTE_OPENED",
        entityType: "dispute",
        entityId: d.id,
        newValue: { orderId: order.id, reason: input.reason },
      },
      tx,
    );
    return updated;
  });
}

/** 구매자: 배송 받았습니다 */
export async function buyerMarkDelivered(orderNumber: string) {
  const { order, actor, actorRole, userId } =
    await resolveBuyerAccess(orderNumber);
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, "MARK_DELIVERED", actor, {
      userId,
      actorRole,
    });
    await tx
      .update(phoneShipments)
      .set({ deliveredAt: new Date() })
      .where(eq(phoneShipments.orderId, order.id));
    return updated;
  });
}

/** 구매자: 구매확정. MVP 에서는 돈과 연결되지 않는 상태 기록. */
export async function completeOrder(orderNumber: string) {
  const { order, actor, actorRole, userId } =
    await resolveBuyerAccess(orderNumber);
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, "COMPLETE", actor, {
      userId,
      actorRole,
      set: { completedAt: new Date() },
    });
    if (order.status === "SHIPPED") {
      await tx
        .update(phoneShipments)
        .set({ deliveredAt: new Date() })
        .where(eq(phoneShipments.orderId, order.id));
    }
    return updated;
  });
}

// ───────────────────────────── 판매자 ─────────────────────────────

async function resolveSellerOrder(orderId: string) {
  const { user, seller } = await requireApprovedSeller();
  const order = await findOrderById(orderId);
  if (!order || order.sellerId !== seller.id)
    throw notFound("주문을 찾을 수 없습니다.");
  return { user, seller, order };
}

export async function listSellerOrders(status?: OrderStatus | OrderStatus[]) {
  const { seller } = await requireApprovedSeller();
  await expireStaleReservations().catch(() => undefined);
  const statuses = status
    ? Array.isArray(status)
      ? status
      : [status]
    : undefined;
  return db.query.phoneOrders.findMany({
    where: and(
      eq(phoneOrders.sellerId, seller.id),
      statuses ? inArray(phoneOrders.status, statuses) : undefined,
    ),
    orderBy: [desc(phoneOrders.createdAt)],
    columns: { accessTokenHash: false, buyerPasswordHash: false },
    with: {
      product: {
        columns: { imei: false },
        with: {
          images: { orderBy: [asc(phoneProductImages.sortOrder)], limit: 1 },
        },
      },
      transferReport: true,
      shipment: true,
    },
  });
}
export type SellerOrderRow = Awaited<
  ReturnType<typeof listSellerOrders>
>[number];

export async function getSellerOrderView(orderId: string) {
  const { order } = await resolveSellerOrder(orderId);
  const { accessTokenHash, buyerPasswordHash, ...rest } = order;
  return rest;
}
export type SellerOrderView = Awaited<ReturnType<typeof getSellerOrderView>>;

export async function sellerOrderStats() {
  const { seller } = await requireApprovedSeller();
  const rows = await db
    .select({ status: phoneOrders.status, count: sql<number>`count(*)::int` })
    .from(phoneOrders)
    .where(eq(phoneOrders.sellerId, seller.id))
    .groupBy(phoneOrders.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.count])) as Partial<
    Record<OrderStatus, number>
  >;
}

/** 판매자: 실제 계좌 확인 후 입금 확인. 상품은 SOLD. */
export async function sellerConfirmDeposit(orderId: string) {
  const { user, order } = await resolveSellerOrder(orderId);
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, "CONFIRM_DEPOSIT", "SELLER", {
      userId: user.id,
      actorRole: "SELLER",
      set: { reservedUntil: null },
    });
    await tx
      .update(phoneBankTransferReports)
      .set({ sellerConfirmedAt: new Date() })
      .where(eq(phoneBankTransferReports.orderId, order.id));
    await setProductStatus(tx, order.productId, "RESERVED", "SOLD");
    return updated;
  });
}

/** 판매자: 입금이 확인되지 않음 → 다시 입금대기. 입금기한을 다시 준다. */
export async function sellerUnconfirmDeposit(orderId: string) {
  const { user, order } = await resolveSellerOrder(orderId);
  const minutes = await getReservationMinutes();
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, "UNCONFIRM_DEPOSIT", "SELLER", {
      userId: user.id,
      actorRole: "SELLER",
      set: { reservedUntil: new Date(Date.now() + minutes * 60 * 1000) },
    });
    await tx
      .update(phoneBankTransferReports)
      .set({ buyerReportedAt: null })
      .where(eq(phoneBankTransferReports.orderId, order.id));
    return updated;
  });
}

export async function sellerStartPreparing(orderId: string) {
  const { user, order } = await resolveSellerOrder(orderId);
  return db.transaction(async (tx) =>
    transition(tx, order, "START_PREPARING", "SELLER", {
      userId: user.id,
      actorRole: "SELLER",
    }),
  );
}

export async function sellerShip(orderId: string, raw: ShipmentInput) {
  const input = shipmentSchema.parse(raw);
  const { user, order } = await resolveSellerOrder(orderId);
  const shippedAt = input.shippedAt ? new Date(input.shippedAt) : new Date();
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, "SHIP", "SELLER", {
      userId: user.id,
      actorRole: "SELLER",
      note: { carrier: input.carrier, trackingNumber: input.trackingNumber },
    });
    await tx
      .insert(phoneShipments)
      .values({
        orderId: order.id,
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        shippedAt,
      })
      .onConflictDoUpdate({
        target: phoneShipments.orderId,
        set: {
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          shippedAt,
        },
      });
    return updated;
  });
}

export async function sellerMarkDelivered(orderId: string) {
  const { user, order } = await resolveSellerOrder(orderId);
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, "MARK_DELIVERED", "SELLER", {
      userId: user.id,
      actorRole: "SELLER",
    });
    await tx
      .update(phoneShipments)
      .set({ deliveredAt: new Date() })
      .where(eq(phoneShipments.orderId, order.id));
    return updated;
  });
}

/** 판매자: 입금 전 주문을 판매자가 취소 (예: 재고 문제) */
export async function sellerCancelBeforeDeposit(
  orderId: string,
  reason?: string,
) {
  const { user, order } = await resolveSellerOrder(orderId);
  return db.transaction(async (tx) => {
    const updated = await transition(
      tx,
      order,
      "CANCEL_BEFORE_DEPOSIT",
      "SELLER",
      {
        userId: user.id,
        actorRole: "SELLER",
        set: { cancelReason: reason?.trim() || "판매자 취소" },
      },
    );
    await setProductStatus(tx, order.productId, "RESERVED", "ON_SALE");
    return updated;
  });
}

/** 판매자: 환불 완료 후 취소 승인 → CANCELLED, 상품 ON_SALE 복귀 */
export async function sellerApproveCancel(orderId: string) {
  const { user, order } = await resolveSellerOrder(orderId);
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, "APPROVE_CANCEL", "SELLER", {
      userId: user.id,
      actorRole: "SELLER",
      set: { statusBeforeRequest: null },
    });
    await setProductStatus(
      tx,
      order.productId,
      ["SOLD", "RESERVED"],
      "ON_SALE",
    );
    return updated;
  });
}

export async function sellerRejectCancel(orderId: string, note?: string) {
  const { user, order } = await resolveSellerOrder(orderId);
  return db.transaction(async (tx) =>
    transition(tx, order, "REJECT_CANCEL", "SELLER", {
      userId: user.id,
      actorRole: "SELLER",
      restoreTo: order.statusBeforeRequest,
      set: { statusBeforeRequest: null, cancelReason: null },
      note: { rejectNote: note ?? null },
    }),
  );
}

/** 판매자: 환불 처리 결과. REFUNDED 는 주문상태를 바꾸지 않고 구매자 확인을 기다린다. */
export async function sellerDecideRefund(
  orderId: string,
  raw: { decision: "REFUNDED" | "REJECTED"; note?: string },
) {
  const input = sellerRefundDecisionSchema.parse(raw);
  const { user, order } = await resolveSellerOrder(orderId);
  if (order.status !== "REFUND_REQUESTED")
    throw conflict("환불 요청 상태의 주문이 아닙니다.");
  const active = order.refundRequests.find((r) =>
    ["REQUESTED", "REJECTED"].includes(r.status),
  );
  if (!active) throw notFound("처리할 환불 요청이 없습니다.");

  const [rr] = await db
    .update(phoneRefundRequests)
    .set({
      status: input.decision === "REFUNDED" ? "SELLER_REFUNDED" : "REJECTED",
      sellerNote: input.note || null,
      refundedAt: input.decision === "REFUNDED" ? new Date() : null,
    })
    .where(eq(phoneRefundRequests.id, active.id))
    .returning();

  await logAudit({
    userId: user.id,
    actorRole: "SELLER",
    action:
      input.decision === "REFUNDED"
        ? "REFUND_SELLER_COMPLETED"
        : "REFUND_SELLER_REJECTED",
    entityType: "refund_request",
    entityId: rr.id,
    oldValue: { status: active.status },
    newValue: { status: rr.status, note: input.note ?? null },
  });
  return rr;
}

export async function sellerReplyDispute(
  orderId: string,
  raw: { reply: string },
) {
  const input = disputeSellerReplySchema.parse(raw);
  const { user, order } = await resolveSellerOrder(orderId);
  const open = order.disputes.find((d) => d.status !== "RESOLVED");
  if (!open) throw notFound("진행 중인 분쟁이 없습니다.");
  const [d] = await db
    .update(phoneDisputes)
    .set({
      sellerReply: input.reply,
      sellerRepliedAt: new Date(),
      status: "SELLER_REPLIED",
    })
    .where(eq(phoneDisputes.id, open.id))
    .returning();
  await logAudit({
    userId: user.id,
    actorRole: "SELLER",
    action: "DISPUTE_SELLER_REPLIED",
    entityType: "dispute",
    entityId: d.id,
    newValue: { reply: input.reply },
  });
  return d;
}

// ───────────────────────────── 관리자 ─────────────────────────────

export async function adminListOrders(status?: OrderStatus) {
  await requireAdmin();
  await expireStaleReservations().catch(() => undefined);
  return db.query.phoneOrders.findMany({
    where: status ? eq(phoneOrders.status, status) : undefined,
    orderBy: [desc(phoneOrders.createdAt)],
    limit: 300,
    columns: { accessTokenHash: false, buyerPasswordHash: false },
    with: {
      product: {
        columns: {
          id: true,
          brand: true,
          model: true,
          storage: true,
          color: true,
        },
      },
      seller: { columns: { id: true, businessName: true } },
    },
  });
}
export type AdminOrderRow = Awaited<ReturnType<typeof adminListOrders>>[number];

export async function adminGetOrder(orderId: string) {
  await requireAdmin();
  const order = await findOrderById(orderId);
  if (!order) throw notFound("주문을 찾을 수 없습니다.");
  const { accessTokenHash, buyerPasswordHash, ...rest } = order;
  return rest;
}
export type AdminOrderView = Awaited<ReturnType<typeof adminGetOrder>>;

export async function adminListDisputes(
  status?: "OPEN" | "SELLER_REPLIED" | "RESOLVED",
) {
  await requireAdmin();
  return db.query.phoneDisputes.findMany({
    where: status ? eq(phoneDisputes.status, status) : undefined,
    orderBy: [desc(phoneDisputes.createdAt)],
    limit: 300,
    with: {
      order: {
        columns: { accessTokenHash: false, buyerPasswordHash: false },
        with: {
          product: {
            columns: { id: true, brand: true, model: true, storage: true },
          },
          seller: { columns: { id: true, businessName: true } },
        },
      },
    },
  });
}
export type AdminDisputeRow = Awaited<
  ReturnType<typeof adminListDisputes>
>[number];

export async function adminGetDispute(disputeId: string) {
  await requireAdmin();
  const dispute = await db.query.phoneDisputes.findFirst({
    where: eq(phoneDisputes.id, disputeId),
  });
  if (!dispute) throw notFound("분쟁을 찾을 수 없습니다.");
  const order = await findOrderById(dispute.orderId);
  if (!order) throw notFound("주문을 찾을 수 없습니다.");
  const { accessTokenHash, buyerPasswordHash, ...rest } = order;
  return { dispute, order: rest };
}
export type AdminDisputeView = Awaited<ReturnType<typeof adminGetDispute>>;

/** 관리자: 분쟁 종료 + 주문 최종 상태 지정 */
export async function adminResolveDispute(
  disputeId: string,
  raw: { adminNote: string; resolutionStatus: string },
) {
  const admin = await requireAdmin();
  const input = disputeResolveSchema.parse(raw);
  const dispute = await db.query.phoneDisputes.findFirst({
    where: eq(phoneDisputes.id, disputeId),
  });
  if (!dispute) throw notFound("분쟁을 찾을 수 없습니다.");
  if (dispute.status === "RESOLVED") throw conflict("이미 처리된 분쟁입니다.");
  const order = await findOrderById(dispute.orderId);
  if (!order) throw notFound("주문을 찾을 수 없습니다.");

  const resolution = input.resolutionStatus as OrderStatus;
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, "RESOLVE_DISPUTE", "ADMIN", {
      userId: admin.id,
      actorRole: "ADMIN",
      adminChoice: resolution,
      set: {
        statusBeforeRequest: null,
        completedAt:
          resolution === "COMPLETED" ? new Date() : order.completedAt,
      },
      note: { disputeId, adminNote: input.adminNote },
    });
    await tx
      .update(phoneDisputes)
      .set({
        status: "RESOLVED",
        adminNote: input.adminNote,
        resolutionStatus: resolution,
        resolvedAt: new Date(),
      })
      .where(eq(phoneDisputes.id, disputeId));

    // 열려있는 환불요청도 함께 정리
    await tx
      .update(phoneRefundRequests)
      .set({
        status: resolution === "REFUNDED" ? "CONFIRMED" : "REJECTED",
        confirmedAt: resolution === "REFUNDED" ? new Date() : null,
      })
      .where(
        and(
          eq(phoneRefundRequests.orderId, order.id),
          inArray(phoneRefundRequests.status, [
            "REQUESTED",
            "SELLER_REFUNDED",
            "REJECTED",
          ]),
        ),
      );

    if (resolution === "REFUNDED") {
      await setProductStatus(
        tx,
        order.productId,
        ["SOLD", "RESERVED"],
        "STOPPED",
      );
    } else if (resolution === "CANCELLED") {
      await setProductStatus(
        tx,
        order.productId,
        ["SOLD", "RESERVED"],
        "ON_SALE",
      );
    }

    await logAudit(
      {
        userId: admin.id,
        actorRole: "ADMIN",
        action: "DISPUTE_RESOLVED",
        entityType: "dispute",
        entityId: disputeId,
        oldValue: { status: dispute.status },
        newValue: { status: "RESOLVED", resolutionStatus: resolution },
      },
      tx,
    );
    return updated;
  });
}

/** 관리자가 특정 주문에 대해 임의 전이 (판매자 대행 등) */
export async function adminTransition(
  orderId: string,
  key: TransitionKey,
  extra?: { adminChoice?: OrderStatus; note?: string },
) {
  const admin = await requireAdmin();
  const order = await findOrderById(orderId);
  if (!order) throw notFound("주문을 찾을 수 없습니다.");
  return db.transaction(async (tx) => {
    const updated = await transition(tx, order, key, "ADMIN", {
      userId: admin.id,
      actorRole: "ADMIN",
      restoreTo: order.statusBeforeRequest,
      adminChoice: extra?.adminChoice,
      note: extra?.note ? { note: extra.note } : undefined,
    });
    if (key === "CONFIRM_DEPOSIT") {
      await setProductStatus(tx, order.productId, "RESERVED", "SOLD");
      await tx
        .update(phoneBankTransferReports)
        .set({ sellerConfirmedAt: new Date() })
        .where(eq(phoneBankTransferReports.orderId, order.id));
    }
    if (["CANCEL_BEFORE_DEPOSIT", "EXPIRE", "APPROVE_CANCEL"].includes(key)) {
      await setProductStatus(
        tx,
        order.productId,
        ["RESERVED", "SOLD"],
        "ON_SALE",
      );
    }
    if (key === "CONFIRM_REFUND") {
      await setProductStatus(tx, order.productId, "SOLD", "STOPPED");
    }
    return updated;
  });
}

/** 운영 대시보드 8개 숫자 (기획서 50) */
export async function adminDashboardStats() {
  await requireAdmin();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    [sellerRow],
    [productRow],
    [todayProductRow],
    orderRows,
    [disputeRow],
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(sellers)
      .where(eq(sellers.status, "APPROVED")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(phoneProducts)
      .where(eq(phoneProducts.status, "ON_SALE")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(phoneProducts)
      .where(sql`${phoneProducts.createdAt} >= ${todayStart}`),
    db
      .select({
        status: phoneOrders.status,
        count: sql<number>`count(*)::int`,
        amount: sql<number>`coalesce(sum(${phoneOrders.price}), 0)::bigint`,
      })
      .from(phoneOrders)
      .groupBy(phoneOrders.status),
    db
      .select({
        count: sql<number>`count(distinct ${phoneDisputes.orderId})::int`,
      })
      .from(phoneDisputes),
  ]);

  const byStatus = new Map(orderRows.map((r) => [r.status, r]));
  const totalOrders = orderRows.reduce((a, r) => a + r.count, 0);
  const depositConfirmedStatuses: OrderStatus[] = [
    "DEPOSIT_CONFIRMED",
    "PREPARING",
    "SHIPPED",
    "DELIVERED",
    "COMPLETED",
    "CANCEL_REQUESTED",
    "REFUND_REQUESTED",
    "REFUNDED",
    "DISPUTED",
  ];
  const depositConfirmed = depositConfirmedStatuses.reduce(
    (a, s) => a + (byStatus.get(s)?.count ?? 0),
    0,
  );
  const completed = byStatus.get("COMPLETED")?.count ?? 0;
  const gmv = Number(byStatus.get("COMPLETED")?.amount ?? 0);
  const disputedOrders = disputeRow?.count ?? 0;

  return {
    approvedSellers: sellerRow?.count ?? 0,
    onSaleProducts: productRow?.count ?? 0,
    productsToday: todayProductRow?.count ?? 0,
    totalOrders,
    depositConfirmed,
    completed,
    gmv,
    disputeRate:
      totalOrders > 0
        ? Math.round((disputedOrders / totalOrders) * 1000) / 10
        : 0,
    byStatus: Object.fromEntries(
      orderRows.map((r) => [r.status, r.count]),
    ) as Partial<Record<OrderStatus, number>>,
  };
}
