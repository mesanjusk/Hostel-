"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, Send, History, Info } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { broadcastSchema, type BroadcastInput } from "@/lib/validations/admin";
import { sendBroadcastAction } from "@/actions/admin";
import type { BroadcastLogDTO } from "@/features/admin/broadcast-dto";

export function BroadcastView({ history: initialHistory }: { history: BroadcastLogDTO[] }) {
  const [history, setHistory] = useState(initialHistory);
  const [isSending, setIsSending] = useState(false);

  const form = useForm<BroadcastInput>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: { message: "", audience: "all" },
  });

  async function onSubmit(values: BroadcastInput) {
    setIsSending(true);
    const result = await sendBroadcastAction(values);
    setIsSending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`Sent to ${result.sentCount} students (${result.failedCount} failed)`);
    setHistory((prev) => [
      {
        id: crypto.randomUUID(),
        message: values.message,
        audience: values.audience,
        sentCount: result.sentCount ?? 0,
        failedCount: result.failedCount ?? 0,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    form.reset({ message: "", audience: "all" });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="WhatsApp Broadcast" description="Send a message to your students on WhatsApp" />

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 pt-0 text-sm">
          <Info className="text-primary mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground">
            Messages deliver reliably to students who have an open WhatsApp session with your
            business number (e.g. they logged in recently). For students outside that window, Meta
            requires a pre-approved message template — this composer sends plain text only.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compose message</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-64">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All students</SelectItem>
                        <SelectItem value="incomplete-checklist">
                          Students with incomplete checklist
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Don't forget to finish packing your Documents checklist before Friday!"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSending} className="self-start">
                {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Send broadcast
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState icon={History} title="No broadcasts sent yet" />
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((log) => (
                <div key={log.id} className="border-border/60 rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline">
                      {log.audience === "all" ? "All students" : "Incomplete checklist"}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(log.createdAt), "d MMM yyyy, h:mm a")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{log.message}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    ✅ {log.sentCount} sent · ❌ {log.failedCount} failed
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
