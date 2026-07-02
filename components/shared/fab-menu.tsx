"use client";

import { useRouter } from "next/navigation";
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
import { listCategoriesAction } from "@/actions/categories";
import { ItemFormDialog } from "@/features/checklist/item-form-dialog";
import { CategoryManagerDialog } from "@/features/checklist/category-manager-dialog";
import { EntryFormDialog } from "@/features/budget/entry-form-dialog";
import { NoteFormDialog } from "@/features/notes/note-form-dialog";
import { DocumentFormDialog } from "@/features/documents/document-form-dialog";
import { ContactFormDialog } from "@/features/contacts/contact-form-dialog";
import { WishlistFormDialog } from "@/features/wishlist/wishlist-form-dialog";

type DialogKey = "checklist" | "budget" | "note" | "document" | "contact" | "wishlist" | "category";

const SPEED_DIAL_ITEMS: { key: DialogKey; label: string; icon: typeof ListChecks }[] = [
  { key: "checklist", label: "Checklist item", icon: ListChecks },
  { key: "budget", label: "Budget entry", icon: Wallet },
  { key: "note", label: "Note", icon: StickyNote },
  { key: "document", label: "Document", icon: FileText },
  { key: "contact", label: "Contact", icon: PhoneCall },
  { key: "wishlist", label: "Wishlist item", icon: Heart },
  { key: "category", label: "New category", icon: FolderPlus },
];

export function FabMenu() {
  const router = useRouter();
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogKey | null>(null);
  const [categories, setCategories] = useState<string[] | null>(null);
  const [loadingKey, setLoadingKey] = useState<DialogKey | null>(null);

  function closeActiveDialog(refresh = false) {
    setActiveDialog(null);
    if (refresh) router.refresh();
  }

  async function handleSelect(key: DialogKey) {
    if (key === "checklist" && categories === null) {
      setLoadingKey("checklist");
      const result = await listCategoriesAction();
      setLoadingKey(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setCategories(result.categories.map((c) => c.name));
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
          {SPEED_DIAL_ITEMS.map((item, i) => {
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
    <button
      type="button"
      aria-label={speedDialOpen ? "Close quick add" : "Quick add"}
      onClick={() => setSpeedDialOpen((v) => !v)}
      className={cn(
        "gradient-brand flex items-center justify-center rounded-full text-white shadow-lg shadow-primary/30 transition-transform active:scale-95",
        size === "sm" ? "size-12 -translate-y-2" : "size-14",
      )}
    >
      <motion.span animate={{ rotate: speedDialOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
        <Plus className={size === "sm" ? "size-5" : "size-6"} />
      </motion.span>
    </button>
  );

  return (
    <>
      {/* Mobile: embedded in the center of the bottom tab bar.
          pointer-events-none on this full-width wrapper is required — otherwise its
          invisible hit-testing area covers the whole bar and blocks the nav links under it. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-center lg:hidden">
        <div className="pointer-events-auto relative">
          {speedDialPopup}
          {toggleButton("sm")}
        </div>
      </div>

      {/* Desktop: floating bottom-right (the sidebar has no center-nav slot). */}
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
