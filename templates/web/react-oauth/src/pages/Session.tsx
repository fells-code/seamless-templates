import { useEffect, useState } from "react";
import { useAuth } from "@seamless-auth/react";
import type { Credential } from "@seamless-auth/react";

// The API serializes every timestamp as an ISO 8601 string, so these arrive as
// strings rather than dates.
function formatDateTime(value?: string | null): string {
  if (!value) {
    return "not set";
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function credentialLabel(credential: Credential): string {
  const named = credential.friendlyName?.trim();
  if (named) {
    return named;
  }

  const device = [credential.platform, credential.browser]
    .filter(Boolean)
    .join(" on ");

  return device || "Unnamed passkey";
}

function deviceTypeLabel(deviceType: Credential["deviceType"]): string {
  if (!deviceType) {
    return "not reported";
  }

  return deviceType === "multiDevice" ? "multi-device" : "single device";
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-56 shrink-0 text-sm text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 break-all">
        {value}
      </dd>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      {children}
    </div>
  );
}

export default function Session() {
  const {
    user,
    credentials,
    organizations,
    activeOrganization,
    stepUpStatus,
    refreshStepUpStatus,
    refreshSession,
    logoutAllSessions,
  } = useAuth();

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Every other value here arrives with the session, but step-up freshness is
  // fetched on demand so an app that never gates on it pays nothing.
  useEffect(() => {
    void refreshStepUpStatus();
  }, [refreshStepUpStatus]);

  // RequireAuth in App.tsx keeps this route behind an established session.
  if (!user) {
    return null;
  }

  const handleRefresh = async () => {
    setBusy(true);
    setStatus(null);

    const { error } = await refreshSession();

    setStatus(
      error
        ? `Refresh failed: ${error.message}`
        : `Session re-read from the auth server at ${new Date().toLocaleTimeString()}.`,
    );
    setBusy(false);
  };

  // On success the provider clears the session, so RequireAuth redirects out of
  // this page and there is no component left to report back to.
  const handleSignOutEverywhere = async () => {
    setBusy(true);
    setStatus(null);

    const { error } = await logoutAllSessions();

    if (error) {
      setStatus(`Sign out failed: ${error.message}`);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black px-6 py-16">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-3">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Your session
          </h1>
          <p className="text-gray-700 dark:text-gray-400">
            Everything on this page comes from{" "}
            <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800">
              useAuth()
            </code>
            . No tokens are handled here: the session travels as an HttpOnly
            cookie, and the SDK exposes the identity behind it.
          </p>
        </header>

        <Section
          title="Identity"
          description="The claims the auth server issued for this user."
        >
          <Card>
            <dl className="space-y-3">
              <Field label="User id" value={user.id} />
              <Field label="Email" value={user.email} />
              <Field label="Phone" value={user.phone || "not set"} />
              <Field label="Last login" value={formatDateTime(user.lastLogin)} />
              <Field
                label="Active organization id"
                value={user.activeOrganizationId ?? "none in this token"}
              />
            </dl>
          </Card>
        </Section>

        <Section
          title="Roles"
          description="Roles ride along with the session. Check them in the UI to shape what renders, and again in your API to actually enforce access."
        >
          <Card>
            {user.roles.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This user has no roles yet. Assign them in the admin console.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <li
                    key={role}
                    className="px-2 py-1 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  >
                    {role}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Roles granted through an OAuth signup come from the auth server's
              default roles, not from the provider. Gate on them with{" "}
              <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800">
                hasScopedRole("yourRole")
              </code>
              .
            </p>
          </Card>
        </Section>

        <Section
          title="Recent verification"
          description="Step-up proves a fresh passkey or TOTP check and then expires on its own, which is what makes it usable as a gate in front of sensitive actions."
        >
          <Card>
            {stepUpStatus ? (
              <dl className="space-y-3">
                <Field label="Fresh" value={stepUpStatus.fresh ? "yes" : "no"} />
                <Field
                  label="Method"
                  value={stepUpStatus.method ?? "never verified"}
                />
                <Field
                  label="Verified at"
                  value={formatDateTime(stepUpStatus.verifiedAt)}
                />
                <Field
                  label="Expires at"
                  value={formatDateTime(stepUpStatus.expiresAt)}
                />
                <Field
                  label="Stays fresh for"
                  value={`${stepUpStatus.maxAgeSeconds} seconds`}
                />
              </dl>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reading step-up status...
              </p>
            )}
          </Card>
        </Section>

        <Section
          title="Organizations"
          description="An organization can be carried in the session, so the same user can act in a different tenant without signing in again."
        >
          <Card>
            <dl className="space-y-3">
              <Field
                label="Active organization"
                value={
                  activeOrganization
                    ? `${activeOrganization.name} (${activeOrganization.slug})`
                    : "none"
                }
              />
              <Field
                label="Memberships"
                value={
                  organizations.length === 0
                    ? "none"
                    : organizations
                        .map((organization) => organization.name)
                        .join(", ")
                }
              />
            </dl>
          </Card>
        </Section>

        <Section
          title="Passkeys"
          description="The credentials registered to this account. A backed-up passkey syncs to the user's other devices."
        >
          <Card>
            {credentials.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No passkeys registered. This user signs in with a one-time code
                or an OAuth provider.
              </p>
            ) : (
              <ul className="space-y-4">
                {credentials.map((credential) => (
                  <li
                    key={credential.id}
                    className="border-b border-gray-200 dark:border-gray-800 pb-4 last:border-0 last:pb-0"
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {credentialLabel(credential)}
                    </p>
                    <dl className="mt-2 space-y-2">
                      <Field
                        label="Registered"
                        value={formatDateTime(credential.createdAt)}
                      />
                      <Field
                        label="Last used"
                        value={formatDateTime(credential.lastUsedAt)}
                      />
                      <Field
                        label="Device type"
                        value={deviceTypeLabel(credential.deviceType)}
                      />
                      <Field
                        label="Backed up"
                        value={credential.backedUp ? "yes" : "no"}
                      />
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Section>

        <Section
          title="Session actions"
          description="Re-reading the session is how the SDK picks up a role or organization change without a full page load."
        >
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={busy}
                className="px-4 py-2 rounded-md text-sm bg-[#2169a8] text-white hover:bg-[#1a568a] transition disabled:opacity-50"
              >
                Refresh session
              </button>

              <button
                type="button"
                onClick={handleSignOutEverywhere}
                disabled={busy}
                className="px-4 py-2 rounded-md text-sm border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
              >
                Sign out everywhere
              </button>
            </div>

            {status && (
              <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                {status}
              </p>
            )}
          </Card>
        </Section>

        <details className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <summary className="cursor-pointer font-medium text-gray-900 dark:text-gray-100">
            Raw session data
          </summary>

          <pre className="mt-4 text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
            {JSON.stringify(
              { user, credentials, organizations, activeOrganization },
              null,
              2,
            )}
          </pre>
        </details>
      </div>
    </div>
  );
}
