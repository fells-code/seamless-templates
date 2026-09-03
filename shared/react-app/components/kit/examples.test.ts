import { afterEach, describe, expect, it } from "vitest";

import { EXAMPLES, examplesFor } from "../../lib/examples";

/*
 * What the module does, never what it currently holds.
 *
 * This suite runs again inside every application scaffolded from the starter,
 * and the first thing a scaffold does is fill this module in from the spec.
 * A test asserting it is empty passes here and fails in every generated
 * application, which turns the starter's own suite from a correctness oracle
 * into a false alarm.
 */
describe("examplesFor", () => {
  const added: string[] = [];

  afterEach(() => {
    for (const path of added.splice(0)) delete EXAMPLES[path];
  });

  function given(path: string, rows: Array<Record<string, unknown>>) {
    EXAMPLES[path] = rows;
    added.push(path);
  }

  it("has nothing to say about a collection nobody gave it rows for", () => {
    expect(examplesFor("/api/nothing-here")).toEqual([]);
  });

  it("gives every row an id no server would mint", () => {
    given("/api/routes", [{ name: "Tidewrack" }, { name: "Gantry" }]);

    const rows = examplesFor("/api/routes");

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: "Tidewrack", id: "example-0" });
    expect(rows[1]!.id).toBe("example-1");
    // Distinct, because a list renders them by key.
    expect(new Set(rows.map((row) => row.id)).size).toBe(2);
  });

  it("leaves an empty list empty rather than inventing a row", () => {
    given("/api/routes", []);
    expect(examplesFor("/api/routes")).toEqual([]);
  });
});
