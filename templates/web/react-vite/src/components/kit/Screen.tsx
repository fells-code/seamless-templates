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
 *
 * Nothing here names a page width, a gutter, a column count or which side the
 * create rail lands on. Those are `page-gutter`, `content-column`, `auto-grid`
 * and `rail-grid`, and every one of them resolves from the theme, so a single
 * archetype arranges a page differently in each style: flush left and full bleed
 * in one, a centred reading measure in another, with the rail on the left in a
 * third. Writing that as variant components would have meant six archetypes
 * times ten styles, all of it in markup a stylesheet cannot reach.
 */

const BANDED = new Set(["ledger", "tracker", "roster", "dashboard", "board"]);

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
      className={`view band-fill band-shape shell-offset relative overflow-hidden text-band-ink ${
        landing ? "hero-section" : "band-section"
      }`}
    >
      <div className="page-gutter band-pad">
        <div className="band-column">
          <PageHeader
            title={title}
            tagline={tagline}
            actions={actions}
            onBand
            size={landing ? "display" : "title"}
          />
          {band && <div className="mt-12">{band}</div>}
        </div>
      </div>
    </section>
  ) : (
    <section className="view shell-offset page-gutter band-pad rule">
      <div className="content-column">
        <PageHeader title={title} tagline={tagline} actions={actions} />
        {band && <div className="mt-8">{band}</div>}
      </div>
    </section>
  );

  // A rail keeps the create form in view beside a long table, and keeps the two
  // in one view rather than two.
  //
  // It splits at 80rem, not at lg. Narrower than that, a sidebar, a table of five
  // columns and a form all fit on paper and none of them is usable, and the
  // column that gets squeezed out is the one carrying the figures. Whether it
  // splits at all, and on which side the form lands, is `rail-grid`'s and
  // therefore the theme's: a style set to a 46rem reading measure collapses it to
  // one track, because a narrow measure with a sidebar bolted to it is neither a
  // reading column nor a working tool.
  // A landing screen is not one of them. The rail is for a create form beside a
  // long table; a dashboard's content is a grid of cards that already wants the
  // full width, and pairing the two leaves a 20rem column empty down the length
  // of the first screen anyone sees. The form gets a view of its own instead.
  const railed = archetype === "ledger" || archetype === "roster";

  const views = [];

  if (railed && aside) {
    views.push(
      <section key="body" className="view reveal page-gutter view-pad">
        <div className="content-column rail-grid">
          <div className="rail-main">{children}</div>
          <div className="rail-aside">{aside}</div>
        </div>
      </section>,
    );
  } else if (archetype === "feed") {
    views.push(
      <section key="body" className="view reveal page-gutter view-pad">
        <div className="content-column feed-column">
          {aside && <div className="mb-10">{aside}</div>}
          {children}
        </div>
      </section>,
    );
  } else {
    const asideView = aside ? (
      <section key="aside" className="view reveal page-gutter view-pad">
        <div className="content-column">
          <div className="aside-column">{aside}</div>
        </div>
      </section>
    ) : null;

    const bodyView = (
      <section key="body" className="view reveal page-gutter view-pad">
        <div className="content-column">{children}</div>
      </section>
    );

    // On most screens the thing you came to do gets a view of its own ahead of
    // the thing you came to look at. A landing screen is the exception: it is
    // the overview, its first job is to say where everything is, and opening it
    // on a form asks someone to file a record before they have been shown what
    // the application holds.
    views.push(
      ...(landing ? [bodyView, asideView] : [asideView, bodyView]).filter(
        (view) => view !== null,
      ),
    );
  }

  return (
    <>
      {header}
      {views}
    </>
  );
}
