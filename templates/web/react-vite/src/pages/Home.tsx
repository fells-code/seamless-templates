import { useAuth } from "@seamless-auth/react";
import { Navigate } from "react-router-dom";
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

  // Signing out anywhere in the app lands back here, so this redirect is what
  // returns a signed-out visitor to the auth screens. The OAuth starter gets the
  // same behaviour from RequireAuth on its index route, and the conformance suite
  // in seamless-cli asserts it: after logout the sign-in form has to reappear.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
