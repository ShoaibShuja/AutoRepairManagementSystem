import { describe, expect, it } from "vitest";
import { isLowStock, partSchema } from "@/features/inventory/validation";
describe("inventory rules", () => {
  it("accepts a valid initial part and identifies low stock at its threshold", () => {
    expect(
      partSchema.safeParse({
        name: "Oil filter",
        sku: "OF-1",
        category: "Filters",
        unit: "each",
        quantity: "10",
        threshold: "3",
        cost: "100",
        selling: "200",
      }).success,
    ).toBe(true);
    expect(isLowStock(3, 3)).toBe(true);
    expect(isLowStock(4, 3)).toBe(false);
  });
  it("rejects negative stock and invalid prices", () => {
    expect(
      partSchema.safeParse({
        name: "Oil",
        sku: "",
        category: "",
        unit: "each",
        quantity: "-1",
        threshold: "0",
        cost: "",
        selling: "0",
      }).success,
    ).toBe(false);
  });
});
