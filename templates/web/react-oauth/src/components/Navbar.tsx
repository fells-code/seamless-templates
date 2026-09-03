import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { useAuth } from "@seamless-auth/react";

import { useShell } from "./kit";

/*
 * The application chrome, in five arrangements.
 *
 * It reads its colours from the `shell` token family rather than from `surface`,
 * which is what lets a theme put a deep sidebar against light content. One rule
 * comes with that: emphasis on the shell uses `accent`, never `brand`. A theme is
 * free to tint the shell with the brand hue, and where it does, a brand-coloured
 * chip on a brand-coloured panel disappears.
 *
 * Which arrangement renders is `data-shell` on `<html>`, the way the look is
 * `data-style` on the same element. The stylesheet keys the shell's own tokens
 * on that attribute too, so the markup and the layout cannot disagree about
 * which shell this is, and nothing has to be threaded down through the tree.
 *
 * Five rather than one because the sidebar is a composition, and an application
 * that always opens on it looks like every other application that always opens
 * on it, whatever colour it is painted. They are variants of one component
 * rather than a component each: the brand, the links and the account control are
 * built once here and arranged differently below.
 *
 * The account control's accessible names are a cross-repo contract. The
 * conformance suite in seamless-cli signs out by clicking "Open account menu"
 * and then "Logout", so every shell has to offer both.
 */
export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const shell = useShell();

  /*
   * A screen's icon, where it has one.
   *
   * Optional because the starter's own screens do not need one and the rail
   * shell does: a column four and a half rem wide has room for a mark and
   * nothing else. Whatever scaffolds an application supplies them, since which
   * icon fits a screen is a question about what the screen is.
   */
  const navLinks: Array<{ label: string; to: string; icon?: LucideIcon }> = [
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

  const closeMobile = () => setMobileOpen(false);

  const links = (
    <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-5">
      <p className="label px-3 pb-3 text-shell-ink-muted">Menu</p>

      <ul className="space-y-1">
        {navLinks.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.to === "/"}
              onClick={closeMobile}
              className={({ isActive }) =>
                isActive ? "nav-item nav-item-active" : "nav-item"
              }
            >
              <>
                {link.icon ? (
                  <link.icon size={16} aria-hidden className="nav-icon" />
                ) : (
                  <span aria-hidden className="nav-marker" />
                )}
                {link.label}
              </>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  /*
   * The same links, laid along a row instead of down a column.
   *
   * `kind` is the class pair rather than a shell name, because three shells want
   * a row and each draws the current item differently: the top bar reuses the
   * sidebar's filled item, the tab strip rules the edge under it, and the cover
   * puts a pill on the band. Nothing else about the row changes.
   */
  const rowLinks = (kind: "item" | "tab" | "pill", gap: string) => (
    <nav aria-label="Main" className="min-w-0">
      <ul className={`flex items-center ${gap} overflow-x-auto`}>
        {navLinks.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.to === "/"}
              onClick={closeMobile}
              className={({ isActive }) =>
                isActive ? `nav-${kind} nav-${kind}-active` : `nav-${kind}`
              }
            >
              <>
                {link.icon && (
                  <link.icon size={16} aria-hidden className="nav-icon" />
                )}
                {link.label}
              </>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  /*
   * The rail carries one glyph per screen and keeps the label for screen
   * readers. The glyph is the screen's initial until the subject icons land,
   * which is a decision about what each screen is rather than about how a rail
   * is built.
   */
  const railLinks = (
    <nav aria-label="Main" className="flex-1 overflow-y-auto px-2 py-5">
      <ul className="space-y-1">
        {navLinks.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.to === "/"}
              title={link.label}
              className={({ isActive }) =>
                isActive
                  ? "nav-item nav-rail-item nav-item-active"
                  : "nav-item nav-rail-item"
              }
            >
              <>
                <span aria-hidden className="nav-glyph">
                  {link.icon ? (
                    <link.icon size={18} />
                  ) : (
                    link.label.trim()[0]?.toUpperCase()
                  )}
                </span>
                <span className="sr-only">{link.label}</span>
              </>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  /*
   * The account control, opening whichever way there is room for it.
   *
   * In a column it grows upward from the foot of the shell; in a bar it drops
   * from the top right. Same markup and the same accessible names either way, so
   * the placement is the only thing an arrangement decides. A rail has no room
   * for the address beside the monogram, and a bar has no panel to sit in.
   */
  const account = (
    direction: "up" | "down",
    { address = true, framed = true } = {},
  ) => (
    <div
      className={
        framed
          ? "relative border-t border-shell-line px-3 py-3"
          : "relative shrink-0"
      }
    >
      {isAuthenticated ? (
        <>
          {accountOpen && (
            <div
              className={`absolute z-40 overflow-hidden rounded-control border border-shell-line bg-shell shadow-lifted ${
                direction === "up"
                  ? "inset-x-3 bottom-full mb-2"
                  : "right-0 top-full mt-2 w-56"
              }`}
            >
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

            {address && (
              <span className="min-w-0 flex-1 truncate text-xs text-shell-ink-muted">
                {identity}
              </span>
            )}
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

  const burger = (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      aria-label="Open navigation"
      aria-expanded={mobileOpen}
      className="rounded-control p-2 hover:bg-shell-active lg:hidden"
    >
      <Menu size={20} />
    </button>
  );

  const drawer = mobileOpen && (
    <div className="fixed inset-0 z-40 flex lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={closeMobile}
        className="flex-1 bg-ink/50"
      />

      <div className="shell-column rise-in flex flex-col border-l border-shell-line bg-shell">
        <div className="flex items-center justify-between gap-3 border-b border-shell-line px-4 py-3">
          {brand}

          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close navigation"
            className="rounded-control p-2 text-shell-ink-muted hover:bg-shell-active hover:text-shell-ink"
          >
            <X size={20} />
          </button>
        </div>

        {links}
        {account("up")}
      </div>
    </div>
  );

  /*
   * The bar a column shell falls back to on a phone.
   *
   * A sidebar and a rail are both a column the width of the window at 375, which
   * is the whole window, so neither can be what a phone renders. The drawer
   * behind this bar is the sidebar's own list either way, because a rail of
   * glyphs is a desktop affordance and a phone has room for the words.
   */
  const mobileBar = (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-shell-line bg-shell px-4 py-3 text-shell-ink-muted lg:hidden">
      {brand}
      {burger}
    </header>
  );

  if (shell === "rail") {
    return (
      <>
        <aside className="shell-column sticky top-0 hidden h-screen flex-col border-r border-shell-line bg-shell lg:flex">
          <div className="border-b border-shell-line px-2 py-5">
            <Link to="/" aria-label={appName} className="flex justify-center">
              {monogram}
            </Link>
          </div>

          {railLinks}
          {account("up", { address: false })}
        </aside>

        {mobileBar}
        {drawer}
      </>
    );
  }

  if (shell === "topbar" || shell === "tabs") {
    return (
      <>
        <header className="sticky top-0 z-30 border-b border-shell-line bg-shell text-shell-ink-muted">
          <div className="shell-bar flex items-center justify-between gap-6 py-3">
            {brand}

            <div className="hidden min-w-0 items-center gap-6 lg:flex">
              {shell === "topbar" && rowLinks("item", "gap-1")}
              {account("down", { framed: false })}
            </div>

            {burger}
          </div>

          {shell === "tabs" && (
            <div className="shell-bar hidden border-t border-shell-line lg:block">
              {rowLinks("tab", "gap-6")}
            </div>
          )}
        </header>

        {drawer}
      </>
    );
  }

  if (shell === "cover") {
    /*
     * No panel, no border and no background: the chrome is a row over whatever
     * the first band of the page turns out to be. That is why it is absolute and
     * why a banded screen takes a `shell-offset`, so the band starts below the
     * row rather than behind it. Its ink comes from the band for the same
     * reason: there is no shell surface under it to read against.
     */
    return (
      <>
        <header className="absolute inset-x-0 top-0 z-30 text-band-ink">
          <div className="shell-bar flex items-center justify-between gap-6 py-4">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              {monogram}
              <span className="truncate font-display text-base tracking-display">
                {appName}
              </span>
            </Link>

            <div className="hidden min-w-0 items-center gap-3 lg:flex">
              {rowLinks("pill", "gap-1")}
              {account("down", { framed: false })}
            </div>

            {burger}
          </div>
        </header>

        {drawer}
      </>
    );
  }

  return (
    <>
      <aside className="shell-column sticky top-0 hidden h-screen flex-col border-r border-shell-line bg-shell lg:flex">
        <div className="border-b border-shell-line px-5 py-5">{brand}</div>
        {links}
        {account("up")}
      </aside>

      {mobileBar}
      {drawer}
    </>
  );
}
