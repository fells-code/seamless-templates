import Cover from "./Cover";
import Vista from "./Vista";
import type { AuthFrameProps } from "./types";

/**
 * The signed-out surface: a pitch on one half, the sign-in screens on the other.
 *
 * `children` is the auth package's own screens. They are rendered once and
 * untouched; nothing here adds an input or a button of its own, because the form
 * is the point of the page and a second call to action beside it is a way of
 * losing people. The two marks under the form are the one exception, and their
 * weight is what keeps them from being one.
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
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Vista />

      {/*
       * The phone's half of this page, and the screen most people an application
       * is shared with actually see first.
       *
       * Below 64rem the pitch half was hidden outright, so somebody opening a
       * link in a group chat got a sign-in form on a white page: the starter,
       * with none of the application on it. This is the same band at the height
       * a phone can spare, carrying the cover, the name in the kit's display
       * face and one line of the pitch, with the form under it. The points list
       * stays behind: three bullets above a form is a page you scroll before you
       * can sign in.
       */}
      <div className="band-fill band-shape above-vista relative overflow-hidden px-6 py-10 text-band-ink sm:px-10 lg:hidden">
        <Cover />

        <div className="relative">
          <h1 className="display">{title}</h1>

          <p className="mt-4 max-w-prose text-band-ink-muted">{pitch}</p>
        </div>
      </div>

      <div className="band-fill band-shape above-vista relative hidden w-1/2 flex-col justify-center overflow-hidden text-band-ink lg:flex">
        <Cover />

        <div className="relative page-gutter band-pad">
          <h1 className="display max-w-xl">{title}</h1>

          <p className="mt-8 max-w-lg text-lg leading-relaxed text-band-ink-muted">
            {pitch}
          </p>

          {points.length > 0 && (
            <ul className="mt-12 space-y-3">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  {/* Anything drawn on the band reads from the band's own pair,
                      the same one PrimaryButton's onBand variant uses. The accent
                      is picked for a surface, so a kit that chooses a deep one
                      loses these marks against the band entirely. */}
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-on-band"
                  />
                  <span className="text-sm text-band-ink-muted">{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="above-vista flex w-full flex-col justify-center bg-surface px-6 py-16 sm:px-10 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          {children}

          {/* Under the form and at footnote weight, because the application has
              to read as the owner's rather than as a demo of ours. It is the
              mark a printer leaves on an invitation, not a banner.

              `noopener` without `noreferrer`: the referrer is the only way
              either product sees that a generated application sent someone. */}
          <p className="mt-12 flex flex-wrap justify-center gap-x-3 gap-y-1 text-center text-xs text-ink-muted">
            <a
              className="transition-colors hover:text-ink"
              href="https://seamlessauth.com"
              target="_blank"
              rel="noopener"
            >
              Secured by Seamless Auth
            </a>
            <span aria-hidden>&middot;</span>
            <a
              className="transition-colors hover:text-ink"
              href="https://seamlessidea.com"
              target="_blank"
              rel="noopener"
            >
              Made with Seamless Idea
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
