/*
 * Copyright © 2026 Fells Code, LLC
 * Licensed under the GNU Affero General Public License v3.0
 * See LICENSE file in the project root for full license information
 */

import { getApiUrl, MISSING_API_URL_MESSAGE } from "./runtimeConfig";

export const API_URL = getApiUrl();

export function buildApiUrl(path: string): string {
  if (!API_URL) {
    throw new Error(MISSING_API_URL_MESSAGE);
  }

  const baseUrl = API_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

/*
 * A load balancer with no healthy target behind it answers 502, 503 or 504 while
 * the task is starting. A browser reports a cross-origin answer it was not
 * allowed to read as no answer at all, so a load balancer's own 503, which
 * carries none of the API's CORS headers, reaches this code as a rejected fetch
 * rather than as a status. Both are what a wake looks like from here.
 *
 * Being offline is the one case that is genuinely not a wake, and it is the one
 * the browser is sure about, so it is the only thing this rules out.
 */
function looksLikeWaking(status: number | null): boolean {
  if (status === null) return navigator.onLine !== false;

  return status === 502 || status === 503 || status === 504;
}

/**
 * Why a request failed, in the one distinction a screen has to make.
 *
 * An application whose API scales to zero is woken by the first request after an
 * idle spell, and that takes tens of seconds. It is not broken, and the person
 * most likely to meet it is the one who was sent a link and has never seen the
 * application before, so the difference has to survive as far as the screen.
 */
export class ApiError extends Error {
  /** Null when the browser never got an answer it was allowed to read. */
  readonly status: number | null;

  /** The failure is consistent with an API that is still starting up. */
  readonly waking: boolean;

  constructor(message: string, status: number | null, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApiError";
    this.status = status;
    this.waking = looksLikeWaking(status);
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});

  headers.set("Content-Type", "application/json");

  // Outside the try: a missing origin is a configuration mistake, and dressing it
  // up as an API that has not answered yet would leave the screen waiting
  // patiently for something that is never coming.
  const url = buildApiUrl(path);

  let res: Response;
  try {
    res = await fetch(url, {
      credentials: "include",
      ...options,
      headers,
    });
  } catch (cause) {
    throw new ApiError("The API did not answer.", null, { cause });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(`API error: ${res.status} ${text}`, res.status);
  }

  return res.json();
}
