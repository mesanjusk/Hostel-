"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { documentItemSchema, type DocumentItemInput } from "@/lib/validations/document";
import { createDocumentAction, updateDocumentAction } from "@/actions/documents";
import type { DocumentItemDTO } from "@/features/documents/document-dto";

interface DocumentFormDialogProps {
  document?: DocumentItemDTO;
  trigger?: React.ReactNode;
}

export function DocumentFormDialog({ document, trigger }: DocumentFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(document);

  const form = useForm<DocumentItemInput>({
    resolver: zodResolver(documentItemSchema),
    defaultValues: {
      title: document?.title ?? "",
      url: document?.url ?? "",
      category: document?.category ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: document?.title ?? "",
        url: document?.url ?? "",
        category: document?.category ?? "",
      });
    }
  }, [open, document, form]);

  async function onSubmit(values: DocumentItemInput) {
    setIsSubmitting(true);
    const result = isEdit
      ? await updateDocumentAction({ id: document!.id, ...values })
      : await createDocumentAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Document updated" : "Document added");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Add document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit document" : "Add document"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Aadhaar card, admission letter…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Paste a Google Drive/Photos link or any URL"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Identity, Academic, Medical…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Add document"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
