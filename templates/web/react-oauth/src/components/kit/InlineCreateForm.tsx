import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import Field from "./Field";
import PrimaryButton from "./PrimaryButton";
import { today } from "./format";
import { useCompact } from "./useCompact";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const compact = useCompact();

  // A sheet that covers the screen needs a way out that is not hunting for the
  // control behind it.
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

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
          : (raw ?? "");
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
      // The record is filed and the thing it was filed into is behind the sheet,
      // so the sheet gets out of the way. On a wide screen the form is already
      // beside the list and there is nothing to close.
      setSheetOpen(false);
    } catch {
      setFailed("That did not save. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  };

  const form = (
    <form onSubmit={submit} className={compact ? "" : "panel panel-pad"}>
      {!compact && <h2 className="label mb-4 text-ink-muted">{title}</h2>}

      <div className={`grid gap-4 ${compact ? "" : COLUMNS[columns]}`}>
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

      {failed && <p className="mt-4 text-sm text-negative">{failed}</p>}

      {/* Full width in a rail, where the button is the width of the form anyway;
          its own size in a wide panel, where a stretched button reads as a banner. */}
      <div className="mt-5">
        <PrimaryButton
          type="submit"
          busy={busy}
          busyLabel={busyLabel}
          full={compact || columns === 1}
        >
          {submitLabel}
        </PrimaryButton>
      </div>
    </form>
  );

  if (!compact) return form;

  /*
   * On a phone the form is a button and a sheet, not a stack of inputs.
   *
   * At 375 a create panel above or below the thing it creates into is the single
   * loudest "this is a web form" signal an application gives off, and it pushes
   * the records themselves under the fold on the screen where somebody came to
   * read them. A button that opens a sheet is what every application anybody has
   * on their phone does instead.
   *
   * One form, moved, rather than two in the document behind a media query: two
   * copies of the same field names and labels is a worse form for anyone using a
   * screen reader.
   */
  return (
    <div className="sheet-mount">
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label={title}
        aria-expanded={sheetOpen}
        className="btn lift fixed bottom-5 right-5 z-40 gap-2 bg-brand text-brand-ink shadow-lifted"
      >
        <Plus size={18} aria-hidden />
        {submitLabel}
      </button>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSheetOpen(false)}
            className="flex-1 bg-ink/50"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="rise-in max-h-[85vh] overflow-y-auto rounded-t-card border-t border-line bg-surface-raised p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="label text-ink-muted">{title}</h2>

              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                className="rounded-control p-2 text-ink-muted hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>

            {form}
          </div>
        </div>
      )}
    </div>
  );
}
