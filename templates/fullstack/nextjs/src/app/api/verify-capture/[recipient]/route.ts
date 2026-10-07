import { captureEnabled, readCaptured } from "@/lib/capture";

/**
 * The latest code or magic link captured for a recipient, for `seamless verify`.
 * Answers 404 unless SEAMLESS_VERIFY_CAPTURE is "true"; see src/lib/capture.ts.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ recipient: string }> },
) {
  if (!captureEnabled()) {
    return new Response("Not found", { status: 404 });
  }

  const { recipient } = await params;

  return Response.json(readCaptured(decodeURIComponent(recipient)), {
    headers: { "cache-control": "no-store" },
  });
}
