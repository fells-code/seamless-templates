import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SignIn from "./SignIn";

const ok = <T,>(data: T) => ({ data, error: null });
const failed = { data: null, error: new Error("failed") };

const router = { replace: vi.fn(), refresh: vi.fn() };
const auth = {
  login: vi.fn(),
  handlePasskeyLogin: vi.fn(),
  registerPasskey: vi.fn(),
  refreshSession: vi.fn(),
};
const client = {
  register: vi.fn(),
  requestLoginEmailOtp: vi.fn(),
  requestLoginPhoneOtp: vi.fn(),
  verifyLoginEmailOtp: vi.fn(),
  verifyLoginPhoneOtp: vi.fn(),
  verifyEmailOtp: vi.fn(),
  requestMagicLink: vi.fn(),
  checkMagicLink: vi.fn(),
};
let passkeySupported = true;

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@seamless-auth/react", () => ({
  useAuth: () => auth,
  useAuthClient: () => client,
  usePasskeySupport: () => ({ passkeySupported }),
}));

class FakeChannel {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage() {}
  close() {}
}

async function submitIdentifier(value = "ada@example.com") {
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value },
  });
  await act(async () => {
    fireEvent.submit(screen.getByLabelText(/email/i).closest("form")!);
  });
}

async function submitCode(value = "123456") {
  fireEvent.change(screen.getByLabelText("Code"), { target: { value } });
  await act(async () => {
    fireEvent.submit(screen.getByLabelText("Code").closest("form")!);
  });
}

describe("SignIn", () => {
  beforeEach(() => {
    passkeySupported = true;
    vi.stubGlobal("BroadcastChannel", FakeChannel);
    for (const fn of [
      ...Object.values(router),
      ...Object.values(auth),
      ...Object.values(client),
    ]) {
      fn.mockReset();
    }
    auth.refreshSession.mockResolvedValue(ok({}));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("signs in with a passkey and goes where the visitor was headed", async () => {
    auth.login.mockResolvedValue(ok({ loginMethods: ["passkey"] }));
    auth.handlePasskeyLogin.mockResolvedValue(ok({}));
    render(<SignIn next="/beta" />);

    await submitIdentifier();

    expect(auth.login).toHaveBeenCalledWith("ada@example.com", true);
    expect(auth.refreshSession).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/beta");
  });

  it("offers the other methods when the passkey does not complete", async () => {
    auth.login.mockResolvedValue(
      ok({ loginMethods: ["passkey", "email_otp", "magic_link"] }),
    );
    auth.handlePasskeyLogin.mockResolvedValue(failed);
    render(<SignIn next="/session" />);

    await submitIdentifier();

    expect(screen.getByRole("alert")).toHaveTextContent(/passkey/i);
    expect(screen.getByText("Email me a code")).toBeInTheDocument();
    expect(screen.getByText("Email me a sign-in link")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("skips the passkey where the browser has none and signs in with an emailed code", async () => {
    passkeySupported = false;
    auth.login.mockResolvedValue(
      ok({ loginMethods: ["passkey", "email_otp"] }),
    );
    client.requestLoginEmailOtp.mockResolvedValue(ok({}));
    client.verifyLoginEmailOtp.mockResolvedValue(ok({}));
    render(<SignIn next="/session" />);

    await submitIdentifier();
    expect(auth.handlePasskeyLogin).not.toHaveBeenCalled();
    expect(screen.queryByText("Use a passkey")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText("Email me a code"));
    });
    await submitCode();

    expect(client.verifyLoginEmailOtp).toHaveBeenCalledWith("123456");
    expect(router.replace).toHaveBeenCalledWith("/session");
  });

  it("keeps the code screen open when the code does not match", async () => {
    passkeySupported = false;
    auth.login.mockResolvedValue(ok({ loginMethods: ["email_otp"] }));
    client.requestLoginEmailOtp.mockResolvedValue(ok({}));
    client.verifyLoginEmailOtp.mockResolvedValue(failed);
    render(<SignIn next="/session" />);

    await submitIdentifier();
    await act(async () => {
      fireEvent.click(screen.getByText("Email me a code"));
    });
    await submitCode("000000");

    expect(screen.getByRole("alert")).toHaveTextContent(/did not match/);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("creates an account, verifies the email, and offers a passkey", async () => {
    client.register.mockResolvedValue(ok({ message: "Success" }));
    client.verifyEmailOtp.mockResolvedValue(ok({}));
    auth.registerPasskey.mockResolvedValue(ok({}));
    render(<SignIn next="/session" />);

    fireEvent.click(screen.getByText("Create an account"));
    await submitIdentifier("grace@example.com");
    expect(client.register).toHaveBeenCalledWith({
      email: "grace@example.com",
    });

    await submitCode();
    expect(client.verifyEmailOtp).toHaveBeenCalledWith("123456");
    expect(router.replace).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Add a passkey" }));
    });

    expect(auth.registerPasskey).toHaveBeenCalledWith(
      expect.objectContaining({ friendlyName: expect.any(String) }),
    );
    expect(router.replace).toHaveBeenCalledWith("/session");
  });

  it("waits for the magic link to be used before finishing", async () => {
    vi.useFakeTimers();
    passkeySupported = false;
    auth.login.mockResolvedValue(ok({ loginMethods: ["magic_link"] }));
    client.requestMagicLink.mockResolvedValue(ok({}));
    // 204 while the link is unused, then Success.
    client.checkMagicLink
      .mockResolvedValueOnce(ok(undefined))
      .mockResolvedValueOnce(ok({ message: "Success" }));
    render(<SignIn next="/session" />);

    await submitIdentifier();
    await act(async () => {
      fireEvent.click(screen.getByText("Email me a sign-in link"));
    });
    expect(screen.getByText(/We emailed a sign-in link/)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(router.replace).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(router.replace).toHaveBeenCalledWith("/session");
    expect(router.replace).toHaveBeenCalledTimes(1);
  });
});
