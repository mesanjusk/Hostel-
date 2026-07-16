import { useEffect, useState, type ReactNode } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { CHECKLIST_GENDER_OPTIONS, CHECKLIST_PRIORITIES, PLAN_TYPES, STORE_OPTIONS } from "@/types";
import type { CollegeCategoryDTO, CourseDTO } from "@/features/auth/college-taxonomy-dto";
import type { DefaultChecklistItemDTO } from "@/features/admin/default-checklist-item-dto";

const itemFormSchema = z.object({
  category: z.string().trim().min(1, "Category is required").max(60),
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  priority: z.enum(CHECKLIST_PRIORITIES),
  planType: z.enum(PLAN_TYPES).optional().or(z.literal("")),
  estimatedPrice: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  recommendedBrand: z.string().trim().max(80).optional().or(z.literal("")),
  recommendedStore: z.enum(STORE_OPTIONS).optional().or(z.literal("")),
  purchaseLink: z.string().trim().url().optional().or(z.literal("")),
  gender: z.enum(CHECKLIST_GENDER_OPTIONS),
  isForAllCollegeCategories: z.boolean(),
  applicableCollegeCategories: z.array(z.string()),
  isForAllCourses: z.boolean(),
  applicableCourses: z.array(z.string()),
  active: z.boolean(),
});

type ItemFormInput = z.infer<typeof itemFormSchema>;

export function DefaultChecklistItemFormDialog({
  item,
  categories,
  courses,
  trigger,
}: {
  item?: DefaultChecklistItemDTO;
  categories: CollegeCategoryDTO[];
  courses: CourseDTO[];
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(item);

  function buildDefaults(): ItemFormInput {
    return {
      category: item?.category ?? "",
      title: item?.title ?? "",
      description: item?.description ?? "",
      priority: item?.priority ?? "medium",
      planType: item?.planType ?? "",
      estimatedPrice: item?.estimatedPrice ?? "",
      recommendedBrand: item?.recommendedBrand ?? "",
      recommendedStore: item?.recommendedStore ?? "",
      purchaseLink: item?.purchaseLink ?? "",
      gender: item?.gender ?? "All",
      isForAllCollegeCategories: item?.isForAllCollegeCategories ?? true,
      applicableCollegeCategories: item?.applicableCollegeCategories ?? [],
      isForAllCourses: item?.isForAllCourses ?? true,
      applicableCourses: item?.applicableCourses ?? [],
      active: item?.active ?? true,
    };
  }

  const form = useForm<ItemFormInput>({
    resolver: zodResolver(itemFormSchema) as Resolver<ItemFormInput>,
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    if (open) form.reset(buildDefaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isForAllCollegeCategories = form.watch("isForAllCollegeCategories");
  const isForAllCourses = form.watch("isForAllCourses");
  const selectedCategoryIds = form.watch("applicableCollegeCategories");
  const coursesInScope = isForAllCollegeCategories
    ? courses
    : courses.filter((c) => selectedCategoryIds.includes(c.collegeCategoryId));

  async function onSubmit(values: ItemFormInput) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        estimatedPrice: values.estimatedPrice === "" ? null : values.estimatedPrice,
        recommendedStore: values.recommendedStore === "" ? null : values.recommendedStore,
        planType: values.planType === "" ? null : values.planType,
      };
      if (isEdit) {
        await api.patch(`/api/admin/default-checklist-items/${item!.id}`, payload);
      } else {
        await api.post("/api/admin/default-checklist-items", payload);
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
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Add item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit checklist item" : "Add checklist item"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Documents" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="ID Proof" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHECKLIST_PRIORITIES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
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
                name="estimatedPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="planType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pack it / Plan it</FormLabel>
                  <FormControl>
                    <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Unset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unset</SelectItem>
                        {PLAN_TYPES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p === "pack" ? "Pack it" : "Plan it"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="recommendedBrand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommended brand</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recommendedStore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommended store</FormLabel>
                    <FormControl>
                      <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {STORE_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purchaseLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase link</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHECKLIST_GENDER_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
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
              name="isForAllCollegeCategories"
              render={({ field }) => (
                <FormItem className="border-border/60 flex flex-row items-center justify-between rounded-xl border px-4 py-3">
                  <FormLabel>All college categories</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {!isForAllCollegeCategories && (
              <FormField
                control={form.control}
                name="applicableCollegeCategories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicable college categories</FormLabel>
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 p-3">
                      {categories.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={field.value.includes(c.id)}
                            onCheckedChange={(checked) => {
                              field.onChange(
                                checked ? [...field.value, c.id] : field.value.filter((id) => id !== c.id),
                              );
                            }}
                          />
                          {c.name}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isForAllCourses"
              render={({ field }) => (
                <FormItem className="border-border/60 flex flex-row items-center justify-between rounded-xl border px-4 py-3">
                  <FormLabel>All courses</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {!isForAllCourses && (
              <FormField
                control={form.control}
                name="applicableCourses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicable courses</FormLabel>
                    {coursesInScope.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Pick college categories first, or select "All courses".</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 p-3">
                        {coursesInScope.map((c) => (
                          <label key={c.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={field.value.includes(c.id)}
                              onCheckedChange={(checked) => {
                                field.onChange(
                                  checked ? [...field.value, c.id] : field.value.filter((id) => id !== c.id),
                                );
                              }}
                            />
                            {c.name}
                          </label>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                {isEdit ? "Save changes" : "Add item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
