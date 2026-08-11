import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { minorUnitsToMoneyInput, moneyInputToMinorUnits } from "@/lib/money";

describe("cn", () => {
  it("merges conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4", "text-sm")).toBe("px-4 text-sm");
  });

  it("formats stored minor units without changing financial value", () => {
    expect(formatMoney(50000)).toContain("500");
    expect(formatMoney(50000)).not.toContain(".00");
    expect(formatMoney(1)).toContain("0.01");
  });

  it("converts staff-entered whole or decimal amounts without floating-point rounding", () => {
    expect(moneyInputToMinorUnits("500")).toBe(50000);
    expect(moneyInputToMinorUnits("500.5")).toBe(50050);
    expect(moneyInputToMinorUnits("500.555")).toBeNull();
    expect(minorUnitsToMoneyInput(50000)).toBe("500");
    expect(minorUnitsToMoneyInput(50050)).toBe("500.5");
  });
});
