"use client";

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
import { wishlistItemSchema, type WishlistItemInput } from "@/lib/validations/wishlist";
import { createWishlistItemAction, updateWishlistItemAction } from "@/actions/wishlist";
import type { WishlistItemDTO } from "@/features/wishlist/wishlist-dto";

interface WishlistFormDialogProps {
  item?: WishlistItemDTO;
  trigger?: React.ReactNode;
}

export function WishlistFormDialog({ item, trigger }: WishlistFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(item);

  const form = useForm<WishlistItemInput>({
    resolver: zodResolver(wishlistItemSchema) as Resolver<WishlistItemInput>,
    defaultValues: {
      item: item?.item ?? "",
      price: item?.price ?? null,
      store: item?.store ?? "",
      url: item?.url ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        item: item?.item ?? "",
        price: item?.price ?? null,
        store: item?.store ?? "",
        url: item?.url ?? "",
      });
    }
  }, [open, item, form]);

  async function onSubmit(values: WishlistItemInput) {
    setIsSubmitting(true);
    const result = isEdit
      ? await updateWishlistItemAction({ id: item!.id, ...values })
      : await createWishlistItemAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Item updated" : "Item added");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Add item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit item" : "Add item"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <FormControl>
                    <Input placeholder="Bluetooth headphones, study lamp…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="999"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? null : e.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="store"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store</FormLabel>
                  <FormControl>
                    <Input placeholder="Amazon, Flipkart, Local Store…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://…" {...field} />
                  </FormControl>
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
