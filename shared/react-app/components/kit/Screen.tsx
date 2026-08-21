import PageHeader from "./PageHeader";
import type { ScreenProps } from "./types";

/*
 * The composition a screen is poured into.
 *
 * Left to itself every screen becomes the same thing: a centred column, a
 * heading, and a stack of equal-weight bordered boxes. That sameness is
 * structural, and no amount of retuning colour or corner radius reaches it. So
 * the shape is chosen up front by name, and only the content is decided per
 * screen.
 *
 * Each region is a `view`. A style decides whether that means a block of a
 * scrolling page or a full height of the window the page settles on.
 */

const BANDED = new Set(["ledger", "tracker", "roster", "dashboard", "board"]);

const PAD = "px-5 sm:px-8 lg:px-12";

export default function Screen({
  archetype,
  title,
  tagline,
  actions,
  band,
  aside,
  children,
}: ScreenProps) {
  const banded = BANDED.has(archetype);

  const landing = archetype === "dashboard";

  const header = banded ? (
    <section
      className={`view band-fill relative overflow-hidden text-band-ink ${
        landing ? "hero-section" : "band-section"
      }`}
    >
      <div className={`${PAD} py-16`}>
        <PageHeader
          title={title}
          tagline={tagline}
          actions={actions}
          onBand
          size={landing ? "display" : "title"}
        />
        {band && <div className="mt-12">{band}</div>}
      </div>
    </section>
  ) : (
    <section className={`view ${PAD} border-b border-line pt-10 pb-8`}>
      <PageHeader title={title} tagline={tagline} actions={actions} />
      {band && <div className="mt-8">{band}</div>}
    </section>
  );

  // A rail keeps the create form in view beside a long table, and keeps the two
  // in one view rather than two.
  //
  // It splits at xl, not lg. At lg a sidebar, a table of five columns and a form
  // all fit on paper and none of them is usable, and the column that gets
  // squeezed out is the one carrying the figures.
  const railed =
    archetype === "ledger" ||
    archetype === "roster" ||
    archetype === "dashboard";

  const views = [];

  if (railed && aside) {
    views.push(
      <section
        key="body"
        className={`view reveal ${PAD} grid items-start gap-8 py-12 xl:grid-cols-[minmax(0,1fr)_20rem]`}
      >
        <div className="order-2 min-w-0 xl:order-1">{children}</div>
        <div className="order-1 xl:sticky xl:top-6 xl:order-2">{aside}</div>
      </section>,
    );
  } else if (archetype === "feed") {
    views.push(
      <section
        key="body"
        className={`view reveal ${PAD} w-full max-w-2xl py-12`}
      >
        {aside && <div className="mb-10">{aside}</div>}
        {children}
      </section>,
    );
  } else {
    if (aside) {
      views.push(
        <section key="aside" className={`view reveal ${PAD} py-12`}>
          <div className="max-w-3xl">{aside}</div>
        </section>,
      );
    }
    views.push(
      <section key="body" className={`view reveal ${PAD} py-12`}>
        {children}
      </section>,
    );
  }

  return (
    <>
      {header}
      {views}
    </>
  );
}
