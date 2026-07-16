import { z } from "zod";

export const bagNameSchema = z.string().trim().min(1, "Bag name is required").max(60);

export const bagColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #7C9CF2");

// Same convention as checklist items' photo field: client-compressed base64 data URI, or a
// plain https URL. Nullable (rather than just optional) so a bag's photo can be cleared.
export const bagImageSchema = z
  .string()
  .trim()
  .max(200_000, "Image is too large")
  .refine((val) => val === "" || val.startsWith("data:image/") || /^https?:\/\//i.test(val), {
    message: "Image must be a photo or a valid URL",
  })
  .nullable();

export const createBagSchema = z.object({
  name: bagNameSchema,
  color: bagColorSchema.optional(),
});

export const updateBagSchema = z.object({
  id: z.string().min(1),
  name: bagNameSchema.optional(),
  color: bagColorSchema.optional(),
  imageUrl: bagImageSchema.optional(),
});

export type CreateBagInput = z.infer<typeof createBagSchema>;
export type UpdateBagInput = z.infer<typeof updateBagSchema>;
