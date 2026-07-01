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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { budgetEntrySchema, type BudgetEntryInput } from "@/lib/validations/budget";
import { createBudgetEntryAction, updateBudgetEntryAction } from "@/actions/budget";
import { BUDGET_CATEGORIES } from "@/types";
import type { BudgetEntryDTO } from "@/features/budget/budget-dto";

function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

interface EntryFormDialogProps {
  entry?: BudgetEntryDTO;
  trigger?: React.ReactNode;
}

export function EntryFormDialog({ entry, trigger }: EntryFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(entry);

  function buildDefaults(): BudgetEntryInput {
    return {
      title: entry?.title ?? "",
      amount: entry?.amount ?? 0,
      category: entry?.category ?? "Miscellaneous",
      type: entry?.type ?? "expense",
      date: entry ? new Date(entry.date) : new Date(),
    };
  }

  const form = useForm<BudgetEntryInput>({
    resolver: zodResolver(budgetEntrySchema) as Resolver<BudgetEntryInput>,
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry, form]);

  async function onSubmit(values: BudgetEntryInput) {
    setIsSubmitting(true);
    const result = isEdit
      ? await updateBudgetEntryAction({ id: entry!.id, ...values })
      : await createBudgetEntryAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Entry updated" : "Entry added");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Add entry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit entry" : "New entry"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Groceries, bus ticket, textbooks…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      value={Number.isNaN(field.value) ? "" : field.value}
                    />
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUDGET_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="grid-flow-col justify-start gap-6"
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="planned" id="type-planned" />
                        <Label htmlFor="type-planned" className="font-normal">
                          Planned
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="expense" id="type-expense" />
                        <Label htmlFor="type-expense" className="font-normal">
                          Expense
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={toDateInputValue(new Date(field.value))}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Add entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
