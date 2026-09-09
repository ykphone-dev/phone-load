"use server";

import { revalidatePath } from "next/cache";
import { toActionError, type ActionResult } from "../server/errors";
import {
  sellerApproveCancel,
  sellerCancelBeforeDeposit,
  sellerConfirmDeposit,
  sellerDecideRefund,
  sellerMarkDelivered,
  sellerRejectCancel,
  sellerReplyDispute,
  sellerShip,
  sellerStartPreparing,
  sellerUnconfirmDeposit,
} from "../server/orders";
import type { ShipmentInput } from "../validations";

function revalidate(orderId: string, orderNumber?: string, productId?: string) {
  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath("/seller");
  revalidatePath("/seller/products");
  revalidatePath("/admin/phone-orders");
  revalidatePath("/admin/disputes");
  if (orderNumber) revalidatePath(`/order/${orderNumber}`);
  if (productId) revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
}

type Result = ActionResult<{ status: string }>;

async function run(
  orderId: string,
  fn: () => Promise<{ status: string; orderNumber?: string; productId?: string }>,
): Promise<Result> {
  try {
    const o = await fn();
    revalidate(orderId, o.orderNumber, o.productId);
    return { ok: true, data: { status: o.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function sellerConfirmDepositAction(orderId: string): Promise<Result> {
  return run(orderId, () => sellerConfirmDeposit(orderId));
}
export async function sellerUnconfirmDepositAction(orderId: string): Promise<Result> {
  return run(orderId, () => sellerUnconfirmDeposit(orderId));
}
export async function sellerStartPreparingAction(orderId: string): Promise<Result> {
  return run(orderId, () => sellerStartPreparing(orderId));
}
export async function sellerShipAction(orderId: string, input: ShipmentInput): Promise<Result> {
  return run(orderId, () => sellerShip(orderId, input));
}
export async function sellerMarkDeliveredAction(orderId: string): Promise<Result> {
  return run(orderId, () => sellerMarkDelivered(orderId));
}
export async function sellerCancelAction(orderId: string, reason?: string): Promise<Result> {
  return run(orderId, () => sellerCancelBeforeDeposit(orderId, reason));
}
export async function sellerApproveCancelAction(orderId: string): Promise<Result> {
  return run(orderId, () => sellerApproveCancel(orderId));
}
export async function sellerRejectCancelAction(orderId: string, note?: string): Promise<Result> {
  return run(orderId, () => sellerRejectCancel(orderId, note));
}
export async function sellerDecideRefundAction(
  orderId: string,
  input: { decision: "REFUNDED" | "REJECTED"; note?: string },
): Promise<Result> {
  return run(orderId, async () => {
    const rr = await sellerDecideRefund(orderId, input);
    return { status: rr.status };
  });
}
export async function sellerReplyDisputeAction(
  orderId: string,
  input: { reply: string },
): Promise<Result> {
  return run(orderId, async () => {
    const d = await sellerReplyDispute(orderId, input);
    return { status: d.status };
  });
}
