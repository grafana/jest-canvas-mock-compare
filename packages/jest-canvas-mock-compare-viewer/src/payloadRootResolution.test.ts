import { LOCALSTORAGE_PAYLOAD_ROOT_KEY } from './constants.ts';
import { getEffectivePayloadRoot, parsePayloadRootFromSearch } from './payloadRootResolution.ts';

describe('payloadRootResolution', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('parsePayloadRootFromSearch', () => {
    it('returns trimmed payloadRoot from query string', () => {
      expect(parsePayloadRootFromSearch('?payloadRoot=%2Ftmp%2Ff')).toBe('/tmp/f');
    });

    it('returns undefined when param missing', () => {
      expect(parsePayloadRootFromSearch('?file=a.json')).toBeUndefined();
    });
  });

  describe('getEffectivePayloadRoot', () => {
    it('persists value from URL to localStorage', () => {
      expect(getEffectivePayloadRoot('?payloadRoot=%2Fabs%2Fdir')).toBe('/abs/dir');
      expect(localStorage.getItem(LOCALSTORAGE_PAYLOAD_ROOT_KEY)).toBe('/abs/dir');
    });

    it('falls back to localStorage when URL omits payloadRoot', () => {
      localStorage.setItem(LOCALSTORAGE_PAYLOAD_ROOT_KEY, '/stored/path');
      expect(getEffectivePayloadRoot('?file=x.json')).toBe('/stored/path');
    });

    it('returns undefined when URL and storage both lack payloadRoot', () => {
      expect(getEffectivePayloadRoot('')).toBeUndefined();
    });

    it('URL wins over stale localStorage and updates storage', () => {
      localStorage.setItem(LOCALSTORAGE_PAYLOAD_ROOT_KEY, '/old');
      expect(getEffectivePayloadRoot('?payloadRoot=%2Fnew')).toBe('/new');
      expect(localStorage.getItem(LOCALSTORAGE_PAYLOAD_ROOT_KEY)).toBe('/new');
    });
  });
});
