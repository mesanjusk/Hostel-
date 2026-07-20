import { useRef, useState, type ReactNode } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AvatarCropDialog } from "@/features/auth/avatar-crop-dialog";
import { compressImageToDataUrl, MAX_SOURCE_BYTES } from "@/lib/image-compression";
import { api, ApiError } from "@/lib/api";

interface AvatarUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Shown inside the circle when there's no photo yet — initials text, or an icon for a
   * not-yet-registered visitor (see profile-view.tsx). */
  fallback: ReactNode;
}

/** Optional profile-picture picker for onboarding — plain `accept="image/*"` (no `capture`
 * attribute) so mobile browsers offer both "choose from gallery" and "take photo" in the
 * native picker. Never required: the caller decides whether to submit without a value.
 * Picking a file opens a crop step (AvatarCropDialog) before it's compressed and uploaded. */
export function AvatarUploadField({ value, onChange, fallback }: AvatarUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFile(file: File | undefined) {
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
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.onerror = () => {
      toast.error("Failed to read image");
      resetInput();
    };
    reader.readAsDataURL(file);
  }

  async function handleCropConfirm(blob: Blob) {
    setBusy(true);
    try {
      const dataUrl = await compressImageToDataUrl(blob);
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
      setCropSrc(null);
      resetInput();
    }
  }

  function handleCropCancel() {
    setCropSrc(null);
    resetInput();
  }

  const displayUrl = previewUrl ?? value;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar className="size-20">
          {displayUrl && <AvatarImage src={displayUrl} alt="Profile photo" />}
          <AvatarFallback className="text-xl">{fallback}</AvatarFallback>
        </Avatar>
        {busy && (
          <div className="bg-background/60 absolute inset-0 flex items-center justify-center rounded-full">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={value ? "Change profile photo" : "Add profile photo"}
          className="bg-primary text-primary-foreground absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border-2 border-background disabled:opacity-60"
        >
          <Camera className="size-3.5" />
        </button>
      </div>

      {value ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")} disabled={busy}>
          Remove photo
        </Button>
      ) : (
        <p className="text-muted-foreground text-xs">Profile photo (optional)</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <AvatarCropDialog imageSrc={cropSrc} busy={busy} onCancel={handleCropCancel} onConfirm={handleCropConfirm} />
    </div>
  );
}
