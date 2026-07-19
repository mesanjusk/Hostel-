import { useEffect, useRef, useState } from "react";
import { useForm, type Path, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
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
import { compressImageToDataUrl, MAX_SOURCE_BYTES } from "@/lib/image-compression";
import type { GenderThemeSettingsDTO } from "@/features/admin/gender-theme-dto";

const hexColorOrEmpty = z
  .string()
  .trim()
  .regex(/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))?$/, "Use a hex color like #1e3a5f, or leave blank");

const noteColorsSchema = z.object({
  yellow: hexColorOrEmpty,
  pink: hexColorOrEmpty,
  blue: hexColorOrEmpty,
  lavender: hexColorOrEmpty,
});

const customStickerSchema = z.object({
  slug: z.string().trim().min(1).max(60),
  url: z.string().trim().url().max(2000),
});

const formSchema = z.object({
  primaryColor: hexColorOrEmpty,
  secondaryColor: hexColorOrEmpty,
  accentColor: hexColorOrEmpty,
  gradientFrom: hexColorOrEmpty,
  gradientTo: hexColorOrEmpty,
  stickerSlugs: z.array(z.string()),
  customStickers: z.array(customStickerSchema),
  noteColors: noteColorsSchema,
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
  name: Path<FormInput>;
  label: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
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

/** "Add from device" uploader for a gender's custom sticker pool — same authenticated upload
 * flow as AvatarUploadField (compress client-side, POST the resulting data URL to the existing
 * /api/uploads/image endpoint, store the returned Cloudinary URL), just without a crop step and
 * appending to an array instead of replacing a single value. Removing a sticker only drops it
 * from the form's customStickers array; the Cloudinary asset itself is left orphaned, which is an
 * acceptable, explicitly out-of-scope tradeoff (no delete-from-Cloudinary flow exists yet). */
function CustomStickersField({ form, genderKey }: { form: ReturnType<typeof useForm<FormInput>>; genderKey: "Male" | "Female" }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      resetInput();
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error("Image is too large to process");
      resetInput();
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      const { url } = await api.post<{ url: string }>("/api/uploads/image", { image: dataUrl });
      const slug = `custom-${genderKey.toLowerCase()}-${crypto.randomUUID()}`;
      const current = form.getValues("customStickers");
      form.setValue("customStickers", [...current, { slug, url }], { shouldDirty: true });
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Failed to upload sticker",
      );
    } finally {
      setUploading(false);
      resetInput();
    }
  }

  return (
    <FormField
      control={form.control}
      name="customStickers"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Custom stickers</FormLabel>
          <p className="text-muted-foreground text-xs">
            Upload extra stickers from your device — added on top of the built-in set above.
          </p>
          {field.value.length > 0 && (
            <div className="flex flex-wrap gap-3 py-1">
              {field.value.map((sticker, i) => (
                <div key={sticker.slug} className="relative">
                  <img
                    src={sticker.url}
                    alt=""
                    className="border-border/60 size-14 rounded-md border bg-white object-contain p-1"
                  />
                  <button
                    type="button"
                    aria-label="Remove sticker"
                    onClick={() => field.onChange(field.value.filter((_, idx) => idx !== i))}
                    className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div>
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading && <Loader2 className="size-4 animate-spin" />}
              Add from device
            </Button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Edits one gender key's (Male or Female) admin-tunable color overrides, sticky-note colors, and
 * enabled/custom sticker set. Colors are optional per-field overrides — blank means "use the
 * shipped default" (see index.css / gender-stickers.ts), so an admin only has to fill in what
 * they actually want to change. The built-in sticker list shown depends on which gender is being
 * edited: the boy SVG set for Male, the existing girl webp set for Female — toggling one off
 * there restricts that gender to just the checked stickers (see getStickerPool in
 * gender-stickers.ts for how that's consumed). Everything below — thumbnails, custom sticker
 * upload, note colors — applies identically to both genders; only the underlying slug list and
 * art path differ.
 */
export function GenderThemeFormDialog({ settings }: { settings: GenderThemeSettingsDTO }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const availableSlugs = settings.key === "Male" ? BOY_STICKER_SLUGS : GIRL_STICKER_SLUGS;

  function stickerThumbSrc(slug: string) {
    return settings.key === "Male" ? `/stickers/boy/${slug}.svg` : `/stickers/${slug}.webp`;
  }

  function buildDefaults(): FormInput {
    return {
      primaryColor: settings.primaryColor ?? "",
      secondaryColor: settings.secondaryColor ?? "",
      accentColor: settings.accentColor ?? "",
      gradientFrom: settings.gradientFrom ?? "",
      gradientTo: settings.gradientTo ?? "",
      stickerSlugs: settings.stickerSlugs,
      customStickers: settings.customStickers,
      noteColors: {
        yellow: settings.noteColors.yellow ?? "",
        pink: settings.noteColors.pink ?? "",
        blue: settings.noteColors.blue ?? "",
        lavender: settings.noteColors.lavender ?? "",
      },
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

            <div>
              <h4 className="text-sm font-medium">Sticky note colors</h4>
              <p className="text-muted-foreground mb-2 text-xs">
                Leave blank to keep the built-in default for each note color.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ColorField form={form} name="noteColors.yellow" label="Note: Yellow" />
                <ColorField form={form} name="noteColors.pink" label="Note: Pink" />
                <ColorField form={form} name="noteColors.blue" label="Note: Blue" />
                <ColorField form={form} name="noteColors.lavender" label="Note: Lavender" />
              </div>
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
                  <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-border/60 p-3 sm:grid-cols-3">
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
                        <img
                          src={stickerThumbSrc(slug)}
                          alt=""
                          loading="lazy"
                          className="border-border/40 size-10 shrink-0 rounded-md border bg-white object-contain p-1"
                        />
                        <span className="truncate">{slug}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CustomStickersField form={form} genderKey={settings.key} />

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
