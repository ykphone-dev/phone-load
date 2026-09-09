import "server-only";
import { env } from "@/env.mjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { AppError } from "./errors";

/** 공개 버킷: 상품 사진, 환불/분쟁 증빙 사진 */
export const PUBLIC_BUCKET = "phone-images";
/** 비공개 버킷: 사업자등록증, 통신판매업 신고증 */
export const PRIVATE_BUCKET = "seller-documents";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const DOC_TYPES = [...IMAGE_TYPES, "application/pdf"];
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_DOC_BYTES = 20 * 1024 * 1024;

export function publicUrl(path: string) {
  return `https://${env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/${PUBLIC_BUCKET}/${path}`;
}

/**
 * 이미지 업로드: webp 변환 + 최대 1600px 리사이즈 후 공개 버킷에 저장.
 * @returns 공개 URL
 */
export async function uploadPublicImage(file: File, folder: string) {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new AppError(`지원하지 않는 이미지 형식입니다: ${file.type}`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new AppError("이미지 용량은 15MB 이하여야 합니다.");
  }
  const input = Buffer.from(await file.arrayBuffer());
  const output = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const path = `${folder}/${nanoid()}.webp`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .upload(path, output, { contentType: "image/webp", upsert: false });
  if (error) throw new AppError(`이미지 업로드 실패: ${error.message}`, 500);
  return publicUrl(path);
}

/**
 * 서류 업로드 (비공개). @returns 버킷 내 경로. 조회는 서명 URL 로만.
 */
export async function uploadPrivateDocument(file: File, folder: string) {
  if (!DOC_TYPES.includes(file.type)) {
    throw new AppError("PDF 또는 이미지 파일만 업로드할 수 있습니다.");
  }
  if (file.size > MAX_DOC_BYTES) {
    throw new AppError("파일 용량은 20MB 이하여야 합니다.");
  }
  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1] || "bin";
  const path = `${folder}/${nanoid()}.${ext}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });
  if (error) throw new AppError(`서류 업로드 실패: ${error.message}`, 500);
  return path;
}

/** 관리자 열람용 서명 URL (10분) */
export async function signPrivateDocument(path: string | null | undefined) {
  if (!path) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}
