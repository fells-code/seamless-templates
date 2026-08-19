import { useAuth } from "@seamless-auth/react";
import {
  DataTable,
  InlineCreateForm,
  Screen,
  StatRow,
  formatDate,
  formatMoney,
  useCollection,
} from ".";
import type { Column } from "./types";

/*
 * A worked screen, end to end, in the kit's own idiom.
 *
 * It is here to be read and copied. Note what it does not contain: no colour, no
 * radius, no shadow, no breakpoint arithmetic, no loading flag, no empty branch,
 * no artwork, and no layout decisions beyond naming an archetype. All of that
 * belongs to the kit and to the theme, which is why this is roughly thirty lines
 * of composition rather than two hundred and fifty of markup.
 */

interface Entry {
  id: number;
  description: string;
  amount: number;
  category: string;
  spent_on: string;
}

export default function LedgerExample() {
  const { hasScopedRole } = useAuth();
  const canPost = hasScopedRole("treasurer") === true;

  const { records, state, error, create } = useCollection<Entry>("/entries");
  const total = records.reduce((sum, entry) => sum + Number(entry.amount), 0);

  const columns: Column<Entry>[] = [
    {
      key: "spent_on",
      label: "Date",
      render: (row) => formatDate(row.spent_on),
    },
    { key: "description", label: "Entry", render: (row) => row.description },
    {
      key: "category",
      label: "Category",
      secondary: true,
      render: (row) => row.category,
    },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      render: (row) => formatMoney(row.amount),
    },
  ];

  return (
    <Screen
      archetype="ledger"
      title="The books"
      tagline="Every payment in and out, on the record."
      band={
        <StatRow
          onBand
          items={[
            { label: "Total posted", value: total, format: "currency" },
            { label: "Entries", value: records.length, hint: "this year" },
          ]}
        />
      }
      aside={
        <InlineCreateForm
          title="Post an entry"
          submitLabel="Post it"
          busyLabel="Posting..."
          onSubmit={create}
          locked={!canPost}
          note="Only the treasurer can post to the books."
          fields={[
            {
              name: "description",
              label: "What was it for",
              required: true,
              placeholder: "Hall hire",
            },
            {
              name: "amount",
              label: "Amount",
              type: "currency",
              required: true,
            },
            {
              name: "category",
              label: "Category",
              type: "select",
              required: true,
              sticky: true,
              options: [
                { value: "venue", label: "Venue" },
                { value: "supplies", label: "Supplies" },
                { value: "social", label: "Social" },
              ],
            },
            {
              name: "spent_on",
              label: "Date",
              type: "date",
              required: true,
              defaultValue: "today",
            },
          ]}
        />
      }
    >
      <DataTable
        columns={columns}
        rows={records}
        rowKey={(row) => row.id}
        state={state}
        error={error}
        footer={{ description: "Total", amount: formatMoney(total) }}
        empty={{
          title: "Nothing posted yet",
          body: "The first entry the treasurer posts will show up here.",
        }}
      />
    </Screen>
  );
}
