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
  cost: z.number().int().min(0).nullable(),
  selling: z.number().int().min(0),
});
export const stockAdjustmentSchema = z.object({
  partId: z.string().uuid(),
  mode: z.enum(["restock", "correction"]),
  quantity: z.coerce.number().finite(),
  reason: z.string().trim().max(500),
});
export function isLowStock(quantity: number, threshold: number) {
  return quantity <= threshold;
}
