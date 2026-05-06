import { isSafePayloadBasename, normalizePayloadFileQueryParam } from './normalizePayloadFileParam.ts';

describe('isSafePayloadBasename', () => {
  it('accepts plain compare payload names', () => {
    expect(isSafePayloadBasename('jest-canvas-compare-drawMarkers_events.json?_=123456789')).toBe(true);
  });

  it('rejects path segments and traversal', () => {
    expect(isSafePayloadBasename('../foo.json?_=123')).toBe(false);
    expect(isSafePayloadBasename('a/b.json?_=123')).toBe(false);
  });
});

describe('normalizePayloadFileQueryParam', () => {
  it('returns basename for absolute posix paths', () => {
    expect(
      normalizePayloadFileQueryParam(
        '/Users/galen/grafana/.jest-canvas-mock-compare/jest-canvas-compare-drawMarkers_events.json'
      )
    ).toBe('jest-canvas-compare-drawMarkers_events.json');
  });

  it('returns basename for Windows-style paths', () => {
    expect(normalizePayloadFileQueryParam('C:\\workspace\\.jest-canvas-mock-compare\\payload.json')).toBe(
      'payload.json'
    );
  });

  it('handles file:/// URLs', () => {
    expect(
      normalizePayloadFileQueryParam('file:///Users/dev/project/.jest-canvas-mock-compare/jest-canvas-compare-foo.json')
    ).toBe('jest-canvas-compare-foo.json');
  });

  it('still accepts basename-only input', () => {
    expect(normalizePayloadFileQueryParam('jest-canvas-compare-foo.json')).toBe('jest-canvas-compare-foo.json');
  });

  it('returns null for invalid values', () => {
    expect(normalizePayloadFileQueryParam('/etc/passwd')).toBe(null);
    expect(normalizePayloadFileQueryParam('')).toBe(null);
    expect(normalizePayloadFileQueryParam('   ')).toBe(null);
  });
});
