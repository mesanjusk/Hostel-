import { useEffect, useState, type ReactNode } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { CityOptionDTO, CollegeCategoryDTO, CollegeDTO } from "@/features/auth/college-taxonomy-dto";

const collegeFormSchema = z.object({
  city: z.string().trim().min(1, "Select a city"),
  collegeCategoryId: z.string().trim().min(1, "Select a category"),
  name: z.string().trim().min(1).max(160),
  nirfRank: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
  active: z.boolean(),
});

type CollegeFormInput = z.infer<typeof collegeFormSchema>;

export function CollegeFormDialog({
  college,
  cities,
  categories,
  defaultCity,
  defaultCollegeCategoryId,
  trigger,
}: {
  college?: CollegeDTO;
  cities: CityOptionDTO[];
  categories: CollegeCategoryDTO[];
  defaultCity?: string;
  defaultCollegeCategoryId?: string;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(college);

  function buildDefaults(): CollegeFormInput {
    return {
      city: college?.city ?? defaultCity ?? "",
      collegeCategoryId: college?.collegeCategoryId ?? defaultCollegeCategoryId ?? "",
      name: college?.name ?? "",
      nirfRank: college?.nirfRank ?? "",
      active: college?.active ?? true,
    };
  }

  const form = useForm<CollegeFormInput>({
    resolver: zodResolver(collegeFormSchema) as Resolver<CollegeFormInput>,
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    if (open) form.reset(buildDefaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: CollegeFormInput) {
    setIsSubmitting(true);
    try {
      const payload = { ...values, nirfRank: values.nirfRank === "" ? null : values.nirfRank };
      if (isEdit) {
        await api.patch(`/api/admin/colleges/${college!.id}`, payload);
      } else {
        await api.post("/api/admin/colleges", payload);
      }
      emitRefresh();
      toast.success(isEdit ? "College updated" : "College added");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Add college
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit college" : "Add college"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="collegeCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>College category</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>College name</FormLabel>
                  <FormControl>
                    <Input placeholder="IIT Bombay" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nirfRank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIRF rank (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="e.g. 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEdit && (
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="border-border/60 flex flex-row items-center justify-between rounded-xl border px-4 py-3">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Add college"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
