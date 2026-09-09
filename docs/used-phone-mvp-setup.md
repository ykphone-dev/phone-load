# 옆커폰 중고폰 플랫폼 MVP — 구현 가이드

기획서: [used-phone-mvp-spec.md](./used-phone-mvp-spec.md). 이 문서는 **무엇이 어디에 구현되어 있고, 어떻게 띄우는지**를 다룬다.

## 1. 한눈에 보기

| 구분 | 경로 |
|---|---|
| DB 스키마 | `src/lib/supabase/schema-used-phones.ts` (기존 `schema.ts`에서 재수출) |
| 마이그레이션 SQL | `supabase/migrations/20260909000000_used_phone_marketplace.sql` |
| 도메인 상수/라벨 | `src/features/used-phones/constants.ts` |
| 주문 상태 머신 | `src/features/used-phones/order-state.ts` |
| 검증(zod) | `src/features/used-phones/validations.ts` |
| 서비스(서버 전용) | `src/features/used-phones/server/*.ts` |
| 서버 액션 | `src/features/used-phones/actions/*.ts` |
| REST API | `src/app/api/{products,orders,seller,admin,uploads,cron}/**` |
| 소비자 화면 | `src/app/(marketplace)/**` |
| 판매자 화면 | `src/app/(seller)/seller/**` |
| 관리자 화면 | `src/app/(admin)/admin/{marketplace,sellers,phones,phone-orders,disputes,settings}/**` |
| 단위 테스트 | `src/features/used-phones/__tests__/*.test.ts` (`npm test`) |

기존 Hiyori 쇼핑몰 코드(`(store)`, `products`/`orders` 테이블, Stripe 등)는 건드리지 않았다. 새 테이블은 모두 `phone_` 접두어 또는 `sellers`/`audit_logs`/`platform_settings`.

## 2. 처음 띄우기

1. **환경변수** — `.env.example` 참고. 이 기능이 실제로 쓰는 값:
   - `DATABASE_URL` (Drizzle 직접 연결, Supabase → Settings → Database → Connection string, *Transaction pooler* 권장)
   - `NEXT_PUBLIC_SUPABASE_PROJECT_REF`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Auth)
   - `DATABASE_SERVICE_ROLE` = Supabase **service_role** 키 (Storage 업로드/서명 URL, 서버에서만 사용)
   - `CRON_SECRET` (선택) — `/api/cron/expire-orders` 보호
   - 나머지(S3, Stripe)는 기존 Hiyori 기능용. `env.mjs`가 빌드 시 검증하므로 값이 없으면 `SKIP_ENV_VALIDATION=1`로 빌드하거나 더미 값을 넣는다.
2. **DB 적용** — 둘 중 하나:
   - Supabase SQL Editor에 `supabase/migrations/20260909000000_used_phone_marketplace.sql` 전체를 붙여넣어 실행 (테이블 + enum + Storage 버킷 2개 + RLS + 기본 설정값)
   - 또는 `npm run db:push` (Drizzle가 스키마를 그대로 밀어넣음). 이 경우 버킷 2개(`phone-images` 공개, `seller-documents` 비공개)는 Supabase 대시보드에서 직접 만들고, 마이그레이션 파일 하단의 RLS/기본값 구문을 실행한다.
3. **관리자 계정** — 관리자 판정은 기존 방식 그대로 Supabase Auth 사용자의 `app_metadata.isAdmin === true`.
   - Supabase 대시보드 → Authentication → Users → 해당 사용자 → *Raw App Meta Data*에 `{"isAdmin": true}` 추가, 또는 기존 `POST /api/users/promote-user` 사용.
4. `npm install` → `npm run dev` → `http://localhost:3000/products`

## 3. 첫 사이클 시나리오 (기획서 58 완료 기준)

| 단계 | 누가 | 어디서 |
|---|---|---|
| 회원가입 후 판매자 입점 신청 | 판매자 | `/seller/register` (서류 업로드 포함) |
| 입점 승인 | 관리자 | `/admin/sellers` → 상세 → 승인 |
| 아이폰 1대 등록 | 판매자 | `/seller/products/new` (한 화면, 사진 업로드) |
| 상품 조회 → 주문 | 소비자(비회원 가능) | `/products` → `/products/[id]` → `/products/[id]/order` |
| 판매자 계좌 표시 | 소비자 | `/order/[주문번호]/payment` (계좌번호 복사, 입금기한 카운트다운) |
| 송금 후 "입금했습니다" | 소비자 | 같은 화면, 입금자명 입력 |
| 실제 입금 확인 | 판매자 | `/seller/orders/[id]` → 입금 확인 (상품 SOLD) |
| 송장 등록 | 판매자 | 같은 화면 → 택배사/송장번호 |
| 배송 확인 → 구매확정 | 소비자 | `/order/[주문번호]` |
| 거래완료 확인 | 관리자 | `/admin/phone-orders`, `/admin/marketplace` 대시보드 |

비회원은 주문 시 만든 **주문번호 + 휴대폰 + 비밀번호**로 `/order/lookup`에서 다시 조회한다. 주문 생성/조회 성공 시 httpOnly 쿠키(`yk_order_*`)에 접근 토큰이 저장되어 같은 브라우저에서는 바로 열린다. 회원은 `/my-orders`.

## 4. 주문 상태 전이

```
WAITING_DEPOSIT ─(구매자 입금했습니다)→ DEPOSIT_REPORTED ─(판매자 입금확인)→ DEPOSIT_CONFIRMED ─→ PREPARING ─(송장)→ SHIPPED ─→ DELIVERED ─(구매확정)→ COMPLETED
      │                                      │                         │
      ├─(구매자 즉시취소 / 30분 만료)→ CANCELLED     └─(판매자 입금미확인)→ WAITING_DEPOSIT      └─(구매자 취소요청)→ CANCEL_REQUESTED ─(판매자 환불 후 승인)→ CANCELLED
                                                                                                                            └─(거절)→ 이전 상태 복원
SHIPPED / DELIVERED / COMPLETED ─(환불요청)→ REFUND_REQUESTED ─(판매자 환불완료 → 구매자 환불금 확인)→ REFUNDED
                                                    └─(철회)→ 이전 상태   └─(문제 해결 안됨)→ DISPUTED ─(관리자 종료: COMPLETED|REFUNDED|CANCELLED)
```

- 규칙은 `order-state.ts`의 `TRANSITIONS` 한 곳에 있다. **구매자가 도달할 수 있는 상태에 `DEPOSIT_CONFIRMED`/`SHIPPED`는 없다** (테스트로 고정).
- 상태 변경은 `UPDATE ... WHERE id=? AND status=<현재상태>`로 동시 갱신을 막고, 모든 전이는 `audit_logs`에 기록된다 (actor, IP, old/new).
- 상품 상태 연동: 주문 생성 `ON_SALE→RESERVED`(조건부 UPDATE 1회로 동시구매 차단), 입금확인 `→SOLD`, 입금 전 취소/만료 `→ON_SALE`, 입금 후 취소 승인 `→ON_SALE`, 환불 완료 `→STOPPED`(판매자 재검수 후 재등록).
- 미입금 자동취소: 목록/상세/판매자·관리자 주문목록 로드 시 `expireStaleReservations()`가 지연 실행되고, `vercel.json`의 cron이 10분마다 `/api/cron/expire-orders`를 호출한다. 기한(분)은 `/admin/settings`에서 변경 (`platform_settings.order.reservation_minutes`, 기본 30).

## 5. 권한

| 역할 | 판정 | 보호 |
|---|---|---|
| 관리자 | `user.app_metadata.isAdmin` | `(admin)/layout.tsx` + 모든 admin 서비스의 `requireAdmin()` |
| 판매자 | `sellers` 테이블에 행이 있고 `status = APPROVED` | `requireApprovedSeller()`; 화면은 `guardSellerPage()`가 `/seller/register`·`/seller/pending`으로 보냄 |
| 구매자(회원) | `phone_orders.buyer_id === user.id` | `resolveBuyerAccess()` |
| 구매자(비회원) | 주문 접근 쿠키 토큰(sha256 저장) 또는 주문번호+휴대폰+비밀번호(scrypt) | 동일 |

- 판매자 계좌는 **주문 생성 이후 해당 주문의 구매자에게만** 반환된다 (`getBuyerOrderView`). 상품 목록/상세 응답에는 없다.
- IMEI는 소비자 응답에서 마스킹(`3569********809`), 판매자/관리자 화면만 원문.
- 새 테이블은 RLS를 켜고 정책을 만들지 않았다. 앱은 Drizzle(직접 DB 연결)로만 접근하므로 anon 키로는 읽을 수 없다.

## 6. REST API (기획서 37~38 매핑)

모든 응답은 `{ ok: true, data } | { ok: false, error, code }`. 인증은 세션 쿠키.

| 기획서 | 구현 |
|---|---|
| `GET /api/products`, `GET /api/products/:id` | 동일 (필터: brand, model, storage, grade, minPrice, maxPrice, sort, page) |
| `POST/PUT/DELETE /api/seller/products(/:id)` | 동일 + `PATCH {action: STOP\|RESUME}` |
| `POST /api/orders` | 동일. 응답에 주문 접근 쿠키 포함 |
| `GET /api/orders/:id` | `:id` = 주문번호 |
| `POST /api/orders/:id/deposit-report` | 동일 (`{depositorName}`) |
| `POST /api/orders/:id/cancel` | `{afterDeposit: true}`면 취소요청, 아니면 즉시취소 |
| `POST /api/orders/:id/refund` | 동일. `PATCH {action: CONFIRM\|WITHDRAW}` 추가 |
| 추가 | `POST /api/orders/lookup`, `/api/orders/:id/dispute`, `/api/orders/:id/complete` |
| `GET /api/seller/orders` | 동일 (`?status=A,B`) |
| `POST /api/seller/orders/:id/deposit-confirm` | 동일 (`{confirmed:false}`면 미확인 처리) |
| `POST /api/seller/orders/:id/shipping` | 동일. `PATCH` = 배송완료 |
| `POST /api/seller/orders/:id/refund-complete` | `{decision: REFUNDED\|REJECTED, note}` |
| 추가 | `/api/seller/orders/:id/cancel-approve`, `/cancel-reject` |
| `GET /api/admin/sellers`, `POST .../approve\|reject\|suspend` | 동일 (`suspend`에 `{reactivate:true}`로 해제) |
| `GET /api/admin/products\|orders\|disputes` | 동일 + `POST /api/admin/disputes/:id/resolve` |
| 업로드 | `POST /api/uploads` multipart `scope=product\|seller-doc\|evidence(&orderNumber)` |

## 7. 기획서와 다르게 한 점

- **경로**: 기존 Hiyori `/orders/[id]`와 충돌해서 소비자 주문 상세는 `/order/[주문번호]`, 목록은 `/my-orders`, 주문 입력은 `/products/[id]/order`. 판매자 대시보드는 `/seller` (기획서 `/dashboard`).
- **users.role 테이블을 만들지 않았다**. 관리자는 기존 `app_metadata.isAdmin`, 판매자는 `sellers` 행 존재 여부로 판정한다. 기존 인증 구조를 바꾸지 않기 위해서다.
- **판매수량**: 컬럼(`quantity`, 기본 1)만 두고 화면/로직은 1대 = 1상품이다. RESERVED/SOLD 흐름이 단일 재고를 전제로 한다.
- **사진**: 판매 등록에는 최소 1장을 강제하고 5장(전면·후면·좌측·우측·액정)은 화면에서 권장/누락 안내로 처리했다. 첫 사이클 테스트 부담을 줄이기 위한 선택이며, 필수로 올리려면 `validations.ts`의 `productFormSchema` `superRefine`에서 `REQUIRED_IMAGE_KINDS` 검사만 추가하면 된다.
- **환불 계좌**: 판매자가 소비자 계좌로 직접 환불하므로 환불 요청에 은행/계좌/예금주를 받는다 (기획서에는 없음).
- **판매자 "입금 미확인" 되돌리기**, **취소 거절**, **환불 거절**, **환불요청 철회** 전이를 추가했다. 없으면 상태가 막힌다.
- **저장소**: 사진·서류는 S3가 아니라 Supabase Storage. 서류는 비공개 버킷 + 관리자 화면에서 10분짜리 서명 URL.

## 8. 알려진 제한 / 다음 단계

- `src/app/middleware.ts`는 Next.js가 인식하는 위치(`src/middleware.ts`)가 아니라서 실행되지 않는다 (기존 코드). 서버 컴포넌트에서 세션 갱신이 안 될 수 있으니 옮기는 것을 권장한다. 이번 작업 범위 밖이라 손대지 않았다.
- 홈(`/`)은 아직 Hiyori 데모다. 중고폰 목록은 `/products`. 홈을 바꾸려면 `(store)/page.tsx`를 `/products`로 리다이렉트하면 된다.
- 알림(SMS/카카오)은 없다 (P1). 판매자는 `/seller`에서 "처리가 필요한 주문"을 확인한다.
- 관리자 목록은 최근 200~300건, 페이지네이션/검색 없음.
- 택배 추적 링크는 송장번호 표시까지만.
- 상품 대량등록(Excel)은 MVP 이후.
