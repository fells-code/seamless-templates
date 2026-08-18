import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OAuthCallback from "./OAuthCallback";
import { OAUTH_PROVIDER_STORAGE_KEY } from "./Login";

// The SDK talks to the auth server, and the router owns navigation. Both are
// stubbed so these cases exercise only what this page decides: which message a
// failed callback shows, and where a successful one goes.
const finishOAuthLogin = vi.fn();
const navigate = vi.fn();

vi.mock("@seamless-auth/react", () => ({
  useAuth: () => ({ finishOAuthLogin }),
  getOAuthErrorCode: (error: unknown) =>
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code: string }).code
      : null,
}));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));

function renderCallback(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/oauth/callback${search}`]}>
      <OAuthCallback />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  finishOAuthLogin.mockReset();
  navigate.mockReset();
  sessionStorage.setItem(OAUTH_PROVIDER_STORAGE_KEY, "github");
});

afterEach(() => {
  sessionStorage.clear();
});

describe("OAuthCallback", () => {
  it("finishes the login and sends the user into the app", async () => {
    finishOAuthLogin.mockResolvedValue({});

    renderCallback("?code=abc&state=xyz");

    expect(finishOAuthLogin).toHaveBeenCalledWith({
      providerId: "github",
      code: "abc",
      state: "xyz",
    });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith("/"));
    expect(sessionStorage.getItem(OAUTH_PROVIDER_STORAGE_KEY)).toBeNull();
  });

  it("explains a provider that shared no email address", async () => {
    finishOAuthLogin.mockResolvedValue({
      error: { code: "oauth_missing_email" },
    });

    renderCallback("?code=abc&state=xyz");

    expect(
      await screen.findByText(/did not share an email address/),
    ).toBeInTheDocument();
  });

  it("keeps the generic message for an error code it does not recognize", async () => {
    finishOAuthLogin.mockResolvedValue({
      error: { code: "oauth_from_a_newer_api" },
    });

    renderCallback("?code=abc&state=xyz");

    expect(
      await screen.findByText(/could not complete sign-in/),
    ).toBeInTheDocument();
  });

  it("does not call the auth server when the callback is missing its parameters", async () => {
    renderCallback("?code=abc");

    expect(
      await screen.findByText(/missing required information/),
    ).toBeInTheDocument();
    expect(finishOAuthLogin).not.toHaveBeenCalled();
  });
});
