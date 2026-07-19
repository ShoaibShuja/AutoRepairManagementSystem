import { describe, expect, it } from "vitest";
import { canTransitionWorkOrder, workOrderSchema } from "@/features/work-orders/validation";

const id = "00000000-0000-4000-8000-000000000000";
describe("work-order validation and lifecycle", () => {
  it("requires customer/vehicle identifiers and at least one catalog service", () => {
    expect(workOrderSchema.safeParse({ customerId: id, vehicleId: id, technicianId: "", concern: "Noise", internalNotes: "", estimatedCompletionAt: "", mileage: "", serviceIds: [id] }).success).toBe(true);
    expect(workOrderSchema.safeParse({ customerId: id, vehicleId: id, technicianId: "", concern: "", internalNotes: "", estimatedCompletionAt: "", mileage: "", serviceIds: [] }).success).toBe(false);
  });
  it("allows technicians only their permitted transitions", () => {
    expect(canTransitionWorkOrder("technician", "assigned", "in_progress")).toBe(true);
    expect(canTransitionWorkOrder("technician", "ready_for_review", "completed")).toBe(false);
    expect(canTransitionWorkOrder("front_desk", "ready_for_review", "completed")).toBe(true);
    expect(canTransitionWorkOrder("front_desk", "draft", "completed")).toBe(false);
  });
});
