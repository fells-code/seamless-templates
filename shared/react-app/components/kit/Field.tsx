import Toggle from "./Toggle";
import type { FieldProps } from "./types";

const CONTROL =
  "w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none disabled:opacity-60";

/**
 * One labelled control.
 *
 * `currency` is its own type rather than a number input with a hint, because
 * money is the case where the difference shows: a leading symbol and figures that
 * sit on the right, so a column of amounts reads as a column.
 */
export default function Field({
  field,
  value,
  onChange,
  disabled = false,
}: FieldProps) {
  const type = field.type ?? "text";

  if (type === "checkbox") {
    return (
      <Toggle
        label={field.label}
        hint={field.hint}
        checked={value === true}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  const control = () => {
    if (type === "textarea") {
      return (
        <textarea
          id={field.name}
          rows={3}
          required={field.required}
          disabled={disabled}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className={CONTROL}
        />
      );
    }

    if (type === "select") {
      return (
        <select
          id={field.name}
          required={field.required}
          disabled={disabled}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className={CONTROL}
        >
          <option value="">{field.placeholder ?? "Choose one"}</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === "currency") {
      return (
        <div className="relative">
          <input
            id={field.name}
            type="number"
            inputMode="decimal"
            step="0.01"
            required={field.required}
            disabled={disabled}
            placeholder={field.placeholder ?? "0.00"}
            value={value === "" || value === undefined ? "" : String(value)}
            onChange={(event) => onChange(event.target.value)}
            className={`${CONTROL} numeric text-right`}
          />
        </div>
      );
    }

    return (
      <input
        id={field.name}
        type={type === "number" ? "number" : type === "date" ? "date" : "text"}
        inputMode={type === "number" ? "numeric" : undefined}
        required={field.required}
        disabled={disabled}
        placeholder={field.placeholder}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        className={
          type === "number" ? `${CONTROL} numeric text-right` : CONTROL
        }
      />
    );
  };

  return (
    <div className="min-w-0">
      <label htmlFor={field.name} className="label mb-1.5 block text-ink-muted">
        {field.label}
        {!field.required && (
          <span className="ml-1 normal-case tracking-normal opacity-70">
            (optional)
          </span>
        )}
      </label>

      {control()}

      {field.hint && (
        <p className="mt-1 text-xs text-ink-muted">{field.hint}</p>
      )}
    </div>
  );
}
