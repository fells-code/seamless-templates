import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import Navbar from "./Navbar";
import { SHELL_NAMES } from "./kit";

// The conformance suite in seamless-cli signs out by accessible name: it clicks
// "Open account menu" and then "Logout". Those two names are a cross-repo
// contract, so they are asserted here rather than only in that suite, where a
// rename shows up as a browser timeout in another repository's CI. Every shell
// has to honour it, which is why the contract runs over all of them.
const logout = vi.fn();

vi.mock("@seamless-auth/react", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    logout,
    user: { email: "climber@example.com", roles: [] },
  }),
}));

function renderNavbar(shell?: string) {
  if (shell) document.documentElement.dataset.shell = shell;
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
}

afterEach(() => {
  delete document.documentElement.dataset.shell;
  logout.mockClear();
});

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

  it.each(SHELL_NAMES)("signs out the same way in the %s shell", (shell) => {
    renderNavbar(shell);

    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(logout).toHaveBeenCalled();
  });

  it.each(SHELL_NAMES)("reaches every screen in the %s shell", (shell) => {
    renderNavbar(shell);

    /*
     * Whatever the nav is carrying, rather than the names this template happens
     * to ship with.
     *
     * This suite runs again inside every application scaffolded from the
     * starter, and the first thing a scaffold does is take the demo pages out
     * and put the application's own screens in. A test naming "About" passes
     * here and fails in every generated application, which turns the starter's
     * own suite from a correctness oracle into a false alarm.
     */
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href");
    }

    // Home is the one link every arrangement of this component keeps.
    expect(
      screen.getAllByRole("link", { name: "Home" }).length,
    ).toBeGreaterThan(0);
  });

  it("opens the phone drawer from the bar", () => {
    renderNavbar();

    expect(
      screen.queryByRole("button", { name: "Close navigation" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

    expect(
      screen.getAllByRole("button", { name: "Close navigation" }).length,
    ).toBeGreaterThan(0);
  });

  it("marks a screen with its icon where one is given", () => {
    // The rail shell cannot exist without them: a column four and a half rem
    // wide has room for a mark and nothing else. Everywhere else the icon takes
    // the marker's place, so a nav with icons and one without line their labels
    // up in the same position.
    const { container } = renderNavbar("rail");
    expect(container.querySelector(".nav-glyph")).not.toBeNull();
  });

  it("falls back to the sidebar when the shell is one it does not have", () => {
    const { container } = renderNavbar("hamburger");

    expect(container.querySelector("aside.shell-column")).not.toBeNull();
  });
});
