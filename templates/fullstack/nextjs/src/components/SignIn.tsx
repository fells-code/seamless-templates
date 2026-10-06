"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  useAuth,
  useAuthClient,
  usePasskeySupport,
  type LoginMethod,
} from "@seamless-auth/react";

import Button from "@/components/Button";
import { describeDevice } from "@/lib/device";

type Mode = "login" | "register";
type Channel = "email" | "phone";

type Step =
  | { kind: "identify" }
  | { kind: "choose"; methods: LoginMethod[] }
  | { kind: "code"; flow: Mode; channel: Channel }
  | { kind: "magic-sent" }
  | { kind: "enroll-passkey" };

// Used only when the sign-in response does not say which methods the account
// has, which an older auth server may not.
const FALLBACK_METHODS: LoginMethod[] = ["passkey", "magic_link", "email_otp"];

const METHOD_LABELS: Partial<Record<LoginMethod, string>> = {
  email_otp: "Email me a code",
  phone_otp: "Text me a code",
  magic_link: "Email me a sign-in link",
};

const MAGIC_LINK_POLL_MS = 3000;

// The auth server limits how fast codes can be sent and tried. Saying the code
// was wrong when it was never checked sends people round in circles.
function explain(error: { status?: number } | null, fallback: string) {
  return error?.status === 429
    ? "Too many attempts. Wait a few minutes, then try again."
    : fallback;
}

// The auth server sends six letters by email and six digits by text message.
const CODE_FORMAT = {
  email: {
    noun: "six-letter code",
    clean: (value: string) => value.replace(/[^a-z]/gi, "").toUpperCase(),
    pattern: "[A-Za-z]{6}",
    inputMode: "text",
  },
  phone: {
    noun: "six-digit code",
    clean: (value: string) => value.replace(/\D/g, ""),
    pattern: "[0-9]{6}",
    inputMode: "numeric",
  },
} as const;

/**
 * Sign-in and account creation, built on the SDK's public primitives rather
 * than its bundled screens, which route with react-router.
 */
export default function SignIn({ next }: { next: string }) {
  const router = useRouter();
  const { login, handlePasskeyLogin, registerPasskey, refreshSession } =
    useAuth();
  const client = useAuthClient();
  const { passkeySupported } = usePasskeySupport();

  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>({ kind: "identify" });
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Both the poll and another tab can report the magic link at once.
  const finishing = useRef(false);

  async function finish() {
    if (finishing.current) return;
    finishing.current = true;

    await refreshSession();
    router.replace(next);
    router.refresh();
  }

  async function run(action: () => Promise<void>) {
    setError("");
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  const identify = (event: FormEvent) => {
    event.preventDefault();

    void run(async () => {
      if (mode === "register") {
        const { error } = await client.register({ email: identifier });
        if (error) {
          setError(
            explain(error, "That account could not be created. Try again."),
          );
          return;
        }
        setStep({ kind: "code", flow: "register", channel: "email" });
        return;
      }

      const { data, error } = await login(identifier, passkeySupported);
      if (error) {
        setError(
          explain(
            error,
            "Sign-in could not start. Check the address and try again.",
          ),
        );
        return;
      }

      const methods = data.loginMethods?.length
        ? data.loginMethods
        : FALLBACK_METHODS;

      if (passkeySupported && methods.includes("passkey")) {
        const { error: passkeyError } = await handlePasskeyLogin();
        if (!passkeyError) {
          await finish();
          return;
        }
        setError("The passkey did not complete. Choose another way in.");
      }

      setStep({ kind: "choose", methods });
    });
  };

  const choose = (method: LoginMethod) =>
    run(async () => {
      if (method === "passkey") {
        const { error } = await handlePasskeyLogin();
        if (error) {
          setError(
            explain(
              error,
              "The passkey did not complete. Choose another way in.",
            ),
          );
          return;
        }
        await finish();
        return;
      }

      if (method === "magic_link") {
        const { error } = await client.requestMagicLink();
        if (error) {
          setError(explain(error, "The sign-in link could not be sent."));
          return;
        }
        setStep({ kind: "magic-sent" });
        return;
      }

      const channel: Channel = method === "phone_otp" ? "phone" : "email";
      const { error } =
        channel === "phone"
          ? await client.requestLoginPhoneOtp()
          : await client.requestLoginEmailOtp();
      if (error) {
        setError(explain(error, "The code could not be sent."));
        return;
      }
      setStep({ kind: "code", flow: "login", channel });
    });

  const verify = (event: FormEvent) => {
    event.preventDefault();
    if (step.kind !== "code") return;

    void run(async () => {
      const { error } =
        step.flow === "register"
          ? await client.verifyEmailOtp(code)
          : step.channel === "phone"
            ? await client.verifyLoginPhoneOtp(code)
            : await client.verifyLoginEmailOtp(code);

      if (error) {
        setError(
          explain(error, "That code did not match. Check it and try again."),
        );
        return;
      }

      if (step.flow === "register" && passkeySupported) {
        setStep({ kind: "enroll-passkey" });
        return;
      }

      await finish();
    });
  };

  const enrollPasskey = () =>
    run(async () => {
      const { error } = await registerPasskey(
        describeDevice(navigator.userAgent),
      );
      if (error) {
        setError(
          explain(error, "The passkey was not saved. You can add one later."),
        );
        return;
      }
      await finish();
    });

  const magicLinkSent = step.kind === "magic-sent";

  useEffect(() => {
    if (!magicLinkSent) return;

    // The check answers 204 until the emailed link has been used, and Success
    // only after, so a bare ok would finish before the link is clicked.
    const completed = async () => {
      const { data, error } = await client.checkMagicLink();
      return !error && data?.message === "Success";
    };

    const poll = setInterval(async () => {
      if (await completed()) void finish();
    }, MAGIC_LINK_POLL_MS);

    // The verify page posts here when the link is opened in another tab of
    // this browser, which is faster than the next poll.
    const channel = new BroadcastChannel("seamless-auth");
    channel.onmessage = async (event) => {
      if (event.data?.type === "MAGIC_LINK_AUTH_SUCCESS" && (await completed()))
        void finish();
    };

    return () => {
      clearInterval(poll);
      channel.close();
    };
    // `finish` only reads refs and stable hooks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magicLinkSent, client]);

  const restart = () => {
    setStep({ kind: "identify" });
    setCode("");
    setError("");
  };

  return (
    <div>
      <h2 className="title text-ink">
        {step.kind === "enroll-passkey"
          ? "Add a passkey"
          : mode === "login"
            ? "Sign in"
            : "Create an account"}
      </h2>

      {step.kind === "identify" && (
        <form onSubmit={identify} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="identifier"
              className="label mb-1.5 block text-ink-muted"
            >
              {mode === "login" ? "Email or phone number" : "Email"}
            </label>
            <input
              id="identifier"
              type={mode === "register" ? "email" : "text"}
              autoComplete="username webauthn"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="control placeholder:text-ink-muted"
            />
          </div>

          <Button type="submit" busy={busy} full>
            {mode === "login" ? "Continue" : "Create account"}
          </Button>

          <p className="text-center text-sm text-ink-muted">
            {mode === "login" ? "New here? " : "Already have an account? "}
            <button
              type="button"
              className="font-medium text-ink underline"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </form>
      )}

      {step.kind === "choose" && (
        <div className="mt-8 space-y-3">
          <p className="text-sm text-ink-muted">
            Choose how to sign in as <strong>{identifier}</strong>.
          </p>
          {passkeySupported && step.methods.includes("passkey") && (
            <Button full busy={busy} onClick={() => void choose("passkey")}>
              Use a passkey
            </Button>
          )}
          {step.methods
            .filter((method) => METHOD_LABELS[method])
            .map((method) => (
              <Button
                key={method}
                variant="quiet"
                full
                disabled={busy}
                onClick={() => void choose(method)}
              >
                {METHOD_LABELS[method]}
              </Button>
            ))}
          <BackLink onClick={restart} />
        </div>
      )}

      {step.kind === "code" && (
        <form onSubmit={verify} className="mt-8 space-y-6">
          <p className="text-sm text-ink-muted">
            Enter the {CODE_FORMAT[step.channel].noun} we sent to{" "}
            {step.channel === "phone" ? "your phone" : "your email"}.
          </p>
          <div>
            <label htmlFor="code" className="label mb-1.5 block text-ink-muted">
              Code
            </label>
            <input
              id="code"
              inputMode={CODE_FORMAT[step.channel].inputMode}
              autoComplete="one-time-code"
              autoCapitalize="characters"
              pattern={CODE_FORMAT[step.channel].pattern}
              maxLength={6}
              required
              value={code}
              onChange={(event) =>
                setCode(CODE_FORMAT[step.channel].clean(event.target.value))
              }
              className="control numeric tracking-widest"
            />
          </div>
          <Button type="submit" busy={busy} full>
            Verify
          </Button>
          <BackLink onClick={restart} />
        </form>
      )}

      {step.kind === "magic-sent" && (
        <div className="mt-8 space-y-6">
          <p className="text-sm text-ink-muted">
            We emailed a sign-in link to <strong>{identifier}</strong>. Open it
            on this device and this page signs you in.
          </p>
          <BackLink onClick={restart} />
        </div>
      )}

      {step.kind === "enroll-passkey" && (
        <div className="mt-8 space-y-3">
          <p className="text-sm text-ink-muted">
            A passkey signs you in with this device&apos;s screen lock next
            time, with nothing to type.
          </p>
          <Button full busy={busy} onClick={() => void enrollPasskey()}>
            Add a passkey
          </Button>
          <Button
            full
            variant="quiet"
            disabled={busy}
            onClick={() => void finish()}
          >
            Not now
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 text-sm text-negative">
          {error}
        </p>
      )}
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-center text-sm text-ink-muted underline"
    >
      Use a different account
    </button>
  );
}
