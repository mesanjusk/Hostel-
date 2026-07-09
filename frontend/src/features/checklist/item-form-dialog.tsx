import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { checklistItemSchema, type ChecklistItemInput } from "@/lib/validations/checklist";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { CategorySelect } from "@/features/checklist/category-select";
import { PhotoUploadField } from "@/features/checklist/photo-upload-field";
import { BagSelect } from "@/features/bags/bag-select";
import { CHECKLIST_PRIORITIES, type ChecklistCategory } from "@/types";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

interface ItemFormDialogProps {
  /** The user's full category list, for the category picker. */
  categories: string[];
  /** Preselected category (e.g. creating from within a specific category's panel). Defaults to the first category when omitted. */
  category?: ChecklistCategory;
  item?: ChecklistItemDTO;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ItemFormDialog({
  categories,
  category,
  item,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ItemFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [categoryList, setCategoryList] = useState(categories);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(item);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  useEffect(() => {
    setCategoryList(categories);
  }, [categories]);

  const defaultCategory = item?.category ?? category ?? categoryList[0] ?? "";

  function buildDefaults(): ChecklistItemInput {
    return {
      category: item?.category ?? category ?? categoryList[0] ?? "",
      item: item?.item ?? "",
      description: item?.description ?? "",
      imageUrl: item?.imageUrl ?? "",
      bagId: item?.bagId ?? null,
      notes: item?.notes ?? "",
      priority: item?.priority ?? "medium",
      price: item?.price ?? null,
      priceRangeMin: item?.priceRangeMin ?? null,
      priceRangeMax: item?.priceRangeMax ?? null,
      recommendedBrand: item?.recommendedBrand ?? "",
      recommendedStore: item?.recommendedStore ?? null,
      purchaseLink: item?.purchaseLink ?? "",
      studentRating: item?.studentRating ?? null,
      importance: item?.importance ?? "",
    };
  }

  const form = useForm<ChecklistItemInput>({
    resolver: zodResolver(checklistItemSchema) as Resolver<ChecklistItemInput>,
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item, category, form]);

  async function onSubmit(values: ChecklistItemInput) {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/api/checklist/${item!.id}`, values);
      } else {
        await api.post("/api/checklist", values);
      }
      emitRefresh();
      toast.success(isEdit ? "Item updated" : "Item added");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="size-4" />
            Add item
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit item" : "New item"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Bedsheet set" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <CategorySelect
                    categories={categoryList}
                    value={field.value || defaultCategory}
                    onChange={field.onChange}
                    onCategoryCreated={(c) => setCategoryList((prev) => [...prev, c])}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CHECKLIST_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo (optional)</FormLabel>
                  <FormControl>
                    <PhotoUploadField value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bagId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bag (optional)</FormLabel>
                  <BagSelect value={field.value ?? null} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Add item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
