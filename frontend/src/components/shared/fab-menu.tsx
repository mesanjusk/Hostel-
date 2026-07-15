import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  FolderPlus,
  Heart,
  ListChecks,
  Loader2,
  PhoneCall,
  Plus,
  StickyNote,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { ItemFormDialog } from "@/features/checklist/item-form-dialog";
import { CategoryManagerDialog } from "@/features/checklist/category-manager-dialog";
import { EntryFormDialog } from "@/features/budget/entry-form-dialog";
import { NoteFormDialog } from "@/features/notes/note-form-dialog";
import { DocumentFormDialog } from "@/features/documents/document-form-dialog";
import { ContactFormDialog } from "@/features/contacts/contact-form-dialog";
import { WishlistFormDialog } from "@/features/wishlist/wishlist-form-dialog";

type DialogKey = "checklist" | "budget" | "note" | "document" | "contact" | "wishlist" | "category";

const SPEED_DIAL_ITEMS: { key: DialogKey; label: string; icon: typeof ListChecks; navHref?: string }[] = [
  { key: "checklist", label: "Checklist item", icon: ListChecks },
  { key: "budget", label: "Budget entry", icon: Wallet, navHref: "/budget" },
  { key: "note", label: "Note", icon: StickyNote, navHref: "/notes" },
  { key: "document", label: "Document", icon: FileText, navHref: "/documents" },
  { key: "contact", label: "Contact", icon: PhoneCall, navHref: "/contacts" },
  { key: "wishlist", label: "Wishlist item", icon: Heart, navHref: "/wishlist" },
  { key: "category", label: "New category", icon: FolderPlus },
];

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export function FabMenu({ hiddenNavHrefs }: { hiddenNavHrefs?: Set<string> }) {
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogKey | null>(null);
  const [categories, setCategories] = useState<string[] | null>(null);
  const [loadingKey, setLoadingKey] = useState<DialogKey | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  function spawnRipple(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.4;
    setRipples((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size },
    ]);
  }

  function clearRipple(id: number) {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }
  const speedDialItems = SPEED_DIAL_ITEMS.filter(
    (item) => !item.navHref || !hiddenNavHrefs?.has(item.navHref),
  );

  function closeActiveDialog(refresh = false) {
    setActiveDialog(null);
    if (refresh) emitRefresh();
  }

  async function handleSelect(key: DialogKey) {
    if (key === "checklist" && categories === null) {
      setLoadingKey("checklist");
      try {
        const { categories: cats } = await api.get<{
          categories: { id: string; name: string; icon: string | null }[];
        }>("/api/categories");
        setCategories(cats.map((c) => c.name));
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Failed to load categories");
        setLoadingKey(null);
        return;
      }
      setLoadingKey(null);
    }
    setSpeedDialOpen(false);
    setActiveDialog(key);
  }

  const speedDialPopup = (
    <AnimatePresence>
      {speedDialOpen && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="glass absolute bottom-14 left-1/2 flex w-56 -translate-x-1/2 flex-col gap-1 rounded-2xl p-2 shadow-xl lg:bottom-16 lg:left-auto lg:right-0 lg:translate-x-0"
        >
          {speedDialItems.map((item, i) => {
            const Icon = item.icon;
            const isLoading = loadingKey === item.key;
            return (
              <motion.button
                key={item.key}
                type="button"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleSelect(item.key)}
                disabled={isLoading}
                className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-60"
              >
                <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </span>
                {item.label}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const toggleButton = (size: "sm" | "lg") => (
    <div className={cn("relative", size === "sm" && "-translate-y-2")}>
      <motion.button
        type="button"
        aria-label={speedDialOpen ? "Close quick add" : "Quick add"}
        onPointerDown={spawnRipple}
        onClick={() => setSpeedDialOpen((v) => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={cn(
          "gradient-brand relative flex items-center justify-center overflow-hidden rounded-full text-white",
          size === "sm" ? "size-14" : "size-16",
        )}
      >
        {ripples.map((r) => (
          <span
            key={r.id}
            onAnimationEnd={() => clearRipple(r.id)}
            className="animate-fab-ripple pointer-events-none absolute rounded-full bg-white/40"
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
          />
        ))}
        <motion.span
          className="flex shrink-0 items-center justify-center"
          animate={{ rotate: speedDialOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className={size === "sm" ? "size-6" : "size-7"} />
        </motion.span>
      </motion.button>
    </div>
  );

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-center lg:hidden"
        style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto relative">
          {speedDialPopup}
          {toggleButton("sm")}
        </div>
      </div>

      <div className="pointer-events-none fixed right-8 bottom-8 z-40 hidden lg:block">
        <div className="pointer-events-auto relative">
          {speedDialPopup}
          {toggleButton("lg")}
        </div>
      </div>

      {speedDialOpen && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setSpeedDialOpen(false)}
          className="fixed inset-0 z-30"
        />
      )}

      <ItemFormDialog
        categories={categories ?? []}
        open={activeDialog === "checklist"}
        onOpenChange={(open) => !open && closeActiveDialog(true)}
      />
      <EntryFormDialog
        open={activeDialog === "budget"}
        onOpenChange={(open) => !open && closeActiveDialog(true)}
      />
      <NoteFormDialog
        open={activeDialog === "note"}
        onOpenChange={(open) => !open && closeActiveDialog(true)}
      />
      <DocumentFormDialog
        open={activeDialog === "document"}
        onOpenChange={(open) => !open && closeActiveDialog(true)}
      />
      <ContactFormDialog
        open={activeDialog === "contact"}
        onOpenChange={(open) => !open && closeActiveDialog(true)}
      />
      <WishlistFormDialog
        open={activeDialog === "wishlist"}
        onOpenChange={(open) => !open && closeActiveDialog(true)}
      />
      <CategoryManagerDialog
        open={activeDialog === "category"}
        onOpenChange={(open) => !open && closeActiveDialog(true)}
      />
    </>
  );
}
