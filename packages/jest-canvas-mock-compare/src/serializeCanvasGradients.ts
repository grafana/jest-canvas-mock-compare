import type { CanvasRenderingContext2DEvent } from 'jest-canvas-mock';

/**
 * Structured replacement for a `CanvasGradient` instance in a serialized event stream.
 *
 * `JSON.stringify` of a `CanvasGradient` produces `{}` because `addColorStop` is a function;
 * the gradient's color stops live on the jest mock metadata (`addColorStop.mock.calls`), which
 * is not enumerable. This shape captures the stops in plain JSON so they survive serialization
 * and can be replayed by the viewer.
 *
 * Gradient *geometry* (the `createLinearGradient(x0,y0,x1,y1)` event) is left untouched in the
 * event stream — the viewer pairs stops with geometry via a FIFO queue at replay time.
 */
export type SerializedCanvasGradient = {
  __kind: 'CanvasGradient';
  stops: Array<[number, string]>;
};

// TODO import this from the jest-canvas-mock package
export function isSerializedCanvasGradient(value: unknown): value is SerializedCanvasGradient {
  return (
    typeof value === 'object' &&
    value !== null &&
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (value as { __kind?: unknown }).__kind === 'CanvasGradient' &&
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    Array.isArray((value as { stops?: unknown }).stops)
  );
}

/**
 * Duck-typed detection of a jest-canvas-mock `CanvasGradient` instance. The class isn't
 * re-exported from `jest-canvas-mock`'s entry, so we recognize it by the mocked
 * `addColorStop` signature.
 */
function isMockedCanvasGradient(value: unknown): value is { addColorStop: { mock: { calls: Array<[number, string]> } } } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const candidate = (value as { addColorStop?: unknown }).addColorStop;
  return (
    typeof candidate === 'function' &&
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    Array.isArray((candidate as { mock?: { calls?: unknown } }).mock?.calls)
  );
}

function extractStops(gradient: { addColorStop: { mock: { calls: Array<[number, string]> } } }): Array<[number, string]> {
  return gradient.addColorStop.mock.calls.map(([offset, color]) => [Number(offset), String(color)]);
}

/**
 * Walk a captured event stream and replace any `CanvasGradient` value seen on a `strokeStyle`
 * or `fillStyle` event with a JSON-safe structured placeholder. The original event array is
 * not mutated.
 *
 * Solid color assignments and unrelated events pass through unchanged.
 */
export function serializeCanvasGradients(events: CanvasRenderingContext2DEvent[]): CanvasRenderingContext2DEvent[] {
  return events.map((event) => {
    if (event.props?.path && Array.isArray(event.props.path)) {
      return {
        ...event,
        props: {
          ...event.props,
          path: serializeCanvasGradients(event.props.path),
        },
      };
    }
    if (event.type !== 'strokeStyle' && event.type !== 'fillStyle') {
      return event;
    }
    const value = event.props?.value;
    if (!isMockedCanvasGradient(value)) {
      return event;
    }
    const serialized: SerializedCanvasGradient = {
      __kind: 'CanvasGradient',
      stops: extractStops(value),
    };
    return {
      ...event,
      props: {
        ...event.props,
        value: serialized,
      },
    };
  });
}
