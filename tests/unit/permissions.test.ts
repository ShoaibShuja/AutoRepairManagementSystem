import { canAccessStaffWorkspace, canManageStaff, hasAnyRole } from "@/lib/auth/permissions";
import { describe, expect, it } from "vitest";

describe("staff permissions", () => {
  it("allows only administrators to manage staff", () => {
    expect(canManageStaff("admin")).toBe(true);
    expect(canManageStaff("front_desk")).toBe(false);
    expect(canManageStaff("technician")).toBe(false);
  });

  it("does not treat an inactive staff profile as an application user", () => {
    expect(canAccessStaffWorkspace("technician", "inactive")).toBe(false);
    expect(canAccessStaffWorkspace("technician", "active")).toBe(true);
  });

  it("keeps technician roles outside administrator-only checks", () => {
    expect(hasAnyRole("technician", ["admin"])).toBe(false);
  });
});
