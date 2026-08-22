import EmptyState from "./EmptyState";
import type { Column, DataTableProps } from "./types";

/**
 * A dense table.
 *
 * Row height and cell padding come from `data-cell`, which each theme retunes, so
 * the same table is tight in a working tool and airy in a showy one. Figures go in
 * a right-aligned column with tabular figures; a column of money that does not
 * line up is the detail that gives an application away.
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  footer,
  state = "ready",
  error,
  empty,
}: DataTableProps<T>) {
  if (state === "loading") {
    return (
      <div
        className="flex flex-col gap-2"
        aria-busy="true"
        aria-label="Loading"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton" style={{ height: "2.5rem" }} />
        ))}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="panel px-6 py-10 text-center">
        <p className="font-medium text-red-600">
          {error ?? "Something went wrong."}
        </p>
      </div>
    );
  }

  if (rows.length === 0 && empty) {
    return <EmptyState {...empty} />;
  }

  // The first column is nearly always a short identifier (a date, a name, a
  // rank) and figures never wrap. Letting either of them wrap turns a dense
  // table into a ragged one the moment the window narrows; the container
  // scrolls sideways instead, which is what a table of figures wants.
  const cellClass = (column: Column<T>, index: number) =>
    [
      "data-cell align-middle",
      column.align === "right" ? "numeric text-right" : "text-left",
      column.align === "right" || index === 0 ? "whitespace-nowrap" : "",
      column.secondary ? "hidden lg:table-cell" : "",
    ].join(" ");

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((column, index) => (
              <th
                key={column.key}
                scope="col"
                className={cellClass(column, index)}
              >
                <span className="label text-ink-muted">{column.label}</span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="stagger">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-line last:border-0 hover:bg-surface"
            >
              {columns.map((column, index) => (
                <td
                  key={column.key}
                  className={`${cellClass(column, index)} text-ink`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {footer && (
          <tfoot>
            <tr className="border-t-2 border-line bg-surface">
              {columns.map((column, index) => (
                <td
                  key={column.key}
                  className={`${cellClass(
                    column,
                    index,
                  )} font-semibold text-ink`}
                >
                  {footer[column.key] ?? ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
