import { useAuth } from "@seamless-auth/react";
import { ActionCard, Screen, StatRow } from "../components/kit";

/*
 * Where a signed-in visitor lands, composed from the kit like every other screen.
 *
 * Rendered only for authenticated users (see RequireAuth in App.tsx), so this is
 * where an OAuth-signed-in user arrives once the callback completes. Signing out
 * lives in the shell, not here.
 */
export default function Home() {
  const { user } = useAuth();

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
      <p className="max-w-prose text-ink-muted">
        You authenticated through an OAuth provider. The auth server issued its
        own identity for the session, so the rest of the app never talks to the
        provider again.
      </p>

      <div className="stagger mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ActionCard
          to="/session"
          title="Inspect this session"
          body="What the auth server knows about you right now."
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
