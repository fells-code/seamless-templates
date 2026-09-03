/**
 * Rows a screen shows before anybody has added anything of their own.
 *
 * Empty in the starter and rewritten by the Seamless Idea build script from the
 * spec, which is why it is a module rather than a prop: filling it reaches every
 * screen in an application at once, and no page has to be written differently to
 * benefit. Keyed by the API path a collection loads from.
 *
 * They are never written to the database. A row that exists only on the screen
 * cannot be mistaken for a record, cannot be edited into one, and needs no
 * control to clear it away: it goes the moment the collection it stands in for
 * has something real in it.
 */
export const EXAMPLES: Record<
  string,
  ReadonlyArray<Record<string, unknown>>
> = {};

/**
 * The examples for a collection, already carrying ids.
 *
 * The ids are strings that no server would mint, so an example can never be
 * confused with a record by anything keying on `id`, and a list rendering one
 * still has a stable key.
 */
export function examplesFor(path: string): Array<Record<string, unknown>> {
  const rows = EXAMPLES[path];
  if (!rows || rows.length === 0) return [];

  return rows.map((row, index) => ({ ...row, id: `example-${index}` }));
}
