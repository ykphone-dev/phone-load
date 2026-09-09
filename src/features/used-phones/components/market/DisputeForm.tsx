"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { openDisputeAction } from "../../actions/orders";
import { disputeOpenSchema, type DisputeOpenInput } from "../../validations";
import { ImageUploader } from "../ImageUploader";

/** "문제가 해결되지 않았습니다" → 분쟁 접수 (기획서 22) */
export function DisputeForm({ orderNumber }: { orderNumber: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<DisputeOpenInput>({
    resolver: zodResolver(disputeOpenSchema),
    defaultValues: { reason: "", description: "", imageUrls: [] },
  });

  if (!open) {
    return (
      <Button variant="destructive" onClick={() => setOpen(true)}>
        문제가 해결되지 않았습니다
      </Button>
    );
  }

  const onSubmit = (values: DisputeOpenInput) => {
    if (
      !window.confirm(
        "분쟁을 접수하시겠습니까? 옆커폰 관리자가 확인 후 처리합니다.",
      )
    )
      return;
    startTransition(async () => {
      const res = await openDisputeAction(orderNumber, values);
      if (res.ok === false) {
        toast({
          title: "접수 실패",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "분쟁이 접수되었습니다",
        description: "관리자가 판매자 답변을 받아 처리합니다.",
      });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 border border-rose-200 p-4"
      >
        <h3 className="font-semibold text-rose-700">분쟁 접수</h3>
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>사유 (한 줄 요약)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="예: 환불 요청 후 3일간 판매자 응답 없음"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>상세 내용</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>사진 첨부</FormLabel>
              <FormControl>
                <ImageUploader
                  scope="evidence"
                  orderNumber={orderNumber}
                  value={field.value}
                  onChange={field.onChange}
                  max={10}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormDescription>
          접수 후에는 관리자가 처리할 때까지 주문 상태가 &quot;분쟁중&quot; 으로
          유지됩니다.
        </FormDescription>
        <div className="flex gap-2">
          <Button type="submit" variant="destructive" disabled={pending}>
            {pending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
            분쟁 접수
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            취소
          </Button>
        </div>
      </form>
    </Form>
  );
}
