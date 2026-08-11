import { z } from "zod";

export const appointmentSchema = z
  .object({
    customerId: z.string().uuid(),
    vehicleId: z.string().uuid(),
    technicianId: z
      .string()
      .uuid()
      .optional()
      .or(z.literal(""))
      .transform((value) => value || null),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    notes: z
      .string()
      .trim()
      .max(4000)
      .transform((value) => value || null),
    serviceIds: z.array(z.string().uuid()).min(1, "Select at least one requested service."),
    revision: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce.number().int().positive().optional(),
    ),
    overrideConflict: z.literal("true").optional(),
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    message: "End time must be after start time.",
    path: ["endsAt"],
  });

export function canTransitionAppointment(from: string, to: string) {
  return (
    (from === "scheduled" && ["checked_in", "cancelled", "no_show"].includes(to)) ||
    (from === "checked_in" && ["in_progress", "cancelled", "no_show"].includes(to)) ||
    (from === "in_progress" && ["completed", "cancelled"].includes(to))
  );
}
