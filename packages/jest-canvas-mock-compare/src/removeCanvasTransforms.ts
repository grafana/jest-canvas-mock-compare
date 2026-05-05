import type { CanvasRenderingContext2DEvent } from 'jest-canvas-mock';

/** Drop `transform` from each mocked canvas event (and nested path segments) before snapshot comparison. */
export function removeCanvasTransforms(
  events: CanvasRenderingContext2DEvent[]
): Array<Omit<CanvasRenderingContext2DEvent, 'transform'>> {
  return events.map(({ transform: _ignored, ...event }) =>
    event.props.path
      ? {
          ...event,
          props: {
            ...event.props,
            path: removeCanvasTransforms(event.props.path),
          },
        }
      : event
  );
}
