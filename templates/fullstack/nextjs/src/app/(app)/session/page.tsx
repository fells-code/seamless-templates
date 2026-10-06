import SessionDetails from "@/components/SessionDetails";

// Reached only with a session: src/proxy.ts redirects everyone else.
export default function SessionPage() {
  return <SessionDetails />;
}
