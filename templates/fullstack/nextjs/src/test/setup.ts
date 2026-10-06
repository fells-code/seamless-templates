import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library only auto-cleans when the test runner exposes global hooks,
// which this setup deliberately does not, so unmount between tests here.
afterEach(() => {
  cleanup();
});
