import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Luggage, MoreVertical, Pencil, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { api, ApiError } from "@/lib/api";
import { emitRefresh, subscribeRefresh } from "@/lib/refresh-bus";
import { AddBagDialog } from "@/features/bags/add-bag-dialog";
import { BagQrDialog } from "@/features/bags/bag-qr-dialog";
import { SuitcaseIcon } from "@/features/bags/suitcase-icon";
import type { BagSummaryDTO } from "@/features/bags/bag-dto";

/** How long the lid-open animation plays before we navigate into the bag. */
const OPEN_ANIMATION_MS = 550;

export function BagsOverview() {
  const navigate = useNavigate();
  const [bags, setBags] = useState<BagSummaryDTO[] | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<BagSummaryDTO | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchData() {
    try {
      const { bags } = await api.get<{ bags: BagSummaryDTO[] }>("/api/bags");
      setBags(bags);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load bags");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  function handleOpenBag(bagId: string) {
    if (openingId) return;
    setOpeningId(bagId);
    setTimeout(() => navigate(`/bags/${bagId}`), OPEN_ANIMATION_MS);
  }

  async function handleRename() {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/api/bags/${renameTarget.id}`, { name });
      emitRefresh();
      toast.success("Bag renamed");
      setRenameTarget(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to rename bag");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/bags/${id}`);
      emitRefresh();
      toast.success("Bag deleted");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete bag");
    }
  }

  if (bags === null) return null;

  return (
    <div className="pb-24">
      <PageHeader
        title="Bags"
        description="Pack your real suitcases digitally — tap a bag to see what's inside."
        action={<AddBagDialog />}
      />

      {bags.length === 0 ? (
        <EmptyState
          icon={Luggage}
          title="No bags yet"
          description="Create a bag, then assign checklist items to it from the Checklist tab."
        />
      ) : (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
          {bags.map((bag, i) => {
            const percent = bag.total > 0 ? Math.round((bag.completed / bag.total) * 100) : 0;
            return (
              <motion.div
                key={bag.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="border-border/60 bg-card relative w-40 shrink-0 snap-start rounded-2xl border p-3 shadow-sm sm:w-auto"
              >
                <div className="absolute top-2 right-2 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Bag options"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setRenameTarget(bag);
                          setRenameValue(bag.name);
                        }}
                      >
                        <Pencil className="size-4" />
                        Rename
                      </DropdownMenuItem>
                      <BagQrDialog
                        bagId={bag.id}
                        bagName={bag.name}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <QrCode className="size-4" />
                            QR code
                          </DropdownMenuItem>
                        }
                      />
                      <ConfirmDialog
                        trigger={
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        }
                        title="Delete this bag?"
                        description="Items assigned to it will become unassigned, not deleted."
                        onConfirm={() => handleDelete(bag.id)}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenBag(bag.id)}
                  className="flex w-full flex-col items-center gap-1"
                >
                  <SuitcaseIcon color={bag.color} open={openingId === bag.id} size={128} />
                  <p className="font-display w-full truncate text-center font-semibold">{bag.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {bag.completed} / {bag.total} packed
                  </p>
                  <Progress value={percent} className="mt-1 w-full" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename bag</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRename();
              }
            }}
          />
          <DialogFooter>
            <Button onClick={handleRename} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
