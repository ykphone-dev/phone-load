"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { useRef, useState } from "react";

type Props = {
  /** /api/uploads scope */
  scope: "product" | "evidence" | "seller-doc";
  /** evidence 일 때 필수 */
  orderNumber?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  accept?: string;
  label?: string;
  /** seller-doc 은 미리보기 불가(비공개 경로) */
  preview?: boolean;
};

/**
 * 파일 선택 → /api/uploads 로 업로드 → URL 배열 반환.
 * 상품사진(공개), 환불/분쟁 증빙(공개), 판매자 서류(비공개) 공용.
 */
export function ImageUploader({
  scope,
  orderNumber,
  value,
  onChange,
  max = 15,
  accept = "image/*",
  label = "사진 추가",
  preview = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (value.length + files.length > max) {
      toast({ title: `최대 ${max}개까지 업로드할 수 있습니다`, variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.set("scope", scope);
      if (orderNumber) form.set("orderNumber", orderNumber);
      Array.from(files).forEach((f) => form.append("files", f));
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "업로드 실패");
      onChange([...value, ...(json.data.urls as string[])]);
    } catch (err) {
      toast({ title: "업로드 실패", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={url + i} className="relative h-20 w-20 overflow-hidden border bg-zinc-50">
            {preview ? (
              <Image src={url} alt="" fill sizes="80px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center p-1 text-center text-[10px] text-zinc-500">
                파일 {i + 1}
              </div>
            )}
            <button
              type="button"
              aria-label="삭제"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute right-0 top-0 bg-black/70 px-1.5 text-xs text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(e) => upload(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading || value.length >= max}
        onClick={() => inputRef.current?.click()}
      >
        {uploading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
        {label} ({value.length}/{max})
      </Button>
    </div>
  );
}
