import { describe, expect, it } from "vitest";
import {
  customerSchema,
  normalizePhone,
  normalizePlate,
  serviceSchema,
  vehicleSchema,
} from "@/features/crm/validation";
describe("CRM validation", () => {
  it("normalizes phone and plates", () => {
    expect(normalizePhone("+93 (700) 123-456")).toBe("+93700123456");
    expect(normalizePlate("ab-12 34")).toBe("AB1234");
  });
  it("accepts shared customer phones and valid vehicle ownership input", () => {
    expect(
      customerSchema.safeParse({
        fullName: "Amina Khan",
        phone: "+93700123456",
        email: "",
        address: "",
        notes: "",
      }).success,
    ).toBe(true);
    expect(
      vehicleSchema.safeParse({
        customerId: "00000000-0000-4000-8000-000000000000",
        plateNumber: "AB-12",
        make: "Toyota",
        model: "Corolla",
        modelYear: "2020",
        color: "White",
        vin: "",
        mileage: "12000",
        notes: "",
      }).success,
    ).toBe(true);
  });
  it("rejects invalid service prices and preserves snapshot contract in schema", () => {
    expect(
      serviceSchema.safeParse({
        name: "Wash",
        category: "wash",
        standardPriceMinor: "-1",
        defaultDurationMinutes: "60",
        description: "",
      }).success,
    ).toBe(false);
  });
});
