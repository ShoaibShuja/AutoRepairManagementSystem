import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

describe("cn", () => {
  it("merges conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4", "text-sm")).toBe("px-4 text-sm");
  });

  it("formats stored minor units without changing financial value", () => {
    expect(formatMoney(50000)).toContain("500.00");
    expect(formatMoney(1)).toContain("0.01");
  });
});
