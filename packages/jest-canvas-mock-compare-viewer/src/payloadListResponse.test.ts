import { readRemotePayloadListResponse } from './payloadListResponse.ts';

describe('readRemotePayloadListResponse', () => {
  it('accepts list-only responses', () => {
    const r = readRemotePayloadListResponse({ ok: true, files: ['a.json', 'b.json'] });
    expect(r).toEqual({ files: ['a.json', 'b.json'] });
  });

  it('accepts optional meta map', () => {
    const r = readRemotePayloadListResponse({
      ok: true,
      files: ['x.json'],
      meta: {
        'x.json': { snapshotAssertionPassed: true, modifiedMs: 1_700_000_000_000 },
      },
    });
    expect(r?.files).toEqual(['x.json']);
    expect(r?.meta?.['x.json']?.snapshotAssertionPassed).toBe(true);
    expect(r?.meta?.['x.json']?.modifiedMs).toBe(1_700_000_000_000);
  });

  it('rejects malformed file entries', () => {
    expect(readRemotePayloadListResponse({ ok: true, files: ['../evil.json'] })).toBe(undefined);
    expect(readRemotePayloadListResponse({ ok: false, files: ['a.json'] })).toBe(undefined);
  });
});
