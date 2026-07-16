import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { compressImageToDataUrl } from "@/lib/image-compression";
import { api, ApiError } from "@/lib/api";

interface PhotoUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** Optional single-photo picker — used for a bag's photo. Compresses on-device, then
 * uploads the result to Cloudinary via the backend — the form only ever holds the
 * short hosted URL, not the raw image data, and the Cloudinary API secret never
 * leaves the server. */
export function PhotoUploadField({ value, onChange }: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setPreviewUrl(dataUrl);
      const { url } = await api.post<{ url: string }>("/api/uploads/image", { image: dataUrl });
      onChange(url);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to upload photo",
      );
    } finally {
      setBusy(false);
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const displayUrl = previewUrl ?? value;

  return (
    <div className="flex items-center gap-3">
      {displayUrl ? (
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border">
          <img src={displayUrl} alt="Photo" className="h-full w-full object-cover" />
          {!busy && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Remove photo"
              className="bg-background/90 absolute top-1 right-1 flex size-5 items-center justify-center rounded-full border"
            >
              <X className="size-3" />
            </button>
          )}
          {busy && (
            <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className="text-muted-foreground bg-muted flex size-20 shrink-0 items-center justify-center rounded-lg border border-dashed">
          <ImagePlus className="size-6" />
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        {value ? "Change photo" : "Add photo"}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
