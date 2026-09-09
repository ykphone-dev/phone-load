import "server-only";
import db from "@/lib/supabase/db";
import {
  phoneOrders,
  phoneProductImages,
  phoneProductInspections,
  phoneProducts,
  type SelectPhoneProduct,
} from "@/lib/supabase/schema";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  ne,
  sql,
} from "drizzle-orm";
import type { ProductStatus } from "../constants";
import { maskImei } from "../utils";
import {
  productFormSchema,
  productListQuerySchema,
  type ProductFormInput,
  type ProductListQuery,
} from "../validations";
import { logAudit } from "./audit";
import { requireAdmin, requireApprovedSeller } from "./auth";
import { AppError, conflict, forbidden, notFound } from "./errors";
import { expireStaleReservations } from "./orders";

/** 소비자에게 노출 가능한 상태 */
const PUBLIC_STATUSES: ProductStatus[] = ["ON_SALE", "RESERVED", "SOLD"];

// ───────────────────────────── 소비자 ─────────────────────────────

export async function listPublicProducts(
  rawQuery: Partial<ProductListQuery> = {},
) {
  const q = productListQuerySchema.parse(rawQuery);
  await expireStaleReservations().catch(() => undefined);

  const conditions = [inArray(phoneProducts.status, ["ON_SALE", "RESERVED"])];
  if (q.brand) conditions.push(eq(phoneProducts.brand, q.brand));
  if (q.model) conditions.push(ilike(phoneProducts.model, `%${q.model}%`));
  if (q.storage) conditions.push(eq(phoneProducts.storage, q.storage));
  if (q.grade) conditions.push(eq(phoneProducts.conditionGrade, q.grade));
  if (q.minPrice != null) conditions.push(gte(phoneProducts.price, q.minPrice));
  if (q.maxPrice != null) conditions.push(lte(phoneProducts.price, q.maxPrice));
  const where = and(...conditions);

  const orderBy =
    q.sort === "price_asc"
      ? [asc(phoneProducts.price), desc(phoneProducts.createdAt)]
      : q.sort === "price_desc"
        ? [desc(phoneProducts.price), desc(phoneProducts.createdAt)]
        : [desc(phoneProducts.createdAt)];

  const [items, [{ total }]] = await Promise.all([
    db.query.phoneProducts.findMany({
      where,
      orderBy,
      limit: q.pageSize,
      offset: (q.page - 1) * q.pageSize,
      columns: { imei: false },
      with: {
        images: { orderBy: [asc(phoneProductImages.sortOrder)], limit: 1 },
        seller: { columns: { id: true, businessName: true } },
      },
    }),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(phoneProducts)
      .where(where),
  ]);

  return {
    items,
    total,
    page: q.page,
    pageSize: q.pageSize,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    query: q,
  };
}

/** 상품 상세 (소비자). IMEI 는 마스킹, 판매자 계좌는 포함하지 않는다. */
export async function getPublicProduct(productId: string) {
  await expireStaleReservations().catch(() => undefined);
  const product = await db.query.phoneProducts.findFirst({
    where: and(
      eq(phoneProducts.id, productId),
      inArray(phoneProducts.status, PUBLIC_STATUSES),
    ),
    with: {
      images: { orderBy: [asc(phoneProductImages.sortOrder)] },
      inspection: true,
      seller: { columns: { id: true, businessName: true, status: true } },
    },
  });
  if (!product) return null;
  const { imei, ...rest } = product;
  return { ...rest, imeiMasked: maskImei(imei) };
}

/** 필터용 모델 목록 (판매중 상품 기준) */
export async function listPublicModels() {
  const rows = await db
    .selectDistinct({ brand: phoneProducts.brand, model: phoneProducts.model })
    .from(phoneProducts)
    .where(inArray(phoneProducts.status, ["ON_SALE", "RESERVED"]))
    .orderBy(asc(phoneProducts.brand), asc(phoneProducts.model));
  return rows;
}

// ───────────────────────────── 판매자 ─────────────────────────────

function toProductValues(input: ProductFormInput, sellerId: string) {
  return {
    sellerId,
    brand: input.brand,
    model: input.model,
    storage: input.storage,
    color: input.color,
    price: input.price,
    conditionGrade: input.conditionGrade,
    screenCondition: input.screenCondition,
    frameCondition: input.frameCondition,
    backCondition: input.backCondition,
    batteryHealth: input.brand === "APPLE" ? input.batteryHealth ?? null : null,
    batteryStatus:
      input.brand === "SAMSUNG" ? input.batteryStatus ?? null : null,
    repairHistory: input.repairHistory,
    repairNote: input.repairHistory === "YES" ? input.repairNote || null : null,
    partsReplacement: input.partsReplacement,
    partsNote:
      input.partsReplacement === "YES" ? input.partsNote || null : null,
    notLostOrStolen: input.notLostOrStolen,
    normalTermination: input.normalTermination,
    contractDiscount: input.contractDiscount,
    imei: input.imei || null,
    description: input.description || null,
    updatedAt: new Date(),
  };
}

export async function createProduct(raw: ProductFormInput) {
  const { user, seller } = await requireApprovedSeller();
  const input = productFormSchema.parse(raw);

  const product = await db.transaction(async (tx) => {
    const [p] = await tx
      .insert(phoneProducts)
      .values({
        ...toProductValues(input, seller.id),
        status: input.publish ? "ON_SALE" : "DRAFT",
      })
      .returning();

    await tx
      .insert(phoneProductInspections)
      .values({ productId: p.id, ...input.inspection });

    if (input.images.length > 0) {
      await tx.insert(phoneProductImages).values(
        input.images.map((img, i) => ({
          productId: p.id,
          imageUrl: img.imageUrl,
          kind: img.kind,
          sortOrder: i,
        })),
      );
    }

    await logAudit(
      {
        userId: user.id,
        actorRole: "SELLER",
        action: "PRODUCT_CREATED",
        entityType: "phone_product",
        entityId: p.id,
        newValue: { status: p.status, price: p.price, model: p.model },
      },
      tx,
    );
    return p;
  });
  return product;
}

export async function getSellerProduct(productId: string) {
  const { seller } = await requireApprovedSeller();
  const product = await db.query.phoneProducts.findFirst({
    where: and(
      eq(phoneProducts.id, productId),
      eq(phoneProducts.sellerId, seller.id),
      ne(phoneProducts.status, "DELETED"),
    ),
    with: {
      images: { orderBy: [asc(phoneProductImages.sortOrder)] },
      inspection: true,
    },
  });
  if (!product) throw notFound("상품을 찾을 수 없습니다.");
  return product;
}

export async function updateProduct(productId: string, raw: ProductFormInput) {
  const { user, seller } = await requireApprovedSeller();
  const input = productFormSchema.parse(raw);
  const existing = await getSellerProduct(productId);

  if (["RESERVED", "SOLD"].includes(existing.status)) {
    throw conflict(
      "주문이 진행 중이거나 판매완료된 상품은 수정할 수 없습니다.",
    );
  }

  // 수정 시 상태: 발행이면 ON_SALE, 아니면 기존이 DRAFT 면 DRAFT 유지, STOPPED 면 STOPPED 유지
  const nextStatus: ProductStatus = input.publish
    ? "ON_SALE"
    : existing.status === "ON_SALE"
      ? "STOPPED"
      : existing.status;

  const product = await db.transaction(async (tx) => {
    const [p] = await tx
      .update(phoneProducts)
      .set({ ...toProductValues(input, seller.id), status: nextStatus })
      .where(eq(phoneProducts.id, productId))
      .returning();

    await tx
      .insert(phoneProductInspections)
      .values({ productId, ...input.inspection })
      .onConflictDoUpdate({
        target: phoneProductInspections.productId,
        set: { ...input.inspection },
      });

    await tx
      .delete(phoneProductImages)
      .where(eq(phoneProductImages.productId, productId));
    if (input.images.length > 0) {
      await tx.insert(phoneProductImages).values(
        input.images.map((img, i) => ({
          productId,
          imageUrl: img.imageUrl,
          kind: img.kind,
          sortOrder: i,
        })),
      );
    }

    await logAudit(
      {
        userId: user.id,
        actorRole: "SELLER",
        action: "PRODUCT_UPDATED",
        entityType: "phone_product",
        entityId: productId,
        oldValue: { status: existing.status, price: existing.price },
        newValue: { status: p.status, price: p.price },
      },
      tx,
    );
    return p;
  });
  return product;
}

/** 판매중지 / 판매재개 / 삭제 */
export async function setSellerProductStatus(
  productId: string,
  action: "STOP" | "RESUME" | "DELETE",
) {
  const { user } = await requireApprovedSeller();
  const existing = await getSellerProduct(productId);

  let next: ProductStatus;
  if (action === "STOP") {
    if (existing.status !== "ON_SALE")
      throw conflict("판매중인 상품만 중지할 수 있습니다.");
    next = "STOPPED";
  } else if (action === "RESUME") {
    if (!["STOPPED", "DRAFT"].includes(existing.status))
      throw conflict("판매중지 또는 작성중 상품만 재개할 수 있습니다.");
    if (!existing.notLostOrStolen)
      throw new AppError("분실·도난 확인이 필요합니다. 상품을 수정해주세요.");
    if (existing.images.length < 1)
      throw new AppError(
        "사진이 최소 1장 있어야 판매를 시작할 수 있습니다. 상품을 수정해주세요.",
      );
    next = "ON_SALE";
  } else {
    if (existing.status === "RESERVED")
      throw conflict("주문이 진행 중인 상품은 삭제할 수 없습니다.");
    next = "DELETED";
  }

  const [p] = await db
    .update(phoneProducts)
    .set({ status: next, updatedAt: new Date() })
    .where(eq(phoneProducts.id, productId))
    .returning();

  await logAudit({
    userId: user.id,
    actorRole: "SELLER",
    action: `PRODUCT_${action}`,
    entityType: "phone_product",
    entityId: productId,
    oldValue: { status: existing.status },
    newValue: { status: p.status },
  });
  return p;
}

export async function listSellerProducts(status?: ProductStatus) {
  const { seller } = await requireApprovedSeller();
  return db.query.phoneProducts.findMany({
    where: and(
      eq(phoneProducts.sellerId, seller.id),
      status
        ? eq(phoneProducts.status, status)
        : ne(phoneProducts.status, "DELETED"),
    ),
    orderBy: [desc(phoneProducts.createdAt)],
    with: {
      images: { orderBy: [asc(phoneProductImages.sortOrder)], limit: 1 },
    },
  });
}

export async function sellerProductStats() {
  const { seller } = await requireApprovedSeller();
  const rows = await db
    .select({ status: phoneProducts.status, count: sql<number>`count(*)::int` })
    .from(phoneProducts)
    .where(eq(phoneProducts.sellerId, seller.id))
    .groupBy(phoneProducts.status);
  const byStatus = Object.fromEntries(
    rows.map((r) => [r.status, r.count]),
  ) as Partial<Record<ProductStatus, number>>;
  return byStatus;
}

// ───────────────────────────── 관리자 ─────────────────────────────

export async function adminListProducts(status?: ProductStatus) {
  await requireAdmin();
  return db.query.phoneProducts.findMany({
    where: status ? eq(phoneProducts.status, status) : undefined,
    orderBy: [desc(phoneProducts.createdAt)],
    limit: 200,
    with: {
      images: { orderBy: [asc(phoneProductImages.sortOrder)], limit: 1 },
      seller: { columns: { id: true, businessName: true } },
    },
  });
}

export async function adminGetProduct(productId: string) {
  await requireAdmin();
  const product = await db.query.phoneProducts.findFirst({
    where: eq(phoneProducts.id, productId),
    with: {
      images: { orderBy: [asc(phoneProductImages.sortOrder)] },
      inspection: true,
      seller: true,
    },
  });
  if (!product) throw notFound("상품을 찾을 수 없습니다.");
  const orders = await db.query.phoneOrders.findMany({
    where: eq(phoneOrders.productId, productId),
    orderBy: [desc(phoneOrders.createdAt)],
  });
  return { product, orders };
}

/** 관리자 강제 판매중지 */
export async function adminForceStopProduct(
  productId: string,
  reason?: string,
) {
  const admin = await requireAdmin();
  const existing = await db.query.phoneProducts.findFirst({
    where: eq(phoneProducts.id, productId),
  });
  if (!existing) throw notFound("상품을 찾을 수 없습니다.");
  if (existing.status === "RESERVED") {
    throw conflict("주문이 진행 중인 상품입니다. 주문을 먼저 처리하세요.");
  }
  const [p] = await db
    .update(phoneProducts)
    .set({ status: "STOPPED", updatedAt: new Date() })
    .where(eq(phoneProducts.id, productId))
    .returning();
  await logAudit({
    userId: admin.id,
    actorRole: "ADMIN",
    action: "PRODUCT_FORCE_STOPPED",
    entityType: "phone_product",
    entityId: productId,
    oldValue: { status: existing.status },
    newValue: { status: p.status, reason: reason ?? null },
  });
  return p;
}

export type SellerProductRow = Awaited<
  ReturnType<typeof listSellerProducts>
>[number];
export type PublicProductRow = Awaited<
  ReturnType<typeof listPublicProducts>
>["items"][number];
export type PublicProductDetail = NonNullable<
  Awaited<ReturnType<typeof getPublicProduct>>
>;
export type SellerProductDetail = Awaited<ReturnType<typeof getSellerProduct>>;
export type { SelectPhoneProduct };
