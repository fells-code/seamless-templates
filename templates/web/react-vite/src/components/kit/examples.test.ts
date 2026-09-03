import { describe, expect, it } from "vitest";

import { EXAMPLES, examplesFor } from "../../lib/examples";

describe("examplesFor", () => {
  it("is empty in the starter, so nothing shows examples by default", () => {
    expect(Object.keys(EXAMPLES)).toHaveLength(0);
    expect(examplesFor("/api/routes")).toEqual([]);
  });

  it("gives every row an id no server would mint", () => {
    // The build script rewrites this module; the test writes it the same way so
    // the shape the script has to produce is stated somewhere other than in the
    // script.
    EXAMPLES["/api/routes"] = [{ name: "Tidewrack" }, { name: "Gantry" }];

    try {
      const rows = examplesFor("/api/routes");

      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ name: "Tidewrack", id: "example-0" });
      expect(rows[1]!.id).toBe("example-1");
      // Distinct, because a list renders them by key.
      expect(new Set(rows.map((row) => row.id)).size).toBe(2);
    } finally {
      delete EXAMPLES["/api/routes"];
    }
  });
});
