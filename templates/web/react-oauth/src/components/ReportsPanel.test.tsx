import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const usePermissions = vi.fn();
const apiFetch = vi.fn();

vi.mock("@seamless-auth/react", () => ({
  usePermissions: () => usePermissions(),
}));

vi.mock("../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/api")>()),
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const { default: ReportsPanel } = await import("./ReportsPanel");

function holding(...permissions: string[]) {
  usePermissions.mockReturnValue({
    loading: false,
    hasPermission: (required: string) => permissions.includes(required),
  });
}

describe("ReportsPanel", () => {
  beforeEach(() => {
    usePermissions.mockReset();
    apiFetch.mockReset();
  });

  it("asks the API for nothing without reports:read", () => {
    holding("invoices:read");

    render(<ReportsPanel />);

    expect(screen.getByText(/so the reports stay hidden/)).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("lists the reports for a holder of reports:read", async () => {
    holding("reports:read");
    apiFetch.mockResolvedValue({
      reports: [{ id: "weekly-signups", title: "Weekly sign-ups" }],
    });

    render(<ReportsPanel />);

    expect(await screen.findByText("Weekly sign-ups")).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith("/reports");
  });
});
