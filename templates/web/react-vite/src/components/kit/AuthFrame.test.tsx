import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AuthFrame from "./AuthFrame";

function renderFrame() {
  return render(
    <AuthFrame
      title="Kitchen table"
      pitch="Everything the house is keeping track of, in one place."
      points={["Post an entry", "See the month"]}
    >
      <button type="button">Send me a link</button>
    </AuthFrame>,
  );
}

describe("AuthFrame", () => {
  it("carries both marks, each linked out", () => {
    renderFrame();

    expect(
      screen.getByRole("link", { name: "Secured by Seamless Auth" }),
    ).toHaveAttribute("href", "https://seamlessauth.com");
    expect(
      screen.getByRole("link", { name: "Made with Seamless Idea" }),
    ).toHaveAttribute("href", "https://seamlessidea.com");
  });

  it("keeps the marks behind the sign-in screens", () => {
    renderFrame();

    const form = screen.getByRole("button", { name: "Send me a link" });
    const mark = screen.getByRole("link", { name: "Secured by Seamless Auth" });

    expect(
      form.compareDocumentPosition(mark) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
