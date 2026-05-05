import { CANVAS_COMPARE_PAYLOAD_API_PATH } from './constants.ts';

export { getEffectivePayloadRoot, parsePayloadRootFromSearch } from './payloadRootResolution.ts';

export function buildComparePayloadFetchUrl(basename: string, options: { payloadRoot: string }): string {
  const u = new URL(CANVAS_COMPARE_PAYLOAD_API_PATH, window.location.origin);
  u.searchParams.set('payloadRoot', options.payloadRoot);
  u.searchParams.set('file', basename);
  return u.toString();
}

export function buildComparePayloadListUrl(payloadRoot: string, options?: { meta?: boolean }): string {
  const u = new URL(CANVAS_COMPARE_PAYLOAD_API_PATH, window.location.origin);
  u.searchParams.set('payloadRoot', payloadRoot);
  u.searchParams.set('list', '1');
  if (options?.meta) {
    u.searchParams.set('meta', '1');
  }
  return u.toString();
}
