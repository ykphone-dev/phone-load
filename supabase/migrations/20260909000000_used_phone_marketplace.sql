-- 옆커폰 중고폰 거래 플랫폼 MVP 스키마
-- 생성: drizzle-kit (src/lib/supabase/schema-used-phones.ts) + 스토리지 버킷/RLS 수동 추가
-- 적용: Supabase SQL Editor 에 붙여넣기 또는 `supabase db push`
-- 기존 Hiyori 테이블은 건드리지 않는다. 새 테이블/enum 만 생성한다.

DO $$ BEGIN
 CREATE TYPE "availability_state" AS ENUM('POSSIBLE', 'IMPOSSIBLE', 'NEED_CHECK');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "back_condition" AS ENUM('CLEAN', 'SCRATCH', 'BROKEN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "battery_status" AS ENUM('GOOD', 'NORMAL', 'REPLACE_RECOMMENDED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "condition_grade" AS ENUM('S', 'A', 'B', 'C');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "dispute_status" AS ENUM('OPEN', 'SELLER_REPLIED', 'RESOLVED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "frame_condition" AS ENUM('CLEAN', 'MICRO_SCRATCH', 'DENT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "history_state" AS ENUM('NONE', 'YES', 'UNKNOWN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "inspection_result" AS ENUM('NORMAL', 'ABNORMAL', 'UNKNOWN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "phone_brand" AS ENUM('APPLE', 'SAMSUNG', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "phone_order_status" AS ENUM('CREATED', 'WAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'DEPOSIT_CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCEL_REQUESTED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED', 'DISPUTED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "phone_product_status" AS ENUM('DRAFT', 'ON_SALE', 'RESERVED', 'SOLD', 'STOPPED', 'DELETED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "product_image_kind" AS ENUM('FRONT', 'BACK', 'LEFT', 'RIGHT', 'SCREEN', 'CORNER', 'DENT', 'SCRATCH', 'ACCESSORY', 'ETC');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "refund_reason" AS ENUM('NOT_AS_DESCRIBED', 'DEFECTIVE', 'DAMAGED', 'WRONG_ITEM', 'MISSING_PARTS', 'CHANGE_OF_MIND', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "refund_status" AS ENUM('REQUESTED', 'SELLER_REFUNDED', 'CONFIRMED', 'REJECTED', 'WITHDRAWN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "screen_condition" AS ENUM('CLEAN', 'MICRO_SCRATCH', 'LIGHT_SCRATCH', 'DENT', 'BROKEN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "seller_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"actor_role" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"old_value" json,
	"new_value" json,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phone_bank_transfer_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"depositor_name" text,
	"buyer_reported_at" timestamp with time zone,
	"seller_confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phone_bank_transfer_reports_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phone_disputes" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"image_urls" json DEFAULT '[]'::json NOT NULL,
	"status" "dispute_status" DEFAULT 'OPEN' NOT NULL,
	"seller_reply" text,
	"seller_replied_at" timestamp with time zone,
	"admin_note" text,
	"resolution_status" "phone_order_status",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phone_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"product_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"buyer_id" uuid,
	"buyer_name" text NOT NULL,
	"buyer_phone" text NOT NULL,
	"buyer_password_hash" text,
	"access_token_hash" text NOT NULL,
	"shipping_postal_code" text,
	"shipping_address" text NOT NULL,
	"shipping_address_detail" text,
	"shipping_memo" text,
	"price" integer NOT NULL,
	"status" "phone_order_status" DEFAULT 'WAITING_DEPOSIT' NOT NULL,
	"status_before_request" "phone_order_status",
	"cancel_reason" text,
	"reserved_until" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phone_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phone_product_images" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"image_url" text NOT NULL,
	"kind" "product_image_kind" DEFAULT 'ETC' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phone_product_inspections" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"camera" "inspection_result" DEFAULT 'UNKNOWN' NOT NULL,
	"front_camera" "inspection_result" DEFAULT 'UNKNOWN' NOT NULL,
	"biometric" "inspection_result" DEFAULT 'UNKNOWN' NOT NULL,
	"speaker" "inspection_result" DEFAULT 'UNKNOWN' NOT NULL,
	"microphone" "inspection_result" DEFAULT 'UNKNOWN' NOT NULL,
	"charging" "inspection_result" DEFAULT 'UNKNOWN' NOT NULL,
	"wireless_charging" "inspection_result" DEFAULT 'UNKNOWN' NOT NULL,
	"wifi" "inspection_result" DEFAULT 'UNKNOWN' NOT NULL,
	"bluetooth" "inspection_result" DEFAULT 'UNKNOWN' NOT NULL,
	"gps" "inspection_result" DEFAULT 'UNKNOWN' NOT NULL,
	"vibration" "inspection_result" DEFAULT 'UNKNOWN' NOT NULL,
	"buttons" "inspection_result" DEFAULT 'UNKNOWN' NOT NULL,
	"display" "inspection_result" DEFAULT 'UNKNOWN' NOT NULL,
	CONSTRAINT "phone_product_inspections_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phone_products" (
	"id" text PRIMARY KEY NOT NULL,
	"seller_id" text NOT NULL,
	"brand" "phone_brand" NOT NULL,
	"model" text NOT NULL,
	"storage" text NOT NULL,
	"color" text NOT NULL,
	"price" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"condition_grade" "condition_grade" NOT NULL,
	"screen_condition" "screen_condition" NOT NULL,
	"frame_condition" "frame_condition" NOT NULL,
	"back_condition" "back_condition" NOT NULL,
	"battery_health" integer,
	"battery_status" "battery_status",
	"repair_history" "history_state" DEFAULT 'UNKNOWN' NOT NULL,
	"repair_note" text,
	"parts_replacement" "history_state" DEFAULT 'UNKNOWN' NOT NULL,
	"parts_note" text,
	"not_lost_or_stolen" boolean DEFAULT false NOT NULL,
	"normal_termination" "availability_state" DEFAULT 'NEED_CHECK' NOT NULL,
	"contract_discount" "availability_state" DEFAULT 'NEED_CHECK' NOT NULL,
	"imei" text,
	"description" text,
	"status" "phone_product_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phone_refund_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"reason" "refund_reason" NOT NULL,
	"description" text,
	"image_urls" json DEFAULT '[]'::json NOT NULL,
	"refund_bank_name" text NOT NULL,
	"refund_account" text NOT NULL,
	"refund_holder" text NOT NULL,
	"status" "refund_status" DEFAULT 'REQUESTED' NOT NULL,
	"seller_note" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"refunded_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phone_shipments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"carrier" text NOT NULL,
	"tracking_number" text NOT NULL,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	CONSTRAINT "phone_shipments_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sellers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" text NOT NULL,
	"representative_name" text NOT NULL,
	"business_number" text NOT NULL,
	"mail_order_number" text NOT NULL,
	"address" text NOT NULL,
	"address_detail" text,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"bank_name" text NOT NULL,
	"bank_account" text NOT NULL,
	"bank_holder" text NOT NULL,
	"business_license_url" text,
	"mail_order_license_url" text,
	"status" "seller_status" DEFAULT 'PENDING' NOT NULL,
	"reject_reason" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sellers_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "sellers_business_number_unique" UNIQUE("business_number")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_disputes_order_idx" ON "phone_disputes" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_disputes_status_idx" ON "phone_disputes" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_orders_seller_idx" ON "phone_orders" ("seller_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_orders_buyer_idx" ON "phone_orders" ("buyer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_orders_status_idx" ON "phone_orders" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_orders_product_idx" ON "phone_orders" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_product_images_product_idx" ON "phone_product_images" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_products_seller_idx" ON "phone_products" ("seller_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_products_status_idx" ON "phone_products" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_products_brand_model_idx" ON "phone_products" ("brand","model");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_refund_requests_order_idx" ON "phone_refund_requests" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sellers_status_idx" ON "sellers" ("status");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_bank_transfer_reports" ADD CONSTRAINT "phone_bank_transfer_reports_order_id_phone_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "phone_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_disputes" ADD CONSTRAINT "phone_disputes_order_id_phone_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "phone_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_orders" ADD CONSTRAINT "phone_orders_product_id_phone_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "phone_products"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_orders" ADD CONSTRAINT "phone_orders_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_product_images" ADD CONSTRAINT "phone_product_images_product_id_phone_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "phone_products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_product_inspections" ADD CONSTRAINT "phone_product_inspections_product_id_phone_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "phone_products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_products" ADD CONSTRAINT "phone_products_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_refund_requests" ADD CONSTRAINT "phone_refund_requests_order_id_phone_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "phone_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_shipments" ADD CONSTRAINT "phone_shipments_order_id_phone_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "phone_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ───────────────────────────── Storage 버킷 ─────────────────────────────
-- phone-images: 상품 사진 / 환불·분쟁 증빙 (공개 읽기)
-- seller-documents: 사업자등록증 / 통신판매업 신고증 (비공개, 서명 URL 로만 열람)
insert into storage.buckets (id, name, public)
values ('phone-images', 'phone-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('seller-documents', 'seller-documents', false)
on conflict (id) do nothing;

-- 업로드는 서버(service role)에서만 수행하므로 별도 storage 정책은 필요 없다.
-- 공개 버킷의 읽기는 Supabase 기본 public 정책으로 동작한다.

-- ───────────────────────────── RLS ─────────────────────────────
-- 앱은 Drizzle(직접 DB 연결)로만 이 테이블에 접근한다.
-- Supabase 클라이언트(anon 키)로는 절대 접근하지 못하도록 RLS 를 켜고 정책을 만들지 않는다.
alter table "sellers" enable row level security;
alter table "phone_products" enable row level security;
alter table "phone_product_images" enable row level security;
alter table "phone_product_inspections" enable row level security;
alter table "phone_orders" enable row level security;
alter table "phone_bank_transfer_reports" enable row level security;
alter table "phone_shipments" enable row level security;
alter table "phone_refund_requests" enable row level security;
alter table "phone_disputes" enable row level security;
alter table "audit_logs" enable row level security;
alter table "platform_settings" enable row level security;

-- 기본 설정값
insert into "platform_settings" ("key", "value")
values ('order.reservation_minutes', '30')
on conflict ("key") do nothing;
