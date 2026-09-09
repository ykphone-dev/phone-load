"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import {
  createProductAction,
  updateProductAction,
} from "../../actions/products";
import {
  AVAILABILITY_LABEL,
  AVAILABILITY_STATES,
  BACK_CONDITIONS,
  BACK_CONDITION_LABEL,
  BATTERY_STATUSES,
  BATTERY_STATUS_LABEL,
  BRANDS,
  BRAND_LABEL,
  CONDITION_GRADES,
  CONDITION_GRADE_LABEL,
  FRAME_CONDITIONS,
  FRAME_CONDITION_LABEL,
  HISTORY_STATES,
  HISTORY_STATE_LABEL,
  IMAGE_KINDS,
  IMAGE_KIND_LABEL,
  INSPECTION_ITEMS,
  INSPECTION_ITEM_LABEL,
  INSPECTION_RESULTS,
  INSPECTION_RESULT_LABEL,
  MAX_PRODUCT_IMAGES,
  REQUIRED_IMAGE_KINDS,
  SCREEN_CONDITIONS,
  SCREEN_CONDITION_LABEL,
  STORAGES,
  type ImageKind,
} from "../../constants";
import { formatKRW } from "../../utils";
import { productFormSchema, type ProductFormInput } from "../../validations";
import { ImageUploader } from "../ImageUploader";

export const EMPTY_INSPECTION: ProductFormInput["inspection"] =
  Object.fromEntries(
    INSPECTION_ITEMS.map((k) => [k, "UNKNOWN"]),
  ) as ProductFormInput["inspection"];

export const EMPTY_PRODUCT_FORM: ProductFormInput = {
  brand: "APPLE",
  model: "",
  storage: "",
  color: "",
  price: undefined as unknown as number,
  conditionGrade: "A",
  screenCondition: "CLEAN",
  frameCondition: "CLEAN",
  backCondition: "CLEAN",
  batteryHealth: null,
  batteryStatus: null,
  repairHistory: "UNKNOWN",
  repairNote: "",
  partsReplacement: "UNKNOWN",
  partsNote: "",
  notLostOrStolen: false,
  normalTermination: "NEED_CHECK",
  contractDiscount: "NEED_CHECK",
  imei: "",
  description: "",
  inspection: EMPTY_INSPECTION,
  images: [],
  publish: true,
};

type Props = {
  mode: "create" | "edit";
  productId?: string;
  defaultValues?: Partial<ProductFormInput>;
};

function Section({
  no,
  title,
  desc,
  children,
}: {
  no: number;
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="border p-4 sm:p-6">
      <div className="mb-4 flex items-baseline gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
          {no}
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
        {desc && <span className="text-xs text-zinc-500">{desc}</span>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function EnumSelect<T extends string>({
  value,
  onChange,
  options,
  labels,
  placeholder,
}: {
  value: T | null | undefined;
  onChange: (v: T) => void;
  options: readonly T[];
  labels: Record<T, string>;
  placeholder?: string;
}) {
  return (
    <Select value={value ?? undefined} onValueChange={(v) => onChange(v as T)}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder ?? "선택"} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {labels[o]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ProductForm({ mode, productId, defaultValues }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      ...EMPTY_PRODUCT_FORM,
      ...(defaultValues ?? {}),
      inspection: { ...EMPTY_INSPECTION, ...(defaultValues?.inspection ?? {}) },
    },
  });

  const brand = form.watch("brand");
  const repairHistory = form.watch("repairHistory");
  const partsReplacement = form.watch("partsReplacement");
  const price = form.watch("price");
  const images = form.watch("images") ?? [];
  const conditionGrade = form.watch("conditionGrade");

  const missingKinds = REQUIRED_IMAGE_KINDS.filter(
    (k) => !images.some((img) => img.kind === k),
  );

  const submit = (publish: boolean) => {
    form.setValue("publish", publish, { shouldDirty: true });
    void form.handleSubmit(onSubmit, () => {
      toast({
        title: "입력값을 확인해주세요",
        description: "빨간색으로 표시된 항목을 수정한 뒤 다시 시도하세요.",
        variant: "destructive",
      });
    })();
  };

  const onSubmit = (values: ProductFormInput) => {
    startTransition(async () => {
      const res =
        mode === "edit" && productId
          ? await updateProductAction(productId, values)
          : await createProductAction(values);
      if (res.ok === false) {
        toast({
          title: "저장 실패",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: values.publish ? "판매 등록되었습니다" : "임시 저장되었습니다",
        description: values.publish
          ? "소비자에게 바로 노출됩니다."
          : "상품관리에서 언제든 판매 등록할 수 있습니다.",
      });
      router.push("/seller/products");
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* ① 기기정보 */}
        <Section no={1} title="기기정보">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>브랜드</FormLabel>
                  <EnumSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={BRANDS}
                    labels={BRAND_LABEL}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>모델</FormLabel>
                  <FormControl>
                    <Input placeholder="iPhone 15 Pro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>용량</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="용량 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STORAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>색상</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 내추럴 티타늄" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* ② 상태 */}
        <Section
          no={2}
          title="상태"
          desc="표준화된 항목으로 정직하게 입력해주세요. 분쟁 시 기준이 됩니다."
        >
          <FormField
            control={form.control}
            name="conditionGrade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>외관등급</FormLabel>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CONDITION_GRADES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => field.onChange(g)}
                      className={cn(
                        "border px-3 py-2 text-left text-sm transition-colors",
                        conditionGrade === g
                          ? "border-black bg-black text-white"
                          : "hover:bg-zinc-50",
                      )}
                    >
                      <span className="block text-base font-bold">{g}</span>
                      <span
                        className={cn(
                          "block text-xs",
                          conditionGrade === g
                            ? "text-zinc-200"
                            : "text-zinc-500",
                        )}
                      >
                        {CONDITION_GRADE_LABEL[g].split("·")[1]?.trim()}
                      </span>
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="screenCondition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>액정</FormLabel>
                  <EnumSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={SCREEN_CONDITIONS}
                    labels={SCREEN_CONDITION_LABEL}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frameCondition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프레임</FormLabel>
                  <EnumSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={FRAME_CONDITIONS}
                    labels={FRAME_CONDITION_LABEL}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="backCondition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>후면</FormLabel>
                  <EnumSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={BACK_CONDITIONS}
                    labels={BACK_CONDITION_LABEL}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {brand === "APPLE" && (
            <FormField
              control={form.control}
              name="batteryHealth"
              render={({ field }) => (
                <FormItem className="sm:max-w-xs">
                  <FormLabel>배터리 성능 (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      inputMode="numeric"
                      placeholder="예: 89"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    설정 &gt; 배터리 &gt; 배터리 성능 상태의 최대 성능 수치
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {brand === "SAMSUNG" && (
            <FormField
              control={form.control}
              name="batteryStatus"
              render={({ field }) => (
                <FormItem className="sm:max-w-xs">
                  <FormLabel>배터리 상태</FormLabel>
                  <EnumSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={BATTERY_STATUSES}
                    labels={BATTERY_STATUS_LABEL}
                  />
                  <FormDescription>
                    삼성 멤버스 &gt; 진단 결과 기준
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="repairHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>수리이력</FormLabel>
                    <EnumSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={HISTORY_STATES}
                      labels={HISTORY_STATE_LABEL}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {repairHistory === "YES" && (
                <FormField
                  control={form.control}
                  name="repairNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="수리 내용 (예: 2024.03 액정 교체, 공식 서비스센터)"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="partsReplacement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>부품교체</FormLabel>
                    <EnumSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={HISTORY_STATES}
                      labels={HISTORY_STATE_LABEL}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {partsReplacement === "YES" && (
                <FormField
                  control={form.control}
                  name="partsNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="교체 부품 (예: 배터리 교체, 비정품)"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          <FormField
            control={form.control}
            name="notLostOrStolen"
            render={({ field }) => (
              <FormItem className="rounded-md border bg-zinc-50 p-3">
                <div className="flex items-start gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="font-medium">
                      분실·도난 제품이 아닙니다
                    </FormLabel>
                    <FormDescription>
                      판매 등록을 위해 반드시 확인해야 합니다. 허위 확인 시 모든
                      책임은 판매자에게 있습니다.
                    </FormDescription>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="normalTermination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>정상해지</FormLabel>
                  <EnumSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={AVAILABILITY_STATES}
                    labels={AVAILABILITY_LABEL}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contractDiscount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>선택약정 가능 여부</FormLabel>
                  <EnumSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={AVAILABILITY_STATES}
                    labels={AVAILABILITY_LABEL}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imei"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMEI</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="숫자 15자리"
                      inputMode="numeric"
                      maxLength={16}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    소비자에게는 전체 IMEI가 노출되지 않습니다.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* ③ 기능검사 */}
        <Section
          no={3}
          title="기능검사"
          desc="확인하지 않은 항목은 '미확인'으로 두세요."
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {INSPECTION_ITEMS.map((item) => (
              <FormField
                key={item}
                control={form.control}
                name={`inspection.${item}` as const}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-2 border px-3 py-2">
                    <FormLabel className="text-sm">
                      {INSPECTION_ITEM_LABEL[item]}
                    </FormLabel>
                    <div className="flex shrink-0 overflow-hidden rounded-md border">
                      {INSPECTION_RESULTS.map((r) => {
                        const active = field.value === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => field.onChange(r)}
                            className={cn(
                              "px-2 py-1 text-xs transition-colors",
                              active
                                ? r === "NORMAL"
                                  ? "bg-emerald-600 text-white"
                                  : r === "ABNORMAL"
                                    ? "bg-rose-600 text-white"
                                    : "bg-zinc-700 text-white"
                                : "bg-white text-zinc-600 hover:bg-zinc-50",
                            )}
                          >
                            {INSPECTION_RESULT_LABEL[r]}
                          </button>
                        );
                      })}
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </Section>

        {/* ④ 가격 */}
        <Section no={4} title="가격">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="sm:max-w-xs">
                <FormLabel>판매가 (원)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1000}
                    step={1000}
                    inputMode="numeric"
                    placeholder="예: 850000"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  {price ? (
                    <span className="font-medium text-black">
                      {formatKRW(price)}
                    </span>
                  ) : (
                    "원 단위로 입력하세요."
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        {/* ⑤ 사진 */}
        <Section no={5} title="사진">
          <FormField
            control={form.control}
            name="images"
            render={({ field }) => {
              const list = (field.value ?? []) as {
                imageUrl: string;
                kind: ImageKind;
              }[];
              return (
                <FormItem>
                  <FormDescription>
                    필수: 전면·후면·좌측·우측·액정 5장 권장, 최대{" "}
                    {MAX_PRODUCT_IMAGES}장
                  </FormDescription>
                  <FormControl>
                    <ImageUploader
                      scope="product"
                      max={MAX_PRODUCT_IMAGES}
                      label="사진 추가"
                      value={list.map((i) => i.imageUrl)}
                      onChange={(urls) =>
                        field.onChange(
                          urls.map(
                            (url) =>
                              list.find((i) => i.imageUrl === url) ?? {
                                imageUrl: url,
                                kind: "ETC" as ImageKind,
                              },
                          ),
                        )
                      }
                    />
                  </FormControl>
                  {list.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((img, i) => (
                        <div
                          key={img.imageUrl + i}
                          className="flex items-center gap-2 border p-2"
                        >
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-zinc-50">
                            <Image
                              src={img.imageUrl}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <span className="w-10 shrink-0 text-xs text-zinc-500">
                            사진 {i + 1}
                          </span>
                          <Select
                            value={img.kind}
                            onValueChange={(v) =>
                              field.onChange(
                                list.map((it, j) =>
                                  j === i
                                    ? { ...it, kind: v as ImageKind }
                                    : it,
                                ),
                              )
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {IMAGE_KINDS.map((k) => (
                                <SelectItem key={k} value={k}>
                                  {IMAGE_KIND_LABEL[k]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                  {missingKinds.length > 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      아직 없는 권장 사진:{" "}
                      {missingKinds.map((k) => IMAGE_KIND_LABEL[k]).join(", ")}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </Section>

        {/* ⑥ 설명 */}
        <Section no={6} title="설명">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>상품 설명 (선택)</FormLabel>
                <FormControl>
                  <Textarea
                    rows={6}
                    placeholder="구성품, 사용 기간, 특이사항 등을 적어주세요. 위 표준 항목과 다른 내용을 적으면 분쟁 시 불리할 수 있습니다."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <div className="flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => submit(false)}
          >
            임시 저장
          </Button>
          <Button type="button" disabled={pending} onClick={() => submit(true)}>
            {pending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "edit" ? "저장 후 판매 등록" : "판매 등록"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
