import type { ReactNode } from "react";
import { AuthFrame } from "../components/kit";

/*
 * The signed-out surface, and the first thing a visitor sees.
 *
 * It is a wrapper, not a form: the auth screens arrive as `children` and are
 * rendered once, unchanged.
 */
export default function Login({ children }: { children: ReactNode }) {
  return (
    <AuthFrame
      title="Seamless Auth"
      pitch="A reference template showing how passwordless authentication is embedded directly into an application, its API, and its auth server."
      points={[
        "Passkeys, magic links and one-time codes, out of the box",
        "Roles enforced in the API and reflected in the UI",
        "A self-hostable auth server you keep control of",
      ]}
      motif={
        <svg viewBox="0 0 400 300" aria-hidden="true" fill="none">
          <circle
            cx="200"
            cy="150"
            r="96"
            stroke="currentColor"
            strokeWidth="3"
          />
          <circle
            cx="200"
            cy="150"
            r="52"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M148 150h104M200 98v104"
            stroke="currentColor"
            strokeWidth="3"
          />
        </svg>
      }
    >
      {children}
    </AuthFrame>
  );
}
