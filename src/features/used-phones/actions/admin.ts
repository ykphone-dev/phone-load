"use server";

import { revalidatePath } from "next/cache";
import { SETTING_KEYS } from "../constants";
import type { TransitionKey } from "../order-state";
import type { OrderStatus } from "../constants";
import { toActionError, type ActionResult } from "../server/errors";
import { adminResolveDispute, adminTransition } from "../server/orders";
import { adminForceStopProduct } from "../server/products";
import {
  adminApproveSeller,
  adminReactivateSeller,
  adminRejectSeller,
  adminSuspendSeller,
} from "../server/sellers";
import { setSetting } from "../server/settings";
import { requireAdmin } from "../server/auth";
import { settingsSchema } from "../validations";
import { logAudit } from "../server/audit";

type Result = ActionResult<{ status: string }>;

function revalidateSellers(sellerId: string) {
  revalidatePath("/admin/sellers");
  revalidatePath(`/admin/sellers/${sellerId}`);
  revalidatePath("/seller");
  revalidatePath("/products");
}

export async function approveSellerAction(sellerId: string): Promise<Result> {
  try {
    const s = await adminApproveSeller(sellerId);
    revalidateSellers(sellerId);
    return { ok: true, data: { status: s.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function rejectSellerAction(
  sellerId: string,
  reason: string,
): Promise<Result> {
  try {
    const s = await adminRejectSeller(sellerId, reason);
    revalidateSellers(sellerId);
    return { ok: true, data: { status: s.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function suspendSellerAction(
  sellerId: string,
  reason?: string,
): Promise<Result> {
  try {
    const s = await adminSuspendSeller(sellerId, reason);
    revalidateSellers(sellerId);
    revalidatePath("/admin/phones");
    return { ok: true, data: { status: s.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function reactivateSellerAction(
  sellerId: string,
): Promise<Result> {
  try {
    const s = await adminReactivateSeller(sellerId);
    revalidateSellers(sellerId);
    return { ok: true, data: { status: s.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function forceStopProductAction(
  productId: string,
  reason?: string,
): Promise<Result> {
  try {
    const p = await adminForceStopProduct(productId, reason);
    revalidatePath("/admin/phones");
    revalidatePath(`/admin/phones/${productId}`);
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    revalidatePath("/seller/products");
    return { ok: true, data: { status: p.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function resolveDisputeAction(
  disputeId: string,
  input: { adminNote: string; resolutionStatus: string },
): Promise<Result> {
  try {
    const o = await adminResolveDispute(disputeId, input);
    revalidatePath("/admin/disputes");
    revalidatePath(`/admin/disputes/${disputeId}`);
    revalidatePath("/admin/phone-orders");
    revalidatePath(`/admin/phone-orders/${o.id}`);
    revalidatePath(`/order/${o.orderNumber}`);
    revalidatePath("/seller/orders");
    revalidatePath(`/seller/orders/${o.id}`);
    return { ok: true, data: { status: o.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function adminTransitionAction(
  orderId: string,
  key: TransitionKey,
  extra?: { adminChoice?: OrderStatus; note?: string },
): Promise<Result> {
  try {
    const o = await adminTransition(orderId, key, extra);
    revalidatePath("/admin/phone-orders");
    revalidatePath(`/admin/phone-orders/${orderId}`);
    revalidatePath(`/order/${o.orderNumber}`);
    revalidatePath("/seller/orders");
    revalidatePath(`/seller/orders/${orderId}`);
    revalidatePath("/products");
    return { ok: true, data: { status: o.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateSettingsAction(input: {
  reservationMinutes: number;
}): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = settingsSchema.parse(input);
    await setSetting(
      SETTING_KEYS.RESERVATION_MINUTES,
      String(parsed.reservationMinutes),
    );
    await logAudit({
      userId: admin.id,
      actorRole: "ADMIN",
      action: "SETTING_UPDATED",
      entityType: "setting",
      entityId: SETTING_KEYS.RESERVATION_MINUTES,
      newValue: { reservationMinutes: parsed.reservationMinutes },
    });
    revalidatePath("/admin/settings");
    return { ok: true, data: undefined };
  } catch (err) {
    return toActionError(err);
  }
}
