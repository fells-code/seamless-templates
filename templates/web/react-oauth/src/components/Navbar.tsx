import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@seamless-auth/react";

/*
 * The application chrome: a persistent sidebar on a desktop, a bar and a drawer
 * on a phone.
 *
 * It reads its colours from the `shell` token family rather than from `surface`,
 * which is what lets a theme put a deep sidebar against light content. One rule
 * comes with that: emphasis on the shell uses `accent`, never `brand`. A theme is
 * free to tint the shell with the brand hue, and where it does, a brand-coloured
 * chip on a brand-coloured panel disappears.
 */
export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Session", to: "/session" },
  ];

  const appName = "Seamless Auth - Template";
  const identity = user?.email || user?.phone || user?.id;
  const initial = (identity ?? appName).trim()[0]?.toUpperCase() ?? "A";

  const monogram = (
    <span
      aria-hidden
      className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-accent font-display text-sm text-accent-ink"
    >
      {appName.trim()[0]?.toUpperCase() ?? "A"}
    </span>
  );

  const brand = (
    <Link to="/" className="flex min-w-0 items-center gap-3">
      {monogram}
      <span className="truncate font-display text-base tracking-display text-shell-ink">
        {appName}
      </span>
    </Link>
  );

  const links = (
    <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-5">
      <p className="label px-3 pb-3 text-shell-ink-muted">Menu</p>

      <ul className="space-y-1">
        {navLinks.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.to === "/"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                isActive ? "nav-item nav-item-active" : "nav-item"
              }
            >
              <>
                <span aria-hidden className="nav-marker" />
                {link.label}
              </>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  // The account control is a menu rather than a bare sign-out button because the
  // conformance suite in seamless-cli drives it by accessible name: it opens
  // "Open account menu" and then clicks "Logout". Renaming either breaks that
  // suite rather than anything in this repository.
  const account = (
    <div className="relative border-t border-shell-line px-3 py-3">
      {isAuthenticated ? (
        <>
          {accountOpen && (
            <div className="absolute inset-x-3 bottom-full mb-2 overflow-hidden rounded-control border border-shell-line bg-shell shadow-lifted">
              <p className="truncate border-b border-shell-line px-3 py-2 text-xs text-shell-ink-muted">
                {identity}
              </p>

              <button
                type="button"
                onClick={() => {
                  setAccountOpen(false);
                  setMobileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-shell-ink hover:bg-shell-active"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}

          <button
            type="button"
            aria-label="Open account menu"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((open) => !open)}
            className="flex w-full items-center gap-3 rounded-control px-1 py-1.5 text-left hover:bg-shell-active"
          >
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-shell-active text-xs font-semibold text-shell-ink"
            >
              {initial}
            </span>

            <span className="min-w-0 flex-1 truncate text-xs text-shell-ink-muted">
              {identity}
            </span>
          </button>
        </>
      ) : (
        <Link
          to="/login"
          className="block rounded-control bg-accent px-3 py-2 text-center text-sm font-medium text-accent-ink"
        >
          Sign in
        </Link>
      )}
    </div>
  );

  return (
    <>
      <aside className="shell-column sticky top-0 hidden h-screen flex-col border-r border-shell-line bg-shell lg:flex">
        <div className="border-b border-shell-line px-5 py-5">{brand}</div>
        {links}
        {account}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-shell-line bg-shell px-4 py-3 lg:hidden">
        {brand}

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          className="rounded-control p-2 text-shell-ink-muted hover:bg-shell-active hover:text-shell-ink"
        >
          <Menu size={20} />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="flex-1 bg-ink/50"
          />

          <div className="shell-column rise-in flex flex-col border-l border-shell-line bg-shell">
            <div className="flex items-center justify-between gap-3 border-b border-shell-line px-4 py-3">
              {brand}

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="rounded-control p-2 text-shell-ink-muted hover:bg-shell-active hover:text-shell-ink"
              >
                <X size={20} />
              </button>
            </div>

            {links}
            {account}
          </div>
        </div>
      )}
    </>
  );
}
