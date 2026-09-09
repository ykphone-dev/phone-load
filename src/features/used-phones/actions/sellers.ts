"use server";

import { revalidatePath } from "next/cache";
import { toActionError, type ActionResult } from "../server/errors";
import { registerSeller, updateMySellerProfile } from "../server/sellers";
import type { SellerRegisterInput, SellerProfileUpdateInput } from "../validations";

export async function registerSellerAction(
  input: SellerRegisterInput,
): Promise<ActionResult<{ sellerId: string }>> {
  try {
    const seller = await registerSeller(input);
    revalidatePath("/seller");
    revalidatePath("/admin/sellers");
    return { ok: true, data: { sellerId: seller.id } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateSellerProfileAction(
  input: SellerProfileUpdateInput,
): Promise<ActionResult> {
  try {
    await updateMySellerProfile(input);
    revalidatePath("/seller/profile");
    return { ok: true, data: undefined };
  } catch (err) {
    return toActionError(err);
  }
}
