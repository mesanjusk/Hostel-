import { useEffect, useState, type ReactNode } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { getProductIcon, PRODUCT_ICON_NAMES } from "@/lib/product-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { DEFAULT_CHECKLIST_CATEGORIES } from "@/types";
import type { AdminProductDTO } from "@/features/admin/product-dto";

const NONE_VALUE = "__none__";

const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  icon: z.string().trim().max(40).optional().or(z.literal("")),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  category: z.enum(DEFAULT_CHECKLIST_CATEGORIES),
  store: z.string().trim().min(1).max(80),
  price: z.coerce.number().min(0),
  discountPercent: z.coerce.number().min(0).max(100),
  rating: z.coerce.number().min(0).max(5),
  pros: z.array(z.string().trim().min(1)),
  cons: z.array(z.string().trim().min(1)),
  buyLinks: z.object({
    amazon: z.string().trim().url().optional().or(z.literal("")),
    flipkart: z.string().trim().url().optional().or(z.literal("")),
    myntra: z.string().trim().url().optional().or(z.literal("")),
    decathlon: z.string().trim().url().optional().or(z.literal("")),
    local: z.string().trim().url().optional().or(z.literal("")),
  }),
  budgetAlternative: z.string().optional().nullable(),
  premiumAlternative: z.string().optional().nullable(),
  featured: z.boolean(),
});

type ProductInput = z.infer<typeof productSchema>;

function toLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

interface ProductFormDialogProps {
  product?: AdminProductDTO;
  products: AdminProductDTO[];
  trigger?: ReactNode;
}

export function ProductFormDialog({ product, products, trigger }: ProductFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(product);

  function buildDefaults(): ProductInput {
    return {
      name: product?.name ?? "",
      icon: product?.icon ?? "",
      imageUrl: product?.imageUrl ?? "",
      category: product?.category ?? DEFAULT_CHECKLIST_CATEGORIES[0],
      store: product?.store ?? "",
      price: product?.price ?? 0,
      discountPercent: product?.discountPercent ?? 0,
      rating: product?.rating ?? 4,
      pros: product?.pros ?? [],
      cons: product?.cons ?? [],
      buyLinks: {
        amazon: product?.buyLinks.amazon ?? "",
        flipkart: product?.buyLinks.flipkart ?? "",
        myntra: product?.buyLinks.myntra ?? "",
        decathlon: product?.buyLinks.decathlon ?? "",
        local: product?.buyLinks.local ?? "",
      },
      budgetAlternative: product?.budgetAlternative ?? null,
      premiumAlternative: product?.premiumAlternative ?? null,
      featured: product?.featured ?? false,
    };
  }

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as Resolver<ProductInput>,
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    if (open) form.reset(buildDefaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: ProductInput) {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/api/admin/products/${product!.id}`, values);
      } else {
        await api.post("/api/admin/products", values);
      }
      emitRefresh();
      toast.success(isEdit ? "Product updated" : "Product added");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const alternativeOptions = products.filter((p) => p.id !== product?.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Add product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Compact study lamp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEFAULT_CHECKLIST_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
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
                  name="store"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store</FormLabel>
                      <FormControl>
                        <Input placeholder="Amazon" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    {/* The sentinel only exists to give the "no icon" row a non-empty value
                        (Radix forbids an empty SelectItem value) — it must never reach the
                        API, so it's mapped back to "" here. */}
                    <Select
                      value={field.value || NONE_VALUE}
                      onValueChange={(v) => field.onChange(v === NONE_VALUE ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Default (shopping bag)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>Default (shopping bag)</SelectItem>
                        {PRODUCT_ICON_NAMES.map((name) => {
                          const Icon = getProductIcon(name);
                          return (
                            <SelectItem key={name} value={name}>
                              {/* SelectItem renders children inside ItemText, which isn't a
                                  flex container — and preflight makes svg display:block, so
                                  without this wrapper the icon sits above its label. */}
                              <span className="flex items-center gap-2">
                                <Icon className="size-4" />
                                {name}
                              </span>
                            </SelectItem>
                          );
                        })}
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
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount %</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (0-5)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pros (one per line)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          value={field.value?.join("\n") ?? ""}
                          onChange={(e) => field.onChange(toLines(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cons (one per line)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          value={field.value?.join("\n") ?? ""}
                          onChange={(e) => field.onChange(toLines(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <p className="text-muted-foreground text-sm font-medium">Buy links</p>
              <div className="grid grid-cols-2 gap-3">
                {(["amazon", "flipkart", "myntra", "decathlon", "local"] as const).map((key) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={`buyLinks.${key}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs capitalize">{key}</FormLabel>
                        <FormControl>
                          <Input placeholder="https://…" {...field} value={field.value ?? ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="budgetAlternative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget alternative</FormLabel>
                      <Select
                        value={field.value ?? NONE_VALUE}
                        onValueChange={(v) => field.onChange(v === NONE_VALUE ? null : v)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>None</SelectItem>
                          {alternativeOptions.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="premiumAlternative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Premium alternative</FormLabel>
                      <Select
                        value={field.value ?? NONE_VALUE}
                        onValueChange={(v) => field.onChange(v === NONE_VALUE ? null : v)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>None</SelectItem>
                          {alternativeOptions.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                    <FormLabel>Feature this product</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  {isEdit ? "Save changes" : "Add product"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
