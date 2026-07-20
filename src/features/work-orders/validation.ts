import { z } from "zod";

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || null);

export const workOrderSchema = z.object({
  customerId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  technicianId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
  concern: optionalText(4000),
  internalNotes: optionalText(8000),
  estimatedCompletionAt: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
  mileage: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),
  serviceIds: z.array(z.string().uuid()).min(1, "Select at least one service."),
});

export function canTransitionWorkOrder(
  role: "admin" | "front_desk" | "technician",
  from: string,
  to: string,
) {
  if (role === "technician")
    return (
      (from === "assigned" && to === "in_progress") || (from === "in_progress" && to === "ready_for_review")
    );
  return (
    (from === "draft" && ["assigned", "cancelled"].includes(to)) ||
    (from === "assigned" && ["in_progress", "cancelled"].includes(to)) ||
    (from === "in_progress" && ["ready_for_review", "cancelled"].includes(to)) ||
    (from === "ready_for_review" && ["completed", "cancelled"].includes(to)) ||
    (from === "completed" && to === "invoiced")
  );
}
