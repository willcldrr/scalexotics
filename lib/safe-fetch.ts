/**
 * Bounded fetch wrapper.
 *
 * Serverless functions can silently burn their entire timeout budget on a
 * single stalled upstream request (dead DNS, slow webhook target, provider
 * incident). This wrapper applies an AbortSignal.timeout around every call so
 * hanging connections fail fast and release the function.
 *
 * Default timeout is deliberately short (10s) for outbound API calls on the
 * customer-facing request path. Longer-running background jobs (cron imports,
 * OAuth exchanges with slow providers) can override via the `timeoutMs` option.
 */

export interface SafeFetchOptions extends RequestInit {
  /** Abort the request after this many milliseconds. Default 10_000. */
  timeoutMs?: number
}

/**
 * fetch(), but with a hard timeout. Throws a TimeoutError-style DOMException
 * if the upstream stalls past `timeoutMs`. Respects any caller-provided signal
 * by chaining it with the timeout signal via AbortSignal.any when available.
 */
export async function safeFetch(
  input: RequestInfo | URL,
  options: SafeFetchOptions = {}
): Promise<Response> {
  const { timeoutMs = 10_000, signal: callerSignal, ...init } = options

  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  // AbortSignal.any is available on modern Node; if a caller signal is also
  // passed, combine them so either side can cancel.
  const signal =
    callerSignal && typeof (AbortSignal as unknown as { any?: unknown }).any === "function"
      ? (AbortSignal as unknown as { any: (signals: AbortSignal[]) => AbortSignal }).any([
          callerSignal,
          timeoutSignal,
        ])
      : timeoutSignal

  return fetch(input, { ...init, signal })
}
