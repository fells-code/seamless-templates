import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import VerifyMagicLink from "./VerifyMagicLink";

const router = { replace: vi.fn(), refresh: vi.fn() };
const client: {
  verifyMagicLink: ReturnType<typeof vi.fn>;
  checkMagicLink: ReturnType<typeof vi.fn>;
  authorizedFetch: ReturnType<typeof vi.fn>;
  confirmMagicLink?: ReturnType<typeof vi.fn>;
} = {
  verifyMagicLink: vi.fn(),
  checkMagicLink: vi.fn(),
  authorizedFetch: vi.fn(),
};
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
    client.authorizedFetch.mockReset();
    delete client.confirmMagicLink;
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

  describe("when the link is opened on another device", () => {
    const requestedAt = "2026-10-16T14:05:00.000Z";

    beforeEach(() => {
      client.verifyMagicLink.mockResolvedValue({
        data: null,
        error: Object.assign(new Error("confirmation_required"), {
          status: 409,
          body: {
            error: "confirmation_required",
            message: "Confirm this sign-in.",
            requestedFrom: { deviceClass: "macos", requestedAt },
          },
        }),
      });
    });

    it("shows where and when the link was requested, without spending it", async () => {
      await act(async () => {
        render(<VerifyMagicLink token="token-1" />);
      });

      const when = new Date(requestedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
      expect(
        screen.getByText(`This link was requested from a Mac, ${when}.`, {
          exact: false,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Yes, sign in that device" }),
      ).toBeInTheDocument();
      expect(client.checkMagicLink).not.toHaveBeenCalled();
      expect(posted).toEqual([]);
      expect(router.replace).not.toHaveBeenCalled();
    });

    it("approves through the SDK and sends the reader back to the other device", async () => {
      client.confirmMagicLink = vi
        .fn()
        .mockResolvedValue({ data: { message: "Success" }, error: null });

      await act(async () => {
        render(<VerifyMagicLink token="token-1" />);
      });
      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: "Yes, sign in that device" }),
        );
      });

      expect(client.confirmMagicLink).toHaveBeenCalledWith("token-1");
      expect(client.authorizedFetch).not.toHaveBeenCalled();
      expect(screen.getByText("Sign-in approved")).toBeInTheDocument();
      expect(router.replace).not.toHaveBeenCalled();
    });

    it("falls back to the /auth route when the SDK has no confirmMagicLink", async () => {
      client.authorizedFetch.mockResolvedValue(
        new Response(JSON.stringify({ message: "Success" }), { status: 200 }),
      );

      await act(async () => {
        render(<VerifyMagicLink token="token/1" />);
      });
      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: "Yes, sign in that device" }),
        );
      });

      expect(client.authorizedFetch).toHaveBeenCalledWith(
        "/auth/magic-link/verify/token%2F1/confirm",
        { method: "POST" },
      );
      expect(screen.getByText("Sign-in approved")).toBeInTheDocument();
    });

    it("keeps the choice open when approving fails", async () => {
      client.confirmMagicLink = vi.fn().mockResolvedValue({
        data: null,
        error: Object.assign(new Error("expired"), { status: 400 }),
      });

      await act(async () => {
        render(<VerifyMagicLink token="token-1" />);
      });
      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: "Yes, sign in that device" }),
        );
      });

      expect(screen.getByRole("alert")).toHaveTextContent("That did not work");
      expect(
        screen.getByRole("button", { name: "Yes, sign in that device" }),
      ).toBeEnabled();
      expect(screen.queryByText("Sign-in approved")).not.toBeInTheDocument();
    });

    it("signs nothing in when the reader declines", async () => {
      client.confirmMagicLink = vi.fn();

      await act(async () => {
        render(<VerifyMagicLink token="token-1" />);
      });
      fireEvent.click(
        screen.getByRole("button", { name: "No, this wasn't me" }),
      );

      expect(screen.getByText("Nothing was signed in")).toBeInTheDocument();
      expect(screen.getByText(/ignore the email/)).toBeInTheDocument();
      expect(client.confirmMagicLink).not.toHaveBeenCalled();
      expect(client.authorizedFetch).not.toHaveBeenCalled();
    });

    it("names an automated client and tolerates a missing time", async () => {
      client.verifyMagicLink.mockResolvedValue({
        data: null,
        error: Object.assign(new Error("confirmation_required"), {
          status: 409,
          body: { details: { requestedFrom: { deviceClass: "bot" } } },
        }),
      });

      await act(async () => {
        render(<VerifyMagicLink token="token-1" />);
      });

      expect(
        screen.getByText("This link was requested from an automated client.", {
          exact: false,
        }),
      ).toBeInTheDocument();
    });
  });

  it("fails without a token, asking nothing", () => {
    render(<VerifyMagicLink />);

    expect(screen.getByText("This link did not work")).toBeInTheDocument();
    expect(client.verifyMagicLink).not.toHaveBeenCalled();
  });
});
