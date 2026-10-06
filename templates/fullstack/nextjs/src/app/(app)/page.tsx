import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <p className="label text-ink-muted">Next.js starter</p>
      <h1 className="display text-ink">Passwordless, end to end.</h1>
      <p className="max-w-prose text-ink-muted">
        This application serves the Seamless Auth routes itself, reads the
        session while it renders on the server, and protects pages before they
        render. Sign in with a passkey, a one-time code, or a magic link.
      </p>
      <div className="flex gap-3">
        <Link href="/session" className="btn lift bg-brand text-brand-ink">
          View your session
        </Link>
        <Link
          href="/about"
          className="btn lift border border-line bg-surface-raised text-ink"
        >
          How it works
        </Link>
      </div>
    </section>
  );
}
