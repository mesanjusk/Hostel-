import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm, type Path, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { BOY_STICKER_SLUGS, GIRL_STICKER_SLUGS, boyStickerPath } from "@/lib/gender-stickers";
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
  backgroundColor: hexColorOrEmpty,
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

/** Expands a valid 3- or 6-digit hex string to the strict 6-digit `#rrggbb` form the native
 * `<input type="color">` requires (it silently ignores shorthand/invalid values), or returns null
 * for anything blank/invalid so callers can fall back to a neutral placeholder. */
function toFullHex(hex: string): string | null {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    return (
      "#" +
      hex
        .slice(1)
        .split("")
        .map((c) => c + c)
        .join("")
    ).toLowerCase();
  }
  return null;
}

/** Hex text input paired with a real native color picker swatch — picking a color writes its hex
 * back into the text field, and typing a valid hex updates the swatch, so either input stays the
 * single source of truth for the field's string value. */
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
      render={({ field }) => {
        const raw = (field.value as string) ?? "";
        const fullHex = toFullHex(raw);
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <span
                  className="border-border/60 bg-muted relative inline-flex size-10 shrink-0 overflow-hidden rounded-full border shadow-xs"
                  style={fullHex ? { background: fullHex } : undefined}
                >
                  <input
                    type="color"
                    aria-label={`Pick ${label} color`}
                    value={fullHex ?? "#94a3b8"}
                    onChange={(event) => field.onChange(event.target.value)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </span>
                <Input placeholder="#1e3a5f" {...field} value={raw} className="flex-1" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

/** One thumbnail card shared by both the built-in sticker grid and the custom-upload grid, so the
 * whole sticker section reads as a single coherent, obviously-deletable set. `included` stickers
 * render full-color with a trash badge (tap to remove); `excluded` ones render dimmed/grayscale
 * with a "+" badge (tap to add back) — custom stickers only ever pass `included`, since removing
 * one drops it from the array outright rather than toggling a restore state. */
function StickerCard({
  src,
  label,
  included,
  onToggle,
}: {
  src: string;
  label: string;
  included: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={included}
      aria-label={included ? `Remove ${label} sticker` : `Add ${label} sticker back`}
      className={cn(
        "group border-border/60 focus-visible:ring-ring/40 relative flex min-h-[4.5rem] flex-col items-center gap-1 rounded-xl border bg-white/70 p-2.5 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none",
        included ? "hover:border-primary/50" : "hover:border-primary/30 opacity-60",
      )}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className={cn("size-11 rounded-md object-contain transition-all", !included && "grayscale")}
      />
      <span className="text-muted-foreground w-full truncate text-[11px] leading-tight">{label}</span>
      <span
        aria-hidden
        className={cn(
          "absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border-2 border-white shadow-sm transition-colors",
          included ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        {included ? <Trash2 className="size-3.5" /> : <Plus className="size-3.5" />}
      </span>
    </button>
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
          <FormLabel className="font-display text-sm font-semibold">Custom stickers</FormLabel>
          <p className="text-muted-foreground text-xs">
            Uploaded from your device — added on top of the built-in set above. Tap a sticker to remove it.
          </p>
          {field.value.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5 py-1 sm:grid-cols-4">
              {field.value.map((sticker, i) => (
                <StickerCard
                  key={sticker.slug}
                  src={sticker.url}
                  label="Custom"
                  included
                  onToggle={() => field.onChange(field.value.filter((_, idx) => idx !== i))}
                />
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

function SectionHeading({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-sm font-semibold">{children}</h3>;
}

/**
 * Edits one gender key's (Male or Female) admin-tunable color overrides, sticky-note colors, and
 * enabled/custom sticker set. Colors are optional per-field overrides — blank means "use the
 * shipped default" (see index.css / gender-stickers.ts), so an admin only has to fill in what
 * they actually want to change. The built-in sticker list shown depends on which gender is being
 * edited: the boy SVG set for Male, the existing girl webp set for Female — removing one there
 * restricts that gender to just the remaining stickers (see getStickerPool in gender-stickers.ts
 * for how that's consumed); the on-screen "remove/add back" interaction is presentation only —
 * the underlying stored value is still an inclusion list where an empty array means "use the full
 * built-in set" (see toggleStickerSlug below). Everything below — thumbnails, custom sticker
 * upload, note colors — applies identically to both genders; only the underlying slug list and
 * art path differ.
 *
 * Rendered as a bottom Sheet (full-height slide-up panel) rather than a centered Dialog: this form
 * has ten color fields plus two sticker grids, which needs real vertical room on a phone screen —
 * a full-height panel with a sticky header/footer and exactly one scroll region in between reads
 * as a proper mobile editing surface instead of a cramped, doubly-scrolling popup.
 */
export function GenderThemeFormDialog({ settings }: { settings: GenderThemeSettingsDTO }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const availableSlugs = settings.key === "Male" ? BOY_STICKER_SLUGS : GIRL_STICKER_SLUGS;

  function stickerThumbSrc(slug: string) {
    return settings.key === "Male" ? boyStickerPath(slug) : `/stickers/${slug}.webp`;
  }

  function buildDefaults(): FormInput {
    return {
      backgroundColor: settings.backgroundColor ?? "",
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="mx-auto flex h-[92dvh] w-full max-w-full flex-col gap-0 rounded-t-2xl p-0 sm:h-[85dvh] sm:max-w-xl"
      >
        <SheetHeader className="border-border/60 border-b px-5 py-4 pr-12 text-left">
          <SheetTitle>{settings.key} theme</SheetTitle>
          <SheetDescription>
            Leave any color blank to keep the built-in default. These only apply to students whose gender
            resolves to {settings.key === "Male" ? "Male" : "Female, Other, or unset"}.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <section className="space-y-3">
                <SectionHeading>Page background</SectionHeading>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ColorField form={form} name="backgroundColor" label="Background" />
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <SectionHeading>Brand colors</SectionHeading>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ColorField form={form} name="primaryColor" label="Primary" />
                  <ColorField form={form} name="secondaryColor" label="Secondary" />
                  <ColorField form={form} name="accentColor" label="Accent" />
                  <ColorField form={form} name="gradientFrom" label="Gradient from" />
                  <ColorField form={form} name="gradientTo" label="Gradient to" />
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <div>
                  <SectionHeading>Sticky note colors</SectionHeading>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Leave blank to keep the built-in default for each note color.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ColorField form={form} name="noteColors.yellow" label="Note: Yellow" />
                  <ColorField form={form} name="noteColors.pink" label="Note: Pink" />
                  <ColorField form={form} name="noteColors.blue" label="Note: Blue" />
                  <ColorField form={form} name="noteColors.lavender" label="Note: Lavender" />
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <FormField
                  control={form.control}
                  name="stickerSlugs"
                  render={({ field }) => {
                    const includedSet = new Set(field.value.length > 0 ? field.value : availableSlugs);
                    function toggleStickerSlug(slug: string) {
                      const next = new Set(includedSet);
                      if (next.has(slug)) next.delete(slug);
                      else next.add(slug);
                      const ordered = availableSlugs.filter((s) => next.has(s));
                      // Storing [] (rather than the full list) when everything is included keeps the
                      // saved value meaning "no override — use the built-in default", exactly as before.
                      field.onChange(ordered.length === availableSlugs.length ? [] : ordered);
                    }
                    return (
                      <FormItem>
                        <div>
                          <FormLabel className="font-display text-sm font-semibold">
                            Built-in stickers ({settings.key === "Male" ? "boy" : "girl"} set)
                          </FormLabel>
                          <p className="text-muted-foreground mt-1 text-xs">
                            All built-in stickers are included by default. Tap one to remove it from this
                            gender&apos;s set, tap again to add it back.
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                          {availableSlugs.map((slug) => (
                            <StickerCard
                              key={slug}
                              src={stickerThumbSrc(slug)}
                              label={slug}
                              included={includedSet.has(slug)}
                              onToggle={() => toggleStickerSlug(slug)}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </section>

              <Separator />

              <section className="space-y-3">
                <CustomStickersField form={form} genderKey={settings.key} />
              </section>
            </div>

            <SheetFooter className="border-border/60 border-t px-5 py-4 sm:flex-row sm:justify-end">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
