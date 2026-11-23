import AuthFrame from "@/components/AuthFrame";
import VerifyMagicLink from "@/components/VerifyMagicLink";

// The auth server builds the emailed link to this exact path, so it cannot be
// renamed. The link's code is in its fragment, which only the browser sees, so
// the client component reads the link rather than this page's searchParams.
export default function VerifyMagicLinkPage() {
  return (
    <AuthFrame>
      <VerifyMagicLink />
    </AuthFrame>
  );
}
