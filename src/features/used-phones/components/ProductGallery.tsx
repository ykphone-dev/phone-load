"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { IMAGE_KIND_LABEL, type ImageKind } from "../constants";

type Img = { id?: string; imageUrl: string; kind?: string | null };

export function ProductGallery({
  images,
  alt,
}: {
  images: Img[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-zinc-100 text-sm text-zinc-400">
        등록된 사진이 없습니다
      </div>
    );
  }
  const current = images[Math.min(index, images.length - 1)];
  return (
    <div className="space-y-2">
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        <Image
          src={current.imageUrl}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain"
          priority
        />
        {current.kind && (
          <span className="absolute left-2 top-2 rounded-sm bg-black/60 px-2 py-0.5 text-xs text-white">
            {IMAGE_KIND_LABEL[current.kind as ImageKind] ?? current.kind}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id ?? img.imageUrl}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden border-2 bg-zinc-100",
                i === index ? "border-black" : "border-transparent",
              )}
              aria-label={`사진 ${i + 1}`}
            >
              <Image
                src={img.imageUrl}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
