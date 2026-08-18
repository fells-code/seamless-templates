import PageHeader from "./PageHeader";
import type { ScreenProps } from "./types";

/*
 * The composition a screen is poured into.
 *
 * Left to itself every screen becomes the same thing: a centred column, a heading,
 * and a stack of equal-weight bordered boxes. That sameness is structural, and no
 * amount of retuning colour or corner radius reaches it. So the shape is chosen up
 * front by name, and only the content is decided per screen.
 *
 * Two devices do most of the work. Banded archetypes open with a full-bleed strip
 * of brand colour carrying the title, the headline figures and the motif, which is
 * the only place in the layout that commits a large area to a colour. And the
 * create form is a rail beside the content rather than another box above it, so
 * the page has a long edge and a short one instead of one column of sameness.
 */

const BANDED = new Set(["ledger", "tracker", "roster", "dashboard"]);

const PAD = "px-5 sm:px-8 lg:px-12";

export default function Screen({
  archetype,
  title,
  tagline,
  actions,
  band,
  aside,
  motif,
  children,
}: ScreenProps) {
  const banded = BANDED.has(archetype);

  const header = banded ? (
    <section className="relative overflow-hidden bg-band text-band-ink">
      {motif && <div className="motif motif-hero motif-animate">{motif}</div>}

      <div className={`above-motif ${PAD} py-10 lg:py-14`}>
        <PageHeader title={title} tagline={tagline} actions={actions} onBand />
        {band && <div className="mt-10">{band}</div>}
      </div>
    </section>
  ) : (
    <section className={`${PAD} border-b border-line pt-10 pb-8`}>
      <PageHeader title={title} tagline={tagline} actions={actions} />
      {band && <div className="mt-8">{band}</div>}
    </section>
  );

  // A rail keeps the create form in view beside a long table. It only becomes a
  // rail at a width where both halves still have room; below that it stacks, and
  // the form goes first because it is the thing you came to do.
  //
  // That width is xl, not lg. At lg a sidebar, a table of five columns and a form
  // all fit on paper and none of them is usable, and the column that gets
  // squeezed out is the one carrying the figures.
  const railed =
    archetype === "ledger" ||
    archetype === "roster" ||
    archetype === "dashboard";

  let body;
  if (railed && aside) {
    body = (
      <div
        className={`${PAD} grid items-start gap-8 py-8 xl:grid-cols-[minmax(0,1fr)_20rem]`}
      >
        <div className="order-2 min-w-0 xl:order-1">{children}</div>
        <div className="order-1 xl:sticky xl:top-6 xl:order-2">{aside}</div>
      </div>
    );
  } else if (archetype === "feed") {
    body = (
      <div className={`${PAD} mx-auto w-full max-w-2xl py-8`}>
        {aside && <div className="mb-8">{aside}</div>}
        {children}
      </div>
    );
  } else {
    body = (
      <div className={`${PAD} py-8`}>
        {aside && <div className="mb-8 max-w-3xl">{aside}</div>}
        {children}
      </div>
    );
  }

  return (
    <div className="rise-in">
      {header}
      {body}
    </div>
  );
}
