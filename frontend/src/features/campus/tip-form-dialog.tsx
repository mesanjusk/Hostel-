import { useEffect, useState, type ReactNode } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PhotoUploadField } from "@/features/checklist/photo-upload-field";
import { api, ApiError } from "@/lib/api";
import { CAMPUS_TIP_CATEGORIES } from "@/types";
import { toCampusTipDTO, type CampusTipDTO, type CampusTipRaw } from "@/features/campus/campus-tip-dto";

const tipSchema = z.object({
  category: z.enum(CAMPUS_TIP_CATEGORIES),
  text: z.string().trim().min(1, "Share the tip itself").max(400),
  linkUrl: z.string().trim().url("Must be a full URL (https://…)").optional().or(z.literal("")),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
});

type TipInput = z.infer<typeof tipSchema>;

export function TipFormDialog({
  college,
  tip,
  onSaved,
  trigger,
}: {
  /** Display only ("Share a tip about {college}") — the server derives the actual campus scope
   * from the caller's own profile, so this is never sent in the request. */
  college: string;
  /** Present → edit mode. */
  tip?: CampusTipDTO;
  onSaved: (tip: CampusTipDTO) => void;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(tip);

  function buildDefaults(): TipInput {
    return {
      category: tip?.category ?? CAMPUS_TIP_CATEGORIES[0],
      text: tip?.text ?? "",
      linkUrl: tip?.linkUrl ?? "",
      imageUrl: tip?.imageUrl ?? "",
    };
  }

  const form = useForm<TipInput>({
    resolver: zodResolver(tipSchema) as Resolver<TipInput>,
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    if (open) form.reset(buildDefaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: TipInput) {
    setIsSubmitting(true);
    try {
      // No city/college in the payload — the server always posts to the caller's own campus
      // (see campusTips.routes.ts's ownCampus), so there's nothing to send here.
      const { tip: raw } = isEdit
        ? await api.patch<{ tip: CampusTipRaw }>(`/api/campus-tips/${tip!.id}`, values)
        : await api.post<{ tip: CampusTipRaw }>("/api/campus-tips", values);
      onSaved(toCampusTipDTO(raw));
      toast.success(isEdit ? "Tip updated" : "Tip shared");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Add
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit tip" : `Share a tip about ${college}`}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CAMPUS_TIP_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
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
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tip</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      maxLength={400}
                      placeholder="The photocopy shop behind gate 2 binds project reports overnight…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://maps.google.com/…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo (optional)</FormLabel>
                  <FormControl>
                    <PhotoUploadField value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Share tip"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
