import DataTable from "./DataTable";
import type { Column, RankedTableProps } from "./types";

/**
 * A table where position is the point.
 *
 * The rank is a real column rather than an ordinal in the first cell, and the
 * leader is marked in accent, because a standings table where you cannot see who
 * is winning at a glance is just a table.
 */
export default function RankedTable<T>({
  columns,
  rows,
  rowKey,
  rankLabel = "#",
  ...rest
}: RankedTableProps<T>) {
  const position = new Map<string | number, number>();
  rows.forEach((row, index) => position.set(rowKey(row), index + 1));

  const rankColumn: Column<T> = {
    key: "__rank",
    label: rankLabel,
    align: "left",
    render: (row) => {
      const place = position.get(rowKey(row)) ?? 0;
      return (
        <span
          className={[
            "numeric grid h-7 w-7 place-items-center rounded-control text-xs font-bold",
            place === 1
              ? "bg-accent text-accent-ink"
              : place <= 3
                ? "bg-surface text-ink"
                : "text-ink-muted",
          ].join(" ")}
        >
          {place}
        </span>
      );
    },
  };

  return (
    <DataTable
      {...rest}
      columns={[rankColumn, ...columns]}
      rows={rows}
      rowKey={rowKey}
    />
  );
}
