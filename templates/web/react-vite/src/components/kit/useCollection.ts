import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../lib/api";
import type { FieldValues, LoadState, UseCollection } from "./types";

/**
 * One collection of records: load it, add to it.
 *
 * The create is optimistic. The new record is on screen before the request
 * finishes and is swapped for the server's copy when it lands, or removed with an
 * error if it does not. That matters most where it is least convenient to wait,
 * which is a phone held in one hand, and it is written once here rather than
 * risked per screen.
 */
export function useCollection<T extends { id: number | string }>(
  path: string,
): UseCollection<T> {
  const [records, setRecords] = useState<T[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Provisional ids only have to be unique among themselves and never collide
  // with a server id, so they count downwards from zero.
  const nextProvisional = useRef(-1);

  const load = useCallback(() => {
    let cancelled = false;
    setState("loading");

    apiFetch<T[]>(path)
      .then((data) => {
        if (cancelled) return;
        setRecords(Array.isArray(data) ? data : []);
        setState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setError("We could not load this just now. Try again in a moment.");
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  useEffect(load, [load]);

  const create = useCallback(
    async (values: FieldValues): Promise<T> => {
      const provisionalId = nextProvisional.current--;
      const provisional = { ...values, id: provisionalId } as unknown as T;

      setCreating(true);
      setError(null);
      setRecords((current) => [provisional, ...current]);

      try {
        const saved = await apiFetch<T>(path, {
          method: "POST",
          body: JSON.stringify(values),
        });
        setRecords((current) =>
          current.map((record) =>
            record.id === provisionalId ? saved : record,
          ),
        );
        return saved;
      } catch (cause) {
        setRecords((current) =>
          current.filter((record) => record.id !== provisionalId),
        );
        setError("That did not save. Check the details and try again.");
        throw cause;
      } finally {
        setCreating(false);
      }
    },
    [path],
  );

  return { records, state, error, create, creating, reload: load };
}
