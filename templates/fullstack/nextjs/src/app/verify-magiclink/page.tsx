import AuthFrame from "@/components/AuthFrame";
import VerifyMagicLink from "@/components/VerifyMagicLink";

// The auth server builds the emailed link to this path, so it cannot be renamed.
export default async function VerifyMagicLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthFrame>
      <VerifyMagicLink token={Array.isArray(token) ? token[0] : token} />
    </AuthFrame>
  );
}
