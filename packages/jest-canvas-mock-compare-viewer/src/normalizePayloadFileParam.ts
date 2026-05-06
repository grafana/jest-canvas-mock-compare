/** True when `name` is a single path segment ending in `.json` (safe to serve as a static basename). */
export function isSafePayloadBasename(name: string): boolean {
  if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) {
    return false;
  }
  return /^[\w.-]+\.json$/.test(name);
}

/**
 * Normalize the `file` query param for the compare viewer.
 * Accept a bare basename, a filesystem path (only the basename is used for fetch),
 * or a `file:///...` URL pasted from macOS/Linux file managers.
 */
export function normalizePayloadFileQueryParam(raw: string): string | null {
  let s = raw.trim();
  if (!s) {
    return null;
  }

  if (s.startsWith('file:')) {
    try {
      s = decodeURIComponent(new URL(s).pathname);
    } catch {
      return null;
    }
  }

  const base = s.includes('/') || s.includes('\\') ? (s.split(/[/\\]/).filter(Boolean).pop() ?? s) : s;

  return isSafePayloadBasename(base) ? base : null;
}
