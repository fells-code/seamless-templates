import { useState } from "react";
import Field from "./Field";
import PrimaryButton from "./PrimaryButton";
import { today } from "./format";
import type {
  FieldSpec,
  FieldValue,
  FieldValues,
  InlineCreateFormProps,
} from "./types";

const COLUMNS = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
} as const;

const SPANS = { 1: "", 2: "sm:col-span-2", 3: "sm:col-span-2 lg:col-span-3" };

function initial(field: FieldSpec): FieldValue {
  if (field.type === "checkbox") return field.defaultValue === true;
  if (field.type === "date" && field.defaultValue === "today") return today();
  return field.defaultValue ?? "";
}

function seed(fields: FieldSpec[]): FieldValues {
  return Object.fromEntries(
    fields.map((field) => [field.name, initial(field)]),
  );
}

/**
 * Create and list belong on the same screen, so this is the create half.
 *
 * It coerces on the way out: a number input hands back a string, and an API that
 * expects a number and receives "12" is a 400 the person who typed it cannot act
 * on. Optional fields left blank are omitted rather than sent as empty strings.
 */
export default function InlineCreateForm({
  title,
  fields,
  onSubmit,
  submitLabel,
  busyLabel,
  columns = 1,
  locked = false,
  note,
}: InlineCreateFormProps) {
  const [values, setValues] = useState<FieldValues>(() => seed(fields));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  if (locked) {
    return note ? (
      <div className="panel panel-pad">
        <p className="text-sm text-ink-muted">{note}</p>
      </div>
    ) : null;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFailed(null);

    const payload: FieldValues = {};
    for (const field of fields) {
      const raw = values[field.name];

      if ((raw === "" || raw === undefined) && !field.required) continue;

      payload[field.name] =
        field.type === "number" || field.type === "currency"
          ? Number(raw)
          : raw ?? "";
    }

    try {
      await onSubmit(payload);
      setValues((current) =>
        Object.fromEntries(
          fields.map((field) => [
            field.name,
            field.sticky ? current[field.name]! : initial(field),
          ]),
        ),
      );
    } catch {
      setFailed("That did not save. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel panel-pad">
      <h2 className="label mb-4 text-ink-muted">{title}</h2>

      <div className={`grid gap-4 ${COLUMNS[columns]}`}>
        {fields.map((field) => (
          <div key={field.name} className={SPANS[field.span ?? 1]}>
            <Field
              field={field}
              value={values[field.name] ?? ""}
              disabled={busy}
              onChange={(value) =>
                setValues((current) => ({ ...current, [field.name]: value }))
              }
            />
          </div>
        ))}
      </div>

      {failed && <p className="mt-4 text-sm text-red-600">{failed}</p>}

      {/* Full width in a rail, where the button is the width of the form anyway;
          its own size in a wide panel, where a stretched button reads as a banner. */}
      <div className="mt-5">
        <PrimaryButton
          type="submit"
          busy={busy}
          busyLabel={busyLabel}
          full={columns === 1}
        >
          {submitLabel}
        </PrimaryButton>
      </div>
    </form>
  );
}
