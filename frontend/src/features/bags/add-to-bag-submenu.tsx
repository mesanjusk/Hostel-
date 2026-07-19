import { Check, Loader2, Luggage, Plus } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import type { BagSummaryDTO } from "@/features/bags/bag-dto";

interface AddToBagSubmenuProps {
  bags: BagSummaryDTO[] | null;
  currentBagId: string | null;
  pendingBagId?: string | null;
  onSelectBag: (bag: BagSummaryDTO) => void;
  onNewBag: () => void;
}

/** "Add to Bag" nested right inside a checklist item's three-dot menu — every existing bag
 * is one tap away, so assigning an item doesn't need a separate dialog. "New bag" at the
 * bottom hands off to the same "Create a new bag" screen used everywhere else. */
export function AddToBagSubmenu({ bags, currentBagId, pendingBagId, onSelectBag, onNewBag }: AddToBagSubmenuProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Luggage className="size-4" />
        Add to Bag
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {bags === null ? (
          <div className="flex justify-center px-2 py-2">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          </div>
        ) : (
          bags.map((bag) => (
            <DropdownMenuItem key={bag.id} onClick={() => onSelectBag(bag)}>
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: bag.color }} />
              <span className="min-w-0 flex-1 truncate">{bag.name}</span>
              {pendingBagId === bag.id ? (
                <Loader2 className="text-muted-foreground size-3.5 shrink-0 animate-spin" />
              ) : (
                currentBagId === bag.id && <Check className="text-primary size-3.5 shrink-0" />
              )}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNewBag}>
          <Plus className="size-4" />
          New bag
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
