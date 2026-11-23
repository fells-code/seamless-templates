import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SeamlessAuthError } from "@seamless-auth/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import VerifyMagicLink from "./VerifyMagicLink";

const router = { replace: vi.fn(), refresh: vi.fn() };
const client = {
  verifyMagicLink: vi.fn(),
  confirmMagicLink: vi.fn(),
  checkMagicLink: vi.fn(),
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

const ok = { data: { message: "Success" }, error: null };
const unauthenticated = {
  data: null,
  error: new SeamlessAuthError("unauthenticated", 401),
};
const requestedAt = "2026-10-16T14:05:00.000Z";

function heldForConfirmation(sameDevice: boolean, requestedFrom?: object) {
  return {
    data: null,
    error: new SeamlessAuthError("confirmation_required", 409, {
      error: "confirmation_required",
      message: "Confirm this sign-in.",
      requestedFrom: requestedFrom ?? { deviceClass: "macos", requestedAt },
      sameDevice,
    }),
  };
}

function openLink(url = "/verify-magiclink?token=token-1#code=code-1") {
  window.history.replaceState(null, "", url);
}

describe("VerifyMagicLink", () => {
  beforeEach(() => {
    vi.stubGlobal("BroadcastChannel", FakeChannel);
    posted.length = 0;
    router.replace.mockReset();
    client.verifyMagicLink.mockReset();
    client.confirmMagicLink.mockReset().mockResolvedValue(ok);
    client.checkMagicLink.mockReset().mockResolvedValue(ok);
    auth.refreshSession
      .mockReset()
      .mockResolvedValue({ data: {}, error: null });
    openLink();
  });

  // Strict Mode runs effects twice in development. The link is single use and
  // its address is stripped on the first read, so the remount has to reuse the
  // first read and the first request.
  it("confirms a link opened on the device that asked, once, and signs in", async () => {
    client.verifyMagicLink.mockResolvedValue(heldForConfirmation(true));

    await act(async () => {
      render(
        <StrictMode>
          <VerifyMagicLink />
        </StrictMode>,
      );
    });

    expect(client.verifyMagicLink).toHaveBeenCalledTimes(1);
    expect(client.verifyMagicLink).toHaveBeenCalledWith("token-1");
    expect(client.confirmMagicLink).toHaveBeenCalledTimes(1);
    expect(client.confirmMagicLink).toHaveBeenCalledWith("token-1", "code-1");
    expect(router.replace).toHaveBeenCalledWith("/session");
    expect(posted).toContainEqual({ type: "MAGIC_LINK_AUTH_SUCCESS" });
  });

  it("takes the token and code out of the address bar", async () => {
    openLink("/verify-magiclink?token=token-1&ref=mail#code=code-1");
    client.verifyMagicLink.mockResolvedValue(heldForConfirmation(true));

    await act(async () => {
      render(<VerifyMagicLink />);
    });

    expect(window.location.pathname).toBe("/verify-magiclink");
    expect(window.location.search).toBe("?ref=mail");
    expect(window.location.hash).toBe("");
  });

  // An older auth API uses a same-device link on the verify call itself.
  it("signs in when the verify call already used the link", async () => {
    client.verifyMagicLink.mockResolvedValue(ok);

    await act(async () => {
      render(<VerifyMagicLink />);
    });

    expect(client.confirmMagicLink).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/session");
  });

  // Opened in another browser on the device that asked there is no pre-auth
  // cookie here, so nothing to collect: the tab that asked signs in, and this
  // one must not pretend to.
  it("sends the reader back to the tab that asked when no session lands here", async () => {
    client.verifyMagicLink.mockResolvedValue(heldForConfirmation(true));
    client.checkMagicLink.mockResolvedValue(unauthenticated);
    auth.refreshSession.mockResolvedValue(unauthenticated);

    await act(async () => {
      render(<VerifyMagicLink />);
    });

    expect(screen.getByText("You are verified")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("says so when the link has been used or has expired", async () => {
    client.verifyMagicLink.mockResolvedValue({
      data: null,
      error: new SeamlessAuthError("used", 400),
    });

    await act(async () => {
      render(<VerifyMagicLink />);
    });

    expect(screen.getByText("This link did not work")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  describe("when the link is opened on another device", () => {
    beforeEach(() => {
      client.verifyMagicLink.mockResolvedValue(heldForConfirmation(false));
    });

    it("shows where and when the link was requested, without using it", async () => {
      await act(async () => {
        render(<VerifyMagicLink />);
      });

      const when = new Date(requestedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
      expect(
        screen.getByText(`A sign-in was requested from a Mac on ${when}.`, {
          exact: false,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Yes, sign in that device" }),
      ).toBeInTheDocument();
      expect(client.confirmMagicLink).not.toHaveBeenCalled();
      expect(client.checkMagicLink).not.toHaveBeenCalled();
      expect(router.replace).not.toHaveBeenCalled();
    });

    it("approves with the code from the link and sends the reader back", async () => {
      await act(async () => {
        render(<VerifyMagicLink />);
      });
      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: "Yes, sign in that device" }),
        );
      });

      expect(client.confirmMagicLink).toHaveBeenCalledWith("token-1", "code-1");
      expect(screen.getByText("Sign-in approved")).toBeInTheDocument();
      expect(router.replace).not.toHaveBeenCalled();
    });

    it("keeps the choice open when approving fails", async () => {
      client.confirmMagicLink.mockResolvedValue({
        data: null,
        error: new SeamlessAuthError("expired", 400),
      });

      await act(async () => {
        render(<VerifyMagicLink />);
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
      await act(async () => {
        render(<VerifyMagicLink />);
      });
      fireEvent.click(
        screen.getByRole("button", { name: "No, this wasn't me" }),
      );

      expect(screen.getByText("Nothing was signed in")).toBeInTheDocument();
      expect(screen.getByText(/ignore the email/)).toBeInTheDocument();
      expect(client.confirmMagicLink).not.toHaveBeenCalled();
    });

    it("names an automated client and tolerates a missing time", async () => {
      client.verifyMagicLink.mockResolvedValue({
        data: null,
        error: new SeamlessAuthError("confirmation_required", 409, {
          details: {
            error: "confirmation_required",
            requestedFrom: { deviceClass: "bot" },
            sameDevice: false,
          },
        }),
      });

      await act(async () => {
        render(<VerifyMagicLink />);
      });

      expect(
        screen.getByText("A sign-in was requested from an automated client.", {
          exact: false,
        }),
      ).toBeInTheDocument();
    });
  });

  it("fails without a token, asking nothing", async () => {
    openLink("/verify-magiclink");

    await act(async () => {
      render(<VerifyMagicLink />);
    });

    expect(screen.getByText("This link did not work")).toBeInTheDocument();
    expect(client.verifyMagicLink).not.toHaveBeenCalled();
  });
});
