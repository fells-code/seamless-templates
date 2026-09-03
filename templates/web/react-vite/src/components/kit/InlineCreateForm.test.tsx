import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import InlineCreateForm from "./InlineCreateForm";
import type { FieldSpec } from "./types";

const FIELDS: FieldSpec[] = [{ name: "route", label: "Route", required: true }];

/**
 * jsdom has no layout, so `matchMedia` has to be stood up by hand. Both widths
 * are exercised because the two render genuinely different markup: on a phone
 * the form is a button and a sheet, and on a desktop it is a panel.
 */
function setViewport(compact: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: compact,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

const onSubmit = vi.fn().mockResolvedValue(undefined);

function renderForm(extra: Record<string, unknown> = {}) {
  return render(
    <InlineCreateForm
      title="Log an attempt"
      fields={FIELDS}
      onSubmit={onSubmit}
      submitLabel="Log it"
      {...extra}
    />,
  );
}

afterEach(() => {
  onSubmit.mockClear();
});

describe("InlineCreateForm on a desktop", () => {
  beforeEach(() => setViewport(false));

  it("is a panel with the fields on the screen", () => {
    renderForm();

    expect(screen.getByLabelText("Route")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log it" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("InlineCreateForm on a phone", () => {
  beforeEach(() => setViewport(true));

  it("opens on a button rather than on a stack of inputs", () => {
    renderForm();

    expect(screen.queryByLabelText("Route")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Log an attempt" }),
    ).toBeInTheDocument();
  });

  it("puts the form in a sheet one tap away", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Log an attempt" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Route")).toBeInTheDocument();
  });

  it("closes the sheet once the record is filed", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Log an attempt" }));
    fireEvent.change(screen.getByLabelText("Route"), {
      target: { value: "Tidewrack" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log it" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("closes the sheet on Escape", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Log an attempt" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("offers nothing at all when the role does not allow writing", () => {
    renderForm({ locked: true });

    expect(
      screen.queryByRole("button", { name: "Log an attempt" }),
    ).not.toBeInTheDocument();
  });
});
