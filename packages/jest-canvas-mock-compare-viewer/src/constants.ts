import type { CSSProperties } from 'react';

/** HTTP path for dynamic payload routing (matcher links include matching `payloadRoot` query params). */
export const CANVAS_COMPARE_PAYLOAD_API_PATH = '/__jest-canvas-payload__';

/** Last successful `payloadRoot` from the URL, so the viewer still resolves payloads after that query param is removed. */
export const LOCALSTORAGE_PAYLOAD_ROOT_KEY = 'jest-canvas-mock-compare.payloadRoot';

export const OVERLAY_BLEND_MODES: Array<CSSProperties['mixBlendMode']> = [
  'plus-lighter',
  'color',
  'difference',
  'exclusion',
  'luminosity',
  'screen',
];
