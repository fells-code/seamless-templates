import { useAuth } from "@seamless-auth/react";
import { Link } from "react-router-dom";
import { ActionCard, Screen, StatRow } from "../components/kit";

/*
 * Where a signed-in visitor lands. Composed from the kit, like every other screen.
 */
export default function Home() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="px-8 py-20 text-sm text-ink-muted">
        Checking your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="px-8 py-20">
        <h1 className="title text-ink">You are signed out</h1>
        <p className="mt-3 max-w-prose text-ink-muted">
          Sign in to see how authentication state flows through the UI and the
          API.
        </p>

        <Link
          to="/login"
          className="lift mt-8 inline-block rounded-control bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-hover"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const identity = user?.email || user?.phone || user?.id || "your account";

  return (
    <Screen
      archetype="dashboard"
      title="You are signed in"
      tagline={`Signed in as ${identity}.`}
      band={
        <StatRow
          onBand
          items={[
            { label: "Roles", value: user?.roles.length ?? 0 },
            {
              label: "Account",
              value: user?.roles.length
                ? user.roles.join(", ")
                : "No roles yet",
            },
          ]}
        />
      }
    >
      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ActionCard
          to="/session"
          title="Inspect this session"
          body="What the auth server knows about you right now."
        />
        <ActionCard
          to="/beta"
          title="A protected route"
          body="A page and an API call that both require a role."
        />
        <ActionCard
          to="/about"
          title="How this works"
          body="The pieces of Seamless Auth and how they fit together."
        />
      </div>
    </Screen>
  );
}
