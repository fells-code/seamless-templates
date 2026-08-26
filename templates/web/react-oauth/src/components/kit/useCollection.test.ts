import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "../../lib/api";
import { useCollection } from "./useCollection";

// Only the request is mocked. `ApiError` stays the real class, because telling a
// wake from a fault is the thing under test.
vi.mock("../../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/api")>()),
  apiFetch: vi.fn(),
}));

interface Note {
  id: number | string;
  body: string;
}

const fetched = vi.mocked(apiFetch);

// The hook is named through a wrapper rather than called from an anonymous
// callback, so the rules-of-hooks lint sees one hook calling another.
function useNotes(live?: number) {
  return useCollection<Note>("/notes", live === undefined ? {} : { live });
}

function answerWith(...pages: Note[][]) {
  for (const page of pages) fetched.mockResolvedValueOnce(page);
}

/** Lets a pending fetch settle and React apply whatever it set. */
async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
  });
}

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => value,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  fetched.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
  setVisibility("visible");
});

describe("useCollection", () => {
  it("loads once and stays put when no options are given", async () => {
    answerWith([{ id: 1, body: "first" }]);

    const view = renderHook(() => useNotes());
    await settle();

    expect(view.result.current.state).toBe("ready");
    expect(view.result.current.records).toEqual([{ id: 1, body: "first" }]);

    await advance(60_000);
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
    await settle();

    expect(fetched).toHaveBeenCalledTimes(1);
  });

  it("picks up a record added elsewhere without showing the loading state", async () => {
    answerWith([{ id: 1, body: "first" }]);

    const view = renderHook(() => useNotes(5_000));
    await settle();

    let answer: (notes: Note[]) => void = () => {};
    fetched.mockImplementationOnce(
      () =>
        new Promise<Note[]>((resolve) => {
          answer = resolve;
        }),
    );

    await advance(5_000);

    expect(fetched).toHaveBeenCalledTimes(2);
    expect(view.result.current.state).toBe("ready");

    await act(async () => {
      answer([
        { id: 2, body: "second" },
        { id: 1, body: "first" },
      ]);
    });

    expect(view.result.current.records.map((note) => note.id)).toEqual([2, 1]);
    expect(view.result.current.state).toBe("ready");
  });

  it("refreshes when the window is looked at again", async () => {
    answerWith([{ id: 1, body: "first" }], [{ id: 1, body: "edited" }]);

    const view = renderHook(() => useNotes(60_000));
    await settle();

    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await settle();

    expect(fetched).toHaveBeenCalledTimes(2);
    expect(view.result.current.records[0].body).toBe("edited");
  });

  it("keeps a record that is still being created", async () => {
    answerWith([{ id: 1, body: "first" }]);

    const view = renderHook(() => useNotes(5_000));
    await settle();

    // The post never settles, so the provisional record is still on screen when
    // the poll answers without it.
    fetched.mockImplementationOnce(() => new Promise<never>(() => {}));
    act(() => {
      void view.result.current.create({ body: "mine" });
    });

    answerWith([{ id: 1, body: "first" }]);
    await advance(5_000);

    expect(view.result.current.records.map((note) => note.body)).toEqual([
      "mine",
      "first",
    ]);
    expect(view.result.current.records[0].id).toBe(-1);
  });

  it("removes its interval and listeners when it unmounts", async () => {
    answerWith([{ id: 1, body: "first" }]);

    const view = renderHook(() => useNotes(5_000));
    await settle();

    view.unmount();

    await advance(60_000);
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
    await settle();

    expect(fetched).toHaveBeenCalledTimes(1);
  });

  it("waits out a sleeping API instead of calling it broken", async () => {
    fetched.mockRejectedValueOnce(new ApiError("API error: 503 ", 503));
    answerWith([{ id: 1, body: "first" }]);

    const view = renderHook(() => useNotes());
    await settle();

    expect(view.result.current.state).toBe("waking");
    expect(view.result.current.error).toBeNull();

    // Nobody presses anything. The retry is the point.
    await advance(1_000);

    expect(view.result.current.state).toBe("ready");
    expect(view.result.current.records).toEqual([{ id: 1, body: "first" }]);
  });

  it("keeps saying it is waking while it retries", async () => {
    fetched.mockRejectedValueOnce(new ApiError("API error: 503 ", 503));
    // The retried request stays in flight, which is where a skeleton would show
    // through if the retry reset the state instead of keeping it.
    fetched.mockImplementationOnce(() => new Promise<Note[]>(() => {}));

    const view = renderHook(() => useNotes());
    await settle();

    await advance(1_000);

    expect(fetched).toHaveBeenCalledTimes(2);
    expect(view.result.current.state).toBe("waking");
  });

  it("shows an error straight away for a failure a cold start cannot explain", async () => {
    fetched.mockRejectedValueOnce(new ApiError("API error: 404 ", 404));

    const view = renderHook(() => useNotes());
    await settle();

    expect(view.result.current.state).toBe("error");
    expect(view.result.current.error).toBeTruthy();

    await advance(60_000);

    expect(fetched).toHaveBeenCalledTimes(1);
  });

  it("stops waiting once the wait is longer than a cold start", async () => {
    fetched.mockRejectedValue(new ApiError("API error: 503 ", 503));

    const view = renderHook(() => useNotes());
    await settle();

    expect(view.result.current.state).toBe("waking");

    for (let tick = 0; tick < 20; tick += 1) await advance(8_000);

    expect(view.result.current.state).toBe("error");
    expect(view.result.current.error).toBeTruthy();

    const calls = fetched.mock.calls.length;
    await advance(60_000);
    expect(fetched).toHaveBeenCalledTimes(calls);
  });

  it("stops retrying a wake when it unmounts", async () => {
    fetched.mockRejectedValue(new ApiError("API error: 503 ", 503));

    const view = renderHook(() => useNotes());
    await settle();

    expect(fetched).toHaveBeenCalledTimes(1);
    view.unmount();

    await advance(60_000);

    expect(fetched).toHaveBeenCalledTimes(1);
  });
});
