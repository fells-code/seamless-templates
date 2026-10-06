import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EnrollPasskey from "./EnrollPasskey";

const registerPasskey = vi.fn();
const refreshSession = vi.fn();
const navigate = vi.fn();
let passkeySupported = true;

vi.mock("@seamless-auth/react", () => ({
  useAuth: () => ({ refreshSession }),
  useAuthClient: () => ({ registerPasskey }),
  usePasskeySupport: () => ({ passkeySupported, loading: false }),
  isUnauthenticated: (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    (error as { status?: number }).status === 401,
}));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <EnrollPasskey />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  registerPasskey.mockReset();
  refreshSession.mockReset();
  navigate.mockReset();
  passkeySupported = true;
});

describe("EnrollPasskey", () => {
  it("registers a passkey and continues into the app", async () => {
    registerPasskey.mockResolvedValue({ data: { credentialId: "cred" } });

    renderPage();
    fireEvent.click(screen.getByText("Add a passkey"));

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/", { replace: true }),
    );
    expect(registerPasskey).toHaveBeenCalledWith({
      metadata: expect.objectContaining({ friendlyName: expect.any(String) }),
    });
    expect(refreshSession).toHaveBeenCalled();
  });

  it("stays on the page and explains a failed registration", async () => {
    registerPasskey.mockResolvedValue({ error: { status: 400 } });

    renderPage();
    fireEvent.click(screen.getByText("Add a passkey"));

    expect(
      await screen.findByText(/The passkey was not saved/),
    ).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("asks the user to sign in again when the session has expired", async () => {
    registerPasskey.mockResolvedValue({ error: { status: 401 } });

    renderPage();
    fireEvent.click(screen.getByText("Add a passkey"));

    expect(await screen.findByText(/Sign in again/)).toBeInTheDocument();
  });

  it("lets the user continue without a passkey", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Not now"));

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/", { replace: true }),
    );
    expect(registerPasskey).not.toHaveBeenCalled();
  });

  it("does not offer enrollment on a browser without passkey support", () => {
    passkeySupported = false;

    renderPage();

    expect(screen.getByText("Add a passkey").closest("button")).toBeDisabled();
    expect(screen.getByText(/cannot create passkeys/)).toBeInTheDocument();
  });
});
