import AuthFrame from "@/components/AuthFrame";
import SignIn from "@/components/SignIn";
import { safeNext } from "@/lib/safeNext";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthFrame>
      <SignIn next={safeNext(next)} />
    </AuthFrame>
  );
}
