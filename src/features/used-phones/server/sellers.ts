import "server-only";
import db from "@/lib/supabase/db";
import { phoneProducts, sellers, type SelectSeller } from "@/lib/supabase/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { normalizeBusinessNumber, normalizePhone } from "../utils";
import {
  sellerRegisterSchema,
  sellerProfileUpdateSchema,
  type SellerRegisterInput,
  type SellerProfileUpdateInput,
} from "../validations";
import { logAudit } from "./audit";
import { getSellerByUserId, requireAdmin, requireUser } from "./auth";
import { AppError, conflict, notFound } from "./errors";
import { signPrivateDocument } from "./storage";

/** 소비자에게 보여줘도 되는 판매자 정보 */
export function publicSellerView(s: Pick<SelectSeller, "id" | "businessName">) {
  return { id: s.id, businessName: s.businessName };
}

/** 주문 후 소비자에게 공개하는 입금 계좌 */
export function sellerBankView(s: SelectSeller) {
  return {
    businessName: s.businessName,
    bankName: s.bankName,
    bankAccount: s.bankAccount,
    bankHolder: s.bankHolder,
    contactPhone: s.contactPhone,
  };
}

// ───────────────────────────── 판매자 본인 ─────────────────────────────

export async function getMySeller() {
  const user = await requireUser();
  return { user, seller: await getSellerByUserId(user.id) };
}

/** 입점 신청. 반려된 경우 재신청 = 기존 행 갱신 후 PENDING. */
export async function registerSeller(raw: SellerRegisterInput) {
  const user = await requireUser();
  const input = sellerRegisterSchema.parse(raw);
  const businessNumber = normalizeBusinessNumber(input.businessNumber);

  const existing = await getSellerByUserId(user.id);
  if (existing && existing.status !== "REJECTED") {
    throw conflict("이미 입점 신청이 되어 있습니다.");
  }

  const dup = await db.query.sellers.findFirst({
    where: eq(sellers.businessNumber, businessNumber),
  });
  if (dup && dup.userId !== user.id) {
    throw conflict("이미 등록된 사업자등록번호입니다.");
  }

  const values = {
    userId: user.id,
    businessName: input.businessName,
    representativeName: input.representativeName,
    businessNumber,
    mailOrderNumber: input.mailOrderNumber,
    address: input.address,
    addressDetail: input.addressDetail || null,
    contactName: input.contactName,
    contactPhone: normalizePhone(input.contactPhone),
    bankName: input.bankName,
    bankAccount: input.bankAccount,
    bankHolder: input.bankHolder,
    businessLicenseUrl: input.businessLicenseUrl || null,
    mailOrderLicenseUrl: input.mailOrderLicenseUrl || null,
    status: "PENDING" as const,
    rejectReason: null,
    updatedAt: new Date(),
  };

  const [row] = existing
    ? await db.update(sellers).set(values).where(eq(sellers.id, existing.id)).returning()
    : await db.insert(sellers).values(values).returning();

  await logAudit({
    userId: user.id,
    actorRole: "SELLER",
    action: existing ? "SELLER_REAPPLIED" : "SELLER_APPLIED",
    entityType: "seller",
    entityId: row.id,
    newValue: { businessName: row.businessName, businessNumber: row.businessNumber },
  });
  return row;
}

export async function updateMySellerProfile(raw: SellerProfileUpdateInput) {
  const user = await requireUser();
  const seller = await getSellerByUserId(user.id);
  if (!seller) throw notFound("판매자 정보가 없습니다.");
  const input = sellerProfileUpdateSchema.parse(raw);

  const [row] = await db
    .update(sellers)
    .set({
      contactName: input.contactName,
      contactPhone: normalizePhone(input.contactPhone),
      bankName: input.bankName,
      bankAccount: input.bankAccount,
      bankHolder: input.bankHolder,
      address: input.address,
      addressDetail: input.addressDetail || null,
      updatedAt: new Date(),
    })
    .where(eq(sellers.id, seller.id))
    .returning();

  await logAudit({
    userId: user.id,
    actorRole: "SELLER",
    action: "SELLER_PROFILE_UPDATED",
    entityType: "seller",
    entityId: seller.id,
    oldValue: {
      bankName: seller.bankName,
      bankAccount: seller.bankAccount,
      bankHolder: seller.bankHolder,
      contactPhone: seller.contactPhone,
    },
    newValue: {
      bankName: row.bankName,
      bankAccount: row.bankAccount,
      bankHolder: row.bankHolder,
      contactPhone: row.contactPhone,
    },
  });
  return row;
}

// ───────────────────────────── 관리자 ─────────────────────────────

export async function adminListSellers(status?: SelectSeller["status"]) {
  await requireAdmin();
  const rows = await db.query.sellers.findMany({
    where: status ? eq(sellers.status, status) : undefined,
    orderBy: [desc(sellers.createdAt)],
  });
  if (rows.length === 0) return [] as (SelectSeller & { productCount: number })[];

  const counts = await db
    .select({ sellerId: phoneProducts.sellerId, count: sql<number>`count(*)::int` })
    .from(phoneProducts)
    .where(inArray(phoneProducts.sellerId, rows.map((r) => r.id)))
    .groupBy(phoneProducts.sellerId);
  const countMap = new Map(counts.map((c) => [c.sellerId, c.count]));
  return rows.map((r) => ({ ...r, productCount: countMap.get(r.id) ?? 0 }));
}

export async function adminGetSeller(sellerId: string) {
  await requireAdmin();
  const seller = await db.query.sellers.findFirst({ where: eq(sellers.id, sellerId) });
  if (!seller) throw notFound("판매자를 찾을 수 없습니다.");
  const [businessLicenseSignedUrl, mailOrderLicenseSignedUrl] = await Promise.all([
    signPrivateDocument(seller.businessLicenseUrl),
    signPrivateDocument(seller.mailOrderLicenseUrl),
  ]);
  const products = await db.query.phoneProducts.findMany({
    where: eq(phoneProducts.sellerId, sellerId),
    orderBy: [desc(phoneProducts.createdAt)],
    limit: 50,
  });
  return { seller, businessLicenseSignedUrl, mailOrderLicenseSignedUrl, products };
}

async function adminSetSellerStatus(
  sellerId: string,
  status: SelectSeller["status"],
  action: string,
  extra: Partial<SelectSeller> = {},
) {
  const admin = await requireAdmin();
  const seller = await db.query.sellers.findFirst({ where: eq(sellers.id, sellerId) });
  if (!seller) throw notFound("판매자를 찾을 수 없습니다.");

  const [row] = await db
    .update(sellers)
    .set({ status, updatedAt: new Date(), ...extra })
    .where(eq(sellers.id, sellerId))
    .returning();

  await logAudit({
    userId: admin.id,
    actorRole: "ADMIN",
    action,
    entityType: "seller",
    entityId: sellerId,
    oldValue: { status: seller.status },
    newValue: { status, ...extra },
  });
  return row;
}

export async function adminApproveSeller(sellerId: string) {
  return adminSetSellerStatus(sellerId, "APPROVED", "SELLER_APPROVED", {
    approvedAt: new Date(),
    rejectReason: null,
  });
}

export async function adminRejectSeller(sellerId: string, reason: string) {
  if (!reason?.trim()) throw new AppError("반려 사유를 입력하세요.");
  return adminSetSellerStatus(sellerId, "REJECTED", "SELLER_REJECTED", {
    rejectReason: reason.trim(),
  });
}

/** 정지 시 판매중 상품을 모두 판매중지 처리 */
export async function adminSuspendSeller(sellerId: string, reason?: string) {
  const row = await adminSetSellerStatus(sellerId, "SUSPENDED", "SELLER_SUSPENDED", {
    rejectReason: reason?.trim() || null,
  });
  await db
    .update(phoneProducts)
    .set({ status: "STOPPED", updatedAt: new Date() })
    .where(
      and(eq(phoneProducts.sellerId, sellerId), eq(phoneProducts.status, "ON_SALE")),
    );
  return row;
}

export async function adminReactivateSeller(sellerId: string) {
  return adminSetSellerStatus(sellerId, "APPROVED", "SELLER_REACTIVATED", {
    rejectReason: null,
  });
}
