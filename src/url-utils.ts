import type { ExtractRouteParams } from "./types.js";

/** Replaces `:param` segments in a route template with concrete values. */
export function buildUrl<Path extends string>(
  path: Path,
  params: ExtractRouteParams<Path> extends Record<string, never>
    ? Record<string, never> | undefined
    : ExtractRouteParams<Path>,
): string {
  let result: string = path;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(`:${key}`, encodeURIComponent(String(value)));
    }
  }

  return result;
}

/** Serializes query params into `?key=value&...` (omits undefined). */
export function buildQuery(
  query: Record<string, string | number | boolean | undefined>,
): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }
    parts.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );
  }

  return parts.length > 0 ? `?${parts.join("&")}` : "";
}
