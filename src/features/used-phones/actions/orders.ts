"use server";

import { revalidatePath } from "next/cache";
import { toActionError, type ActionResult } from "../server/errors";
import { setOrderAccessCookie } from "../server/guest-access";
import {
  buyerMarkDelivered,
  cancelBeforeDeposit,
  completeOrder,
  confirmRefund,
  createOrder,
  lookupGuestOrder,
  openDispute,
  reportDeposit,
  requestCancel,
  requestRefund,
  withdrawRefund,
} from "../server/orders";
import type {
  CreateOrderInput,
  DisputeOpenInput,
  OrderLookupInput,
  RefundRequestInput,
} from "../validations";

function revalidateOrder(orderNumber: string, productId?: string) {
  revalidatePath(`/order/${orderNumber}`);
  revalidatePath(`/order/${orderNumber}/payment`);
  revalidatePath("/orders");
  revalidatePath("/products");
  if (productId) revalidatePath(`/products/${productId}`);
  revalidatePath("/seller/orders");
  revalidatePath("/admin/phone-orders");
}

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<ActionResult<{ orderNumber: string; reservationMinutes: number }>> {
  try {
    const { order, token, reservationMinutes } = await createOrder(input);
    setOrderAccessCookie(order.orderNumber, token);
    revalidateOrder(order.orderNumber, order.productId);
    return {
      ok: true,
      data: { orderNumber: order.orderNumber, reservationMinutes },
    };
  } catch (err) {
    return toActionError(err);
  }
}

export async function lookupOrderAction(
  input: OrderLookupInput,
): Promise<ActionResult<{ orderNumber: string }>> {
  try {
    const { orderNumber, token } = await lookupGuestOrder(input);
    setOrderAccessCookie(orderNumber, token);
    return { ok: true, data: { orderNumber } };
  } catch (err) {
    return toActionError(err);
  }
}

type SimpleAction = (
  orderNumber: string,
) => Promise<ActionResult<{ status: string }>>;

function wrap(
  fn: (orderNumber: string) => Promise<{ status: string; productId: string }>,
): SimpleAction {
  return async (orderNumber) => {
    try {
      const o = await fn(orderNumber);
      revalidateOrder(orderNumber, o.productId);
      return { ok: true, data: { status: o.status } };
    } catch (err) {
      return toActionError(err);
    }
  };
}

export async function reportDepositAction(
  orderNumber: string,
  input: { depositorName: string },
): Promise<ActionResult<{ status: string }>> {
  try {
    const o = await reportDeposit(orderNumber, input);
    revalidateOrder(orderNumber, o.productId);
    return { ok: true, data: { status: o.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function cancelBeforeDepositAction(
  orderNumber: string,
  input: { reason?: string } = {},
): Promise<ActionResult<{ status: string }>> {
  try {
    const o = await cancelBeforeDeposit(orderNumber, input);
    revalidateOrder(orderNumber, o.productId);
    return { ok: true, data: { status: o.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function requestCancelAction(
  orderNumber: string,
  input: { reason?: string } = {},
): Promise<ActionResult<{ status: string }>> {
  try {
    const o = await requestCancel(orderNumber, input);
    revalidateOrder(orderNumber, o.productId);
    return { ok: true, data: { status: o.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function requestRefundAction(
  orderNumber: string,
  input: RefundRequestInput,
): Promise<ActionResult<{ status: string }>> {
  try {
    const o = await requestRefund(orderNumber, input);
    revalidateOrder(orderNumber, o.productId);
    return { ok: true, data: { status: o.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function openDisputeAction(
  orderNumber: string,
  input: DisputeOpenInput,
): Promise<ActionResult<{ status: string }>> {
  try {
    const o = await openDispute(orderNumber, input);
    revalidateOrder(orderNumber, o.productId);
    revalidatePath("/admin/disputes");
    return { ok: true, data: { status: o.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export const withdrawRefundAction = wrap(withdrawRefund);
export const confirmRefundAction = wrap(confirmRefund);
export const buyerMarkDeliveredAction = wrap(buyerMarkDelivered);
export const completeOrderAction = wrap(completeOrder);
