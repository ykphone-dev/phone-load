"use server";

import { revalidatePath } from "next/cache";
import { toActionError, type ActionResult } from "../server/errors";
import {
  createProduct,
  setSellerProductStatus,
  updateProduct,
} from "../server/products";
import type { ProductFormInput } from "../validations";

function revalidateProductPaths(productId?: string) {
  revalidatePath("/products");
  revalidatePath("/seller/products");
  revalidatePath("/seller");
  revalidatePath("/admin/phones");
  if (productId) {
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/seller/products/${productId}/edit`);
  }
}

export async function createProductAction(
  input: ProductFormInput,
): Promise<ActionResult<{ productId: string; status: string }>> {
  try {
    const p = await createProduct(input);
    revalidateProductPaths(p.id);
    return { ok: true, data: { productId: p.id, status: p.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateProductAction(
  productId: string,
  input: ProductFormInput,
): Promise<ActionResult<{ productId: string; status: string }>> {
  try {
    const p = await updateProduct(productId, input);
    revalidateProductPaths(p.id);
    return { ok: true, data: { productId: p.id, status: p.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function setProductStatusAction(
  productId: string,
  action: "STOP" | "RESUME" | "DELETE",
): Promise<ActionResult<{ status: string }>> {
  try {
    const p = await setSellerProductStatus(productId, action);
    revalidateProductPaths(productId);
    return { ok: true, data: { status: p.status } };
  } catch (err) {
    return toActionError(err);
  }
}
