import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../lib/api";
import type {
  FieldValues,
  LoadState,
  UseCollection,
  UseCollectionOptions,
} from "./types";

function isProvisional(record: { id: number | string }): boolean {
  return typeof record.id === "number" && record.id < 0;
}

/**
 * One collection of records: load it, add to it, keep it current.
 *
 * The create is optimistic. The new record is on screen before the request
 * finishes and is swapped for the server's copy when it lands, or removed with an
 * error if it does not. That matters most where it is least convenient to wait,
 * which is a phone held in one hand, and it is written once here rather than
 * risked per screen.
 *
 * Pass `live` to keep the collection current: it refreshes on that interval, and
 * whenever the window is looked at again. For a collection a handful of people
 * share, that reads as live and costs one request, where a socket would cost a
 * server and a handshake.
 */
export function useCollection<T extends { id: number | string }>(
  path: string,
  options: UseCollectionOptions = {},
): UseCollection<T> {
  const { live = false } = options;

  const [records, setRecords] = useState<T[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Provisional ids only have to be unique among themselves and never collide
  // with a server id, so they count downwards from zero.
  const nextProvisional = useRef(-1);

  // Only the newest request may write. A refresh started before the path changed,
  // or before the screen went away, must not land on what replaced it.
  const requestId = useRef(0);

  const load = useCallback(
    (background: boolean) => {
      const id = ++requestId.current;

      // A background refresh swaps the records underneath the reader. Sending the
      // screen back to its skeleton every few seconds would be worse than a row
      // that is a moment out of date.
      if (!background) setState("loading");

      apiFetch<T[]>(path)
        .then((data) => {
          if (id !== requestId.current) return;
          const incoming = Array.isArray(data) ? data : [];
          // A create still in flight is not in the server's answer yet, so its
          // provisional record has to be carried across or the new row leaves the
          // screen and comes back when the post lands.
          setRecords((current) => [
            ...current.filter(isProvisional),
            ...incoming,
          ]);
          setState("ready");
        })
        .catch(() => {
          if (id !== requestId.current) return;
          // A refresh that fails says nothing: the records on screen are still the
          // last good ones, and an error the reader is part way through is not
          // this request's to replace.
          if (background) return;
          setError("We could not load this just now. Try again in a moment.");
          setState("error");
        });
    },
    [path],
  );

  const reload = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  useEffect(() => {
    load(false);
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  useEffect(() => {
    if (!live) return;

    // A phone that has been in a pocket has run nothing while it was there, so
    // waiting out the interval after it is picked up is the delay people notice.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    const timer = setInterval(refresh, live);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [live, refresh]);

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

  return { records, state, error, create, creating, reload, refresh };
}
