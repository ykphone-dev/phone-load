import "server-only";
import { cookies } from "next/headers";
import {
  ORDER_ACCESS_COOKIE_MAX_AGE,
  ORDER_ACCESS_COOKIE_PREFIX,
} from "../constants";

function cookieName(orderNumber: string) {
  return `${ORDER_ACCESS_COOKIE_PREFIX}${orderNumber.replace(/[^A-Z0-9]/g, "_")}`;
}

/** 주문 생성/조회 성공 시 브라우저에 접근 토큰 쿠키를 심는다 */
export function setOrderAccessCookie(orderNumber: string, token: string) {
  cookies().set({
    name: cookieName(orderNumber),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ORDER_ACCESS_COOKIE_MAX_AGE,
  });
}

export function getOrderAccessCookie(orderNumber: string) {
  try {
    return cookies().get(cookieName(orderNumber))?.value ?? null;
  } catch {
    return null;
  }
}
