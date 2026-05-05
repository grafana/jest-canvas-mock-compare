/**
 * Canonical compare-viewer URL (query includes payload directory so consumers can open the diff from test output).
 */
export function buildCompareViewerUrl(baseUrlRaw: string, publicBasename: string, payloadRoot: string): URL {
  const baseUrl = baseUrlRaw.endsWith('/') ? baseUrlRaw : `${baseUrlRaw}/`;
  const compareUrl = new URL(baseUrl);
  compareUrl.searchParams.set('file', publicBasename);
  compareUrl.searchParams.set('payloadRoot', payloadRoot);
  return compareUrl;
}
