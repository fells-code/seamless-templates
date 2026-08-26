import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import type {
  FieldValues,
  LoadState,
  UseCollection,
  UseCollectionOptions,
} from "./types";

function isProvisional(record: { id: number | string }): boolean {
  return typeof record.id === "number" && record.id < 0;
}

// A task that scaled to zero takes tens of seconds to answer, so the retries have
// to outlast one comfortably before the screen is allowed to call it broken.
// These add up to about a minute and a half of waiting. The backoff caps early
// because the request costs nothing and somebody is sitting there watching.
const WAKE_FIRST_RETRY_MS = 1_000;
const WAKE_MAX_RETRY_MS = 8_000;
const WAKE_ATTEMPTS = 14;

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
 *
 * A first load that meets a sleeping API waits it out rather than failing. That
 * is what lets a generated application scale to zero, which is most of what it
 * costs to run.
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

  const wakeAttempt = useRef(0);
  const wakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelWake = useCallback(() => {
    if (wakeTimer.current !== null) {
      clearTimeout(wakeTimer.current);
      wakeTimer.current = null;
    }
  }, []);

  const load = useCallback(
    (background: boolean) => {
      // Answering a wake with an error screen is a refund; answering it with a
      // wait is a few seconds. Returns false once the wait has gone on longer
      // than a cold start can explain.
      const retryWake = () => {
        if (wakeAttempt.current >= WAKE_ATTEMPTS) return false;

        const delay = Math.min(
          WAKE_FIRST_RETRY_MS * 2 ** wakeAttempt.current,
          WAKE_MAX_RETRY_MS,
        );
        wakeAttempt.current += 1;

        setState("waking");
        wakeTimer.current = setTimeout(() => load(false), delay);
        return true;
      };

      const id = ++requestId.current;

      // Whatever this load is, it replaces any wake retry that was still queued.
      if (!background) cancelWake();

      // A background refresh swaps the records underneath the reader. Sending the
      // screen back to its skeleton every few seconds would be worse than a row
      // that is a moment out of date. A wake retry keeps the waking state for the
      // same reason: it is the same wait, not a new one.
      if (!background) {
        setState((current) => (current === "waking" ? current : "loading"));
      }

      apiFetch<T[]>(path)
        .then((data) => {
          if (id !== requestId.current) return;
          cancelWake();
          wakeAttempt.current = 0;
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
        .catch((cause) => {
          if (id !== requestId.current) return;
          // A refresh that fails says nothing: the records on screen are still the
          // last good ones, and an error the reader is part way through is not
          // this request's to replace.
          if (background) return;

          if (cause instanceof ApiError && cause.waking && retryWake()) return;

          // The window is spent, so the next attempt gets a fresh one. Somebody
          // pressing a retry button is asking for the whole wait again, not for
          // the same immediate refusal.
          wakeAttempt.current = 0;
          setError("We could not load this just now. Try again in a moment.");
          setState("error");
        });
    },
    [path, cancelWake],
  );

  const reload = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  useEffect(() => {
    load(false);
    return () => {
      requestId.current += 1;
      cancelWake();
    };
  }, [load, cancelWake]);

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
