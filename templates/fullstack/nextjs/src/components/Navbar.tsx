"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@seamless-auth/react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/session", label: "Session" },
  { href: "/beta", label: "Beta" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const signOut = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="border-b border-line bg-surface-raised">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
        <Link href="/" className="font-semibold text-ink">
          Seamless Auth
        </Link>

        <ul className="flex flex-1 flex-wrap gap-4 text-sm">
          {LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={
                  pathname === href
                    ? "font-medium text-ink"
                    : "text-ink-muted hover:text-ink"
                }
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {isAuthenticated ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ink-muted">{user?.email}</span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="font-medium text-ink underline"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-ink underline"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
