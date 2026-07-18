import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { BOY_STICKER_SLUGS, GIRL_STICKER_SLUGS } from "@/lib/gender-stickers";
import type { GenderThemeSettingsDTO } from "@/features/admin/gender-theme-dto";

const hexColorOrEmpty = z
  .string()
  .trim()
  .regex(/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))?$/, "Use a hex color like #1e3a5f, or leave blank");

const formSchema = z.object({
  primaryColor: hexColorOrEmpty,
  secondaryColor: hexColorOrEmpty,
  accentColor: hexColorOrEmpty,
  gradientFrom: hexColorOrEmpty,
  gradientTo: hexColorOrEmpty,
  stickerSlugs: z.array(z.string()),
});

type FormInput = z.infer<typeof formSchema>;

function Swatch({ hex }: { hex: string }) {
  const valid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
  return (
    <span
      className="border-border/60 inline-block size-6 shrink-0 rounded-full border"
      style={{ background: valid ? hex : "transparent" }}
    />
  );
}

function ColorField({
  form,
  name,
  label,
}: {
  form: ReturnType<typeof useForm<FormInput>>;
  name: keyof FormInput;
  label: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name as "primaryColor"}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="flex items-center gap-2">
              <Swatch hex={field.value as string} />
              <Input placeholder="#1e3a5f" {...field} value={field.value as string} />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Edits one gender key's (Male or Female) admin-tunable color overrides and enabled sticker
 * set. Colors are optional per-field overrides — blank means "use the shipped default" (see
 * index.css / gender-stickers.ts), so an admin only has to fill in what they actually want to
 * change. The sticker list shown depends on which gender is being edited: the boy SVG set for
 * Male, the existing girl webp set for Female — toggling one off there falls back to the other
 * set's equivalent (or is simply excluded from the enabled set) at render time.
 */
export function GenderThemeFormDialog({ settings }: { settings: GenderThemeSettingsDTO }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const availableSlugs = settings.key === "Male" ? BOY_STICKER_SLUGS : GIRL_STICKER_SLUGS;

  function buildDefaults(): FormInput {
    return {
      primaryColor: settings.primaryColor ?? "",
      secondaryColor: settings.secondaryColor ?? "",
      accentColor: settings.accentColor ?? "",
      gradientFrom: settings.gradientFrom ?? "",
      gradientTo: settings.gradientTo ?? "",
      stickerSlugs: settings.stickerSlugs,
    };
  }

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema) as Resolver<FormInput>,
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    if (open) form.reset(buildDefaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: FormInput) {
    setIsSubmitting(true);
    try {
      await api.patch(`/api/admin/gender-theme/${settings.key}`, values);
      emitRefresh();
      toast.success(`${settings.key} theme updated`);
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
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{settings.key} theme</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Leave any color blank to keep the built-in default. These only apply to students
              whose gender resolves to {settings.key === "Male" ? "Male" : "Female, Other, or unset"}.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <ColorField form={form} name="primaryColor" label="Primary" />
              <ColorField form={form} name="secondaryColor" label="Secondary" />
              <ColorField form={form} name="accentColor" label="Accent" />
              <ColorField form={form} name="gradientFrom" label="Gradient from" />
              <ColorField form={form} name="gradientTo" label="Gradient to" />
            </div>

            <FormField
              control={form.control}
              name="stickerSlugs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enabled stickers ({settings.key === "Male" ? "boy" : "girl"} set)</FormLabel>
                  <p className="text-muted-foreground text-xs">
                    Leave everything unchecked to use the full built-in set. Checking any box
                    restricts this gender to just the checked stickers.
                  </p>
                  <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-border/60 p-3 sm:grid-cols-3">
                    {availableSlugs.map((slug) => (
                      <label key={slug} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value.includes(slug)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked ? [...field.value, slug] : field.value.filter((s) => s !== slug),
                            );
                          }}
                        />
                        <span className="truncate">{slug}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
