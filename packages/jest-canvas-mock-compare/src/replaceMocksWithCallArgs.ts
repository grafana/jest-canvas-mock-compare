import type { CanvasRenderingContext2DEvent } from 'jest-canvas-mock';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function serializeMockFunctions(value: unknown): unknown {
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, prop]) => [key, jest.isMockFunction(prop) ? prop.mock.calls : prop])
    );
  }
  return value;
}

/**
 * Jest canvas mock serializes some canvas events as jest mocks e.g. CanvasGradient, CanvasPattern, ImageBitmap
 * This breaks the output as JSON assumption, and includes additional unnecessary markup in the snapshot.
 *
 * This was written specifically to support `CanvasGradient`, it might require some modification for other jest mocks in the CanvasRenderingContext2DEvent output in jest-canvas-mock
 * @param events
 */
export function replaceMocksWithCallArgs(
  events: CanvasRenderingContext2DEvent[] | Array<Omit<CanvasRenderingContext2DEvent, 'transform'>>
) {
  return events.map((event) => {
    if (!('value' in event.props)) {
      return event;
    }
    const next = serializeMockFunctions(event.props.value);
    if (next === event.props.value) {
      return event;
    }
    return { ...event, props: { ...event.props, value: next } };
  });
}
