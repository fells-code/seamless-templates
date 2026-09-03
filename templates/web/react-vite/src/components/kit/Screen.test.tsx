import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Screen from "./Screen";
import type { Landing } from "./types";

const LANDINGS: Landing[] = ["overview", "poster", "notebook", "contents"];

function renderLanding(landing: Landing) {
  return render(
    <Screen
      archetype="dashboard"
      landing={landing}
      title="The wall"
      tagline="Everything currently set."
      band={<p>48 routes</p>}
    >
      <p>Content</p>
    </Screen>,
  );
}

describe("Screen landings", () => {
  it.each(LANDINGS)("renders the title and the content in %s", (landing) => {
    const { getByText } = renderLanding(landing);

    expect(getByText("The wall")).toBeInTheDocument();
    expect(getByText("Content")).toBeInTheDocument();
    expect(getByText("48 routes")).toBeInTheDocument();
  });

  it("opens the poster on a band that takes the window", () => {
    const { container } = renderLanding("poster");
    expect(container.querySelector(".poster-section")).not.toBeNull();
  });

  it("gives the notebook no band at all", () => {
    const { container } = renderLanding("notebook");

    expect(container.querySelector(".band-fill")).toBeNull();
    expect(container.querySelector(".poster-section")).toBeNull();
  });

  it("keeps a notebook's figures readable off the band", () => {
    // Every generated Home passes `<StatRow onBand>`, which is right on three
    // of the four landings and paints band ink on the page surface on the
    // fourth. The header with no band resolves that ink to the page's instead
    // of asking the page to get the prop right.
    const { container } = renderLanding("notebook");
    expect(container.querySelector(".band-on-page")).not.toBeNull();
  });

  it("prints the contents landing as a ruled list", () => {
    const { container } = renderLanding("contents");
    expect(container.querySelector(".contents-list")).not.toBeNull();
  });

  it("wraps a screen so a kit can put the header beside the content", () => {
    // The wrapper resolves to `display: contents` unless a kit asks otherwise,
    // so it is free; without it a side band would need a second Screen.
    const { container } = renderLanding("overview");
    expect(container.querySelector(".screen-flow")).not.toBeNull();
  });

  it("is the overview when nothing asked for a landing", () => {
    const { container } = render(
      <Screen archetype="dashboard" title="Home">
        <p>Content</p>
      </Screen>,
    );

    expect(container.querySelector(".band-fill")).not.toBeNull();
    expect(container.querySelector(".poster-section")).toBeNull();
    expect(container.querySelector(".contents-list")).toBeNull();
  });

  it.each(LANDINGS)(
    "leaves a working screen's header alone whatever %s asks for",
    (landing) => {
      // A ledger's header introduces a table. A landing composition reaching it
      // would spend the fold on a title and push the figures under it.
      const { container } = render(
        <Screen archetype="ledger" landing={landing} title="Books">
          <p>Rows</p>
        </Screen>,
      );

      expect(container.querySelector(".band-fill")).not.toBeNull();
      expect(container.querySelector(".poster-section")).toBeNull();
      expect(container.querySelector(".contents-list")).toBeNull();
    },
  );
});
