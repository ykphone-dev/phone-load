"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BRANDS, BRAND_LABEL, CONDITION_GRADES, STORAGES } from "../../constants";

type Props = { models: { brand: string; model: string }[] };

const selectClass = "h-9 border bg-white px-2 text-sm";

/** 상품목록 필터: 제조사 / 모델 / 가격 / 용량 / 등급 + 정렬 (URL 쿼리 기반) */
export function ProductFilters({ models }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [brand, setBrand] = useState(sp.get("brand") ?? "");
  const [model, setModel] = useState(sp.get("model") ?? "");
  const [storage, setStorage] = useState(sp.get("storage") ?? "");
  const [grade, setGrade] = useState(sp.get("grade") ?? "");
  const [minPrice, setMinPrice] = useState(sp.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(sp.get("maxPrice") ?? "");
  const sort = sp.get("sort") ?? "latest";

  const apply = (overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    const values: Record<string, string> = { brand, model, storage, grade, minPrice, maxPrice, sort, ...overrides };
    Object.entries(values).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const reset = () => {
    setBrand(""); setModel(""); setStorage(""); setGrade(""); setMinPrice(""); setMaxPrice("");
    router.push(pathname);
  };

  const modelOptions = models.filter((m) => !brand || m.brand === brand);

  return (
    <div className="space-y-3 border p-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
        <select className={selectClass} value={brand} onChange={(e) => { setBrand(e.target.value); setModel(""); }} aria-label="제조사">
          <option value="">제조사 전체</option>
          {BRANDS.map((b) => (
            <option key={b} value={b}>{BRAND_LABEL[b]}</option>
          ))}
        </select>
        <select className={selectClass} value={model} onChange={(e) => setModel(e.target.value)} aria-label="모델">
          <option value="">모델 전체</option>
          {modelOptions.map((m) => (
            <option key={`${m.brand}-${m.model}`} value={m.model}>{m.model}</option>
          ))}
        </select>
        <select className={selectClass} value={storage} onChange={(e) => setStorage(e.target.value)} aria-label="용량">
          <option value="">용량 전체</option>
          {STORAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className={selectClass} value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="등급">
          <option value="">등급 전체</option>
          {CONDITION_GRADES.map((g) => (
            <option key={g} value={g}>{g}등급</option>
          ))}
        </select>
        <Input type="number" inputMode="numeric" placeholder="최소 가격" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="h-9" />
        <Input type="number" inputMode="numeric" placeholder="최대 가격" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-9" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => apply()}>필터 적용</Button>
          <Button size="sm" variant="ghost" onClick={reset}>초기화</Button>
        </div>
        <select className={selectClass} value={sort} onChange={(e) => apply({ sort: e.target.value })} aria-label="정렬">
          <option value="latest">최신순</option>
          <option value="price_asc">낮은가격순</option>
          <option value="price_desc">높은가격순</option>
        </select>
      </div>
    </div>
  );
}
