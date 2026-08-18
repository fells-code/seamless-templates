import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Navbar from "./Navbar";

// The conformance suite in seamless-cli signs out by accessible name: it clicks
// "Open account menu" and then "Logout". Those two names are a cross-repo
// contract, so they are asserted here rather than only in that suite, where a
// rename shows up as a browser timeout in another repository's CI.
const logout = vi.fn();

vi.mock("@seamless-auth/react", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    logout,
    user: { email: "climber@example.com", roles: [] },
  }),
}));

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
}

describe("Navbar", () => {
  it("signs out through the account menu", () => {
    renderNavbar();

    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(logout).toHaveBeenCalled();
  });

  it("keeps the sign-out control behind the menu until it is opened", () => {
    renderNavbar();

    expect(
      screen.queryByRole("button", { name: "Logout" }),
    ).not.toBeInTheDocument();
  });
});
