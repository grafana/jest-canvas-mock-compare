import { LOCALSTORAGE_PAYLOAD_ROOT_KEY } from './constants.ts';

/** Read `payloadRoot` from `window.location.search` or equivalent. */
export function parsePayloadRootFromSearch(locationSearch: string): string | undefined {
  const q = locationSearch.startsWith('?') ? locationSearch.slice(1) : locationSearch;
  const raw = new URLSearchParams(q).get('payloadRoot')?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}

function readStoredPayloadRoot(): string | undefined {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_PAYLOAD_ROOT_KEY)?.trim();
    return raw && raw.length > 0 ? raw : undefined;
  } catch {
    return undefined;
  }
}

function persistPayloadRoot(absoluteDir: string): void {
  try {
    localStorage.setItem(LOCALSTORAGE_PAYLOAD_ROOT_KEY, absoluteDir);
  } catch {
    // Private browsing / quota — ignore
  }
}

/**
 * Prefer `payloadRoot` from the current URL; when present, persist it to localStorage.
 * When the param is missing, reuse the last stored path so navigation without `payloadRoot` still works.
 */
export function getEffectivePayloadRoot(locationSearch: string): string | undefined {
  const fromUrl = parsePayloadRootFromSearch(locationSearch);
  if (fromUrl) {
    persistPayloadRoot(fromUrl);
    return fromUrl;
  }
  return readStoredPayloadRoot();
}
