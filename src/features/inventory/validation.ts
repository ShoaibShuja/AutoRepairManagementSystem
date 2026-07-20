import { z } from "zod";
export const partSchema = z.object({
  name: z.string().trim().min(2).max(160),
  sku: z
    .string()
    .trim()
    .max(80)
    .transform((value) => value || null),
  category: z
    .string()
    .trim()
    .max(80)
    .transform((value) => value || null),
  unit: z.string().trim().min(1).max(30),
  quantity: z.coerce.number().min(0),
  threshold: z.coerce.number().min(0),
  cost: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),
  selling: z.coerce.number().int().min(0),
});
export function isLowStock(quantity: number, threshold: number) {
  return quantity <= threshold;
}
