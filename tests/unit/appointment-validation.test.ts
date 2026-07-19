import { describe, expect, it } from "vitest";
import { canTransitionAppointment, appointmentSchema } from "@/features/appointments/validation";

const id = "00000000-0000-4000-8000-000000000000";
describe("appointment scheduling rules", () => {
  it("uses absolute ISO timestamps and rejects invalid ranges", () => {
    expect(appointmentSchema.safeParse({ customerId:id, vehicleId:id, technicianId:"", startsAt:"2026-07-20T04:30:00.000Z", endsAt:"2026-07-20T05:30:00.000Z", notes:"", serviceIds:[id] }).success).toBe(true);
    expect(appointmentSchema.safeParse({ customerId:id, vehicleId:id, technicianId:"", startsAt:"2026-07-20T05:30:00.000Z", endsAt:"2026-07-20T04:30:00.000Z", notes:"", serviceIds:[id] }).success).toBe(false);
  });
  it("allows only the approved status transitions", () => {
    expect(canTransitionAppointment("scheduled", "checked_in")).toBe(true);
    expect(canTransitionAppointment("scheduled", "completed")).toBe(false);
    expect(canTransitionAppointment("in_progress", "completed")).toBe(true);
    expect(canTransitionAppointment("completed", "scheduled")).toBe(false);
  });
});
