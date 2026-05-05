import { buildCompareViewerUrl } from './viewerLink.ts';

describe('buildCompareViewerUrl', () => {
  it('includes file and resolved payload root directory (encoding-safe)', () => {
    const u = buildCompareViewerUrl(
      'http://localhost:5173',
      'jest-canvas-compare-example.json',
      '/tmp/with space/.jest'
    );
    expect(u.pathname).toBe('/');
    expect(u.searchParams.get('file')).toBe('jest-canvas-compare-example.json');
    expect(u.searchParams.get('payloadRoot')).toBe('/tmp/with space/.jest');
  });

  it('preserves slash after base URL', () => {
    const u = buildCompareViewerUrl('http://host/', 'x.json', '/r');
    expect(u.href).toMatch(/^http:\/\/host\/\?/);
    expect(u.searchParams.get('file')).toBe('x.json');
  });
});
