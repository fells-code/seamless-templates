import { StrictMode } from "react";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import VerifyMagicLink from "./VerifyMagicLink";

const router = { replace: vi.fn(), refresh: vi.fn() };
const client = { verifyMagicLink: vi.fn(), checkMagicLink: vi.fn() };
const auth = { refreshSession: vi.fn() };
const posted: unknown[] = [];

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@seamless-auth/react", () => ({
  useAuth: () => auth,
  useAuthClient: () => client,
}));

class FakeChannel {
  postMessage(message: unknown) {
    posted.push(message);
  }
  close() {}
}

describe("VerifyMagicLink", () => {
  beforeEach(() => {
    vi.stubGlobal("BroadcastChannel", FakeChannel);
    posted.length = 0;
    router.replace.mockReset();
    client.verifyMagicLink.mockReset();
    client.checkMagicLink
      .mockReset()
      .mockResolvedValue({ data: { message: "Success" }, error: null });
    auth.refreshSession
      .mockReset()
      .mockResolvedValue({ data: {}, error: null });
  });

  // Strict Mode runs effects twice in development. The link is single use, so
  // a second request answers "already used", and treating that as the outcome
  // turned every development sign-in by link into a failure.
  it("spends the token once under Strict Mode and signs in", async () => {
    client.verifyMagicLink.mockResolvedValue({ data: {}, error: null });

    await act(async () => {
      render(
        <StrictMode>
          <VerifyMagicLink token="token-1" />
        </StrictMode>,
      );
    });

    expect(client.verifyMagicLink).toHaveBeenCalledTimes(1);
    expect(client.checkMagicLink).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/session");
    expect(posted).toEqual([{ type: "MAGIC_LINK_AUTH_SUCCESS" }]);
  });

  // Opened on another device there is no pre-auth cookie here, so nothing to
  // collect: the device that asked signs in, and this one must not pretend to.
  it("sends the reader back to the device that asked when no session lands here", async () => {
    client.verifyMagicLink.mockResolvedValue({ data: {}, error: null });
    client.checkMagicLink.mockResolvedValue({
      data: null,
      error: Object.assign(new Error("unauthenticated"), { status: 401 }),
    });
    auth.refreshSession.mockResolvedValue({
      data: null,
      error: Object.assign(new Error("unauthenticated"), { status: 401 }),
    });

    await act(async () => {
      render(<VerifyMagicLink token="token-1" />);
    });

    expect(screen.getByText("You are verified")).toBeInTheDocument();
    expect(posted).toEqual([{ type: "MAGIC_LINK_AUTH_SUCCESS" }]);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("says so when the link has been used or has expired", async () => {
    client.verifyMagicLink.mockResolvedValue({
      data: null,
      error: new Error("used"),
    });

    await act(async () => {
      render(<VerifyMagicLink token="token-1" />);
    });

    expect(screen.getByText("This link did not work")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("fails without a token, asking nothing", () => {
    render(<VerifyMagicLink />);

    expect(screen.getByText("This link did not work")).toBeInTheDocument();
    expect(client.verifyMagicLink).not.toHaveBeenCalled();
  });
});
