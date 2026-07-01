"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { noteSchema, type NoteInput } from "@/lib/validations/note";
import { createNoteAction, updateNoteAction } from "@/actions/notes";
import type { NoteDTO } from "@/types";

interface NoteFormDialogProps {
  note?: NoteDTO;
  trigger?: React.ReactNode;
}

export function NoteFormDialog({ note, trigger }: NoteFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(note);

  const form = useForm<NoteInput>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: note?.title ?? "",
      content: note?.content ?? "",
      pinned: note?.pinned ?? false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: note?.title ?? "",
        content: note?.content ?? "",
        pinned: note?.pinned ?? false,
      });
    }
  }, [open, note, form]);

  async function onSubmit(values: NoteInput) {
    setIsSubmitting(true);
    const result = isEdit
      ? await updateNoteAction({ id: note!.id, ...values })
      : await createNoteAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Note updated" : "Note added");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            New note
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit note" : "New note"}</DialogTitle>
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
                    <Input placeholder="Roommate's number, hostel Wi-Fi password…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Write anything…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Add note"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function EditNoteTrigger() {
  return (
    <Button variant="ghost" size="icon" className="size-8">
      <Pencil className="size-4" />
    </Button>
  );
}
