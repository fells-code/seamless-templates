import Vista from "./Vista";
import type { AuthFrameProps } from "./types";

/**
 * The signed-out surface: a pitch on one half, the sign-in screens on the other.
 *
 * `children` is the auth package's own screens. They are rendered once and
 * untouched; nothing here adds an input, a button or a link of its own, because
 * the form is the point of the page and a second call to action beside it is a
 * way of losing people.
 *
 * This page is outside the application shell, so it mounts the backdrop itself.
 */
export default function AuthFrame({
  title,
  pitch,
  points = [],
  children,
}: AuthFrameProps) {
  return (
    <div className="flex min-h-screen">
      <Vista />

      <div className="band-fill band-shape above-vista hidden w-1/2 flex-col justify-center overflow-hidden text-band-ink lg:flex">
        <div className="page-gutter band-pad">
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

      <div className="above-vista flex w-full flex-col justify-center bg-surface px-6 py-16 sm:px-10 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
