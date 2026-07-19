import { useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { LandingPageSettingsDTO } from "@/features/admin/landing-settings-dto";

const MAX_SOURCE_BYTES = 5 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

/** Uploads a transparent PNG for one of the /welcome gender cards. Deliberately skips the app's
 * shared compressImageToDataUrl helper — that helper always re-encodes to JPEG (see
 * lib/image-compression.ts), which would drop the alpha channel these images depend on — and
 * instead just size-caps the raw file before sending it to the existing /api/uploads/image
 * endpoint (Cloudinary), same as every other upload field in this app. */
function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== "image/png") {
      toast.error("Please choose a PNG file");
      resetInput();
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error("Image is too large (max 5MB)");
      resetInput();
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const { url } = await api.post<{ url: string }>("/api/uploads/image", { image: dataUrl });
      onChange(url);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Failed to upload image",
      );
    } finally {
      setUploading(false);
      resetInput();
    }
  }

  return (
    <div className="flex flex-col items-center gap-2.5">
      <p className="font-display text-sm font-semibold">{label}</p>
      <div className="relative flex h-40 w-40 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40">
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-contain p-2" />
        ) : (
          <ImageIcon className="text-muted-foreground size-8" strokeWidth={1.5} />
        )}
        {uploading && (
          <div className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-2xl">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {value ? "Replace PNG" : "Upload PNG"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

export function LandingSettingsView({ settings }: { settings: LandingPageSettingsDTO | null }) {
  const [girlImageUrl, setGirlImageUrl] = useState<string | null>(null);
  const [boyImageUrl, setBoyImageUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoRedirectUrl, setLogoRedirectUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setGirlImageUrl(settings.girlImageUrl);
    setBoyImageUrl(settings.boyImageUrl);
    setLogoUrl(settings.logoUrl);
    setLogoRedirectUrl(settings.logoRedirectUrl ?? "");
  }, [settings]);

  const dirty =
    settings !== null &&
    (girlImageUrl !== settings.girlImageUrl ||
      boyImageUrl !== settings.boyImageUrl ||
      logoUrl !== settings.logoUrl ||
      logoRedirectUrl !== (settings.logoRedirectUrl ?? ""));

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/api/admin/landing-settings", {
        girlImageUrl: girlImageUrl ?? "",
        boyImageUrl: boyImageUrl ?? "",
        logoUrl: logoUrl ?? "",
        logoRedirectUrl: logoRedirectUrl.trim(),
      });
      emitRefresh();
      toast.success("Landing page settings saved");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save landing page settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome screen</CardTitle>
        <p className="text-muted-foreground text-sm">
          The logo and gender-pick images shown on the pre-login /welcome screen. Leave blank to show a neutral
          placeholder instead.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap justify-center gap-8 sm:justify-start">
          <ImageUploadField label="Logo" value={logoUrl} onChange={setLogoUrl} />
          <ImageUploadField label="Girl Image" value={girlImageUrl} onChange={setGirlImageUrl} />
          <ImageUploadField label="Boy Image" value={boyImageUrl} onChange={setBoyImageUrl} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="logo-redirect-url">Logo link (optional)</Label>
          <Input
            id="logo-redirect-url"
            type="url"
            placeholder="https://example.com"
            value={logoRedirectUrl}
            onChange={(e) => setLogoRedirectUrl(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Where tapping the logo on the /welcome screen sends visitors. Leave blank to make the logo unclickable.
          </p>
        </div>
        <div>
          <Button type="button" disabled={!dirty || saving} onClick={handleSave}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
