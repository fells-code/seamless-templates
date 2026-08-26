import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RecordList from "./RecordList";

const empty = { title: "Nothing here yet" };

describe("RecordList", () => {
  it("explains a waking API instead of showing a skeleton or a fault", () => {
    render(
      <RecordList state="waking" empty={empty}>
        <p>A record</p>
      </RecordList>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Waking this up");
    expect(screen.queryByLabelText("Loading")).toBeNull();
    expect(screen.queryByText("A record")).toBeNull();
  });

  it("still says so when something is actually wrong", () => {
    render(
      <RecordList
        state="error"
        error="We could not load this just now."
        empty={empty}
      >
        <p>A record</p>
      </RecordList>,
    );

    expect(screen.getByText("We could not load this just now.")).toBeVisible();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
