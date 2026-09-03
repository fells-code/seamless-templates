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

  it("says which application this is on a phone, not only on a desktop", () => {
    // The screen most people an application is shared with see first. The pitch
    // half used to be hidden outright below 64rem, so somebody opening a link in
    // a group chat got a sign-in form on a white page: the starter, with none of
    // the application on it.
    renderFrame();

    const named = screen.getAllByText("Kitchen table");
    expect(named.length).toBeGreaterThan(1);

    // Both halves carry a cover, so the phone's band is a band and not a
    // heading with nothing behind it.
    const { container } = renderFrame();
    expect(container.querySelectorAll(".cover").length).toBeGreaterThan(1);
  });

  it("keeps the pitch above the form on a phone", () => {
    const { container } = renderFrame();

    const band = container.querySelector(".band-fill.lg\\:hidden");
    expect(band).not.toBeNull();

    const form = screen.getByRole("button", { name: "Send me a link" });
    expect(
      band!.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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
