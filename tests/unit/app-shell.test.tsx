import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getNavigationForRole } from "@/components/app-shell/navigation";
import { ConfirmDialog, EmptyState, StatusBadge } from "@/components/operational";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
}));
vi.mock("@/features/auth/actions", () => ({ signOut: vi.fn() }));
describe("authenticated UI foundation", () => {
  it("limits navigation visibility by staff role", () => {
    expect(getNavigationForRole("admin").map((item) => item.href)).toEqual([
      "/dashboard",
      "/customers",
      "/appointments",
      "/inventory",
      "/reports",
      "/work-orders",
      "/services",
      "/staff",
    ]);
    expect(getNavigationForRole("front_desk").map((item) => item.href)).toEqual([
      "/dashboard",
      "/customers",
      "/appointments",
      "/inventory",
      "/reports",
      "/work-orders",
      "/services",
    ]);
    expect(getNavigationForRole("technician").map((item) => item.href)).toEqual(["/dashboard", "/my-work"]);
  });
  it("renders shared status and empty states", () => {
    render(
      <>
        <StatusBadge status="scheduled" />
        <EmptyState description="Create a record to begin." title="Nothing here yet" />
      </>,
    );
    expect(screen.getByText("scheduled")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Nothing here yet" })).toBeVisible();
  });
  it("supports keyboard dismissal in confirmation dialogs", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        confirmLabel="Deactivate"
        description="This removes access."
        onClose={onClose}
        onConfirm={vi.fn()}
        open
        title="Deactivate staff"
      />,
    );
    expect(screen.getByRole("alertdialog")).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("opens and closes the mobile navigation menu", async () => {
    const { AppShell } = await import("@/components/app-shell/app-shell");
    const user = (await import("@testing-library/user-event")).default.setup();
    render(
      <AppShell staff={{ display_name: "Sam Lee", email: "sam@example.com", role: "admin" }}>
        <p>Content</p>
      </AppShell>,
    );
    await user.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(screen.getByRole("dialog", { name: "Navigation menu" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Close navigation menu" }));
    expect(screen.queryByRole("dialog", { name: "Navigation menu" })).not.toBeInTheDocument();
  });

  it("persists the selected display mode", async () => {
    const { ThemeToggle } = await import("@/components/theme-toggle");
    const user = (await import("@testing-library/user-event")).default.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("autocare-theme")).toBe("dark");
  });
});
