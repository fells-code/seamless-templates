import type { AuthFrameProps } from "./types";

/**
 * The signed-out surface: a pitch on a full band of brand colour, and the sign-in
 * screens in a calm frame beside it.
 *
 * `children` is the auth package's own screens. They are rendered once and
 * untouched; nothing here adds an input, a button or a link of its own, because
 * the form is the point of the page and a second call to action beside it is a
 * way of losing people.
 *
 * This is the one screen with nothing to read and exactly one thing to do, which
 * makes it the one screen that can afford to commit half its width to a colour.
 */
export default function AuthFrame({
  title,
  pitch,
  points = [],
  motif,
  children,
}: AuthFrameProps) {
  return (
    <div className="flex min-h-screen bg-surface">
      <div className="relative hidden w-1/2 overflow-hidden bg-band text-band-ink lg:flex lg:flex-col lg:justify-center">
        {motif && <div className="motif motif-hero motif-animate">{motif}</div>}

        <div className="above-motif px-14 py-16 xl:px-20">
          <h1 className="display max-w-xl">{title}</h1>

          <p className="mt-8 max-w-lg text-lg leading-relaxed text-band-ink-muted">
            {pitch}
          </p>

          {points.length > 0 && (
            <ul className="mt-12 space-y-3">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                  />
                  <span className="text-sm text-band-ink-muted">{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-16 sm:px-10 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
