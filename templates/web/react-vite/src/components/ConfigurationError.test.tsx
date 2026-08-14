import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ConfigurationError from "./ConfigurationError";
import { MISSING_API_URL_MESSAGE } from "../lib/runtimeConfig";

describe("ConfigurationError", () => {
  it("names the missing variable instead of rendering a blank page", () => {
    render(<ConfigurationError message={MISSING_API_URL_MESSAGE} />);

    expect(
      screen.getByRole("heading", { name: "Configuration needed" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/VITE_API_URL is not set/)).toBeInTheDocument();
  });
});
