import type { CanvasRenderingContext2DEvent } from 'jest-canvas-mock';

import { isSerializedCanvasGradient, serializeCanvasGradients } from './serializeCanvasGradients.ts';

function createMockedCanvasGradient(stops: Array<[number, string]>) {
  const addColorStop = jest.fn();
  for (const [offset, color] of stops) {
    addColorStop(offset, color);
  }
  return { addColorStop };
}

describe('serializeCanvasGradients', () => {
  test('rewrites strokeStyle CanvasGradient values into a plain placeholder', () => {
    const gradient = createMockedCanvasGradient([
      [0, '#73BF69ff'],
      [1, '#F2495Cff'],
    ]);
    const events: CanvasRenderingContext2DEvent[] = [
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      { type: 'strokeStyle', transform: [1, 0, 0, 1, 0, 0], props: { value: gradient } } as CanvasRenderingContext2DEvent,
    ];

    const out = serializeCanvasGradients(events);

    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('strokeStyle');
    expect(out[0].props.value).toEqual({
      __kind: 'CanvasGradient',
      stops: [
        [0, '#73BF69ff'],
        [1, '#F2495Cff'],
      ],
    });
    // Solid input event was not mutated
    expect(events[0].props.value).toBe(gradient);
  });

  test('rewrites fillStyle CanvasGradient values and leaves solid colors alone', () => {
    const gradient = createMockedCanvasGradient([[0, '#ff0000']]);
    const events: CanvasRenderingContext2DEvent[] = [
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      { type: 'fillStyle', transform: [1, 0, 0, 1, 0, 0], props: { value: gradient } } as CanvasRenderingContext2DEvent,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      { type: 'strokeStyle', transform: [1, 0, 0, 1, 0, 0], props: { value: '#00ff00' } } as CanvasRenderingContext2DEvent,
    ];

    const out = serializeCanvasGradients(events);

    expect(isSerializedCanvasGradient(out[0].props.value)).toBe(true);
    expect(out[1].props.value).toBe('#00ff00');
  });

  test('recurses into nested path arrays so Path2D-encoded fills are also serialized', () => {
    const gradient = createMockedCanvasGradient([
      [0, '#aaa'],
      [1, '#bbb'],
    ]);
    const events: CanvasRenderingContext2DEvent[] = [
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {
        type: 'fill',
        transform: [1, 0, 0, 1, 0, 0],
        props: {
          fillRule: 'nonzero',
          path: [{ type: 'strokeStyle', transform: [1, 0, 0, 1, 0, 0], props: { value: gradient } }],
        },
      } as CanvasRenderingContext2DEvent,
    ];

    const out = serializeCanvasGradients(events);

    expect(isSerializedCanvasGradient(out[0].props.path[0].props.value)).toBe(true);
  });

  test('passes through non-gradient values untouched (e.g. createLinearGradient geometry)', () => {
    const events: CanvasRenderingContext2DEvent[] = [
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {
        type: 'createLinearGradient',
        transform: [1, 0, 0, 1, 0, 0],
        props: { x0: 0, y0: 0, x1: 0, y1: 25 },
      } as CanvasRenderingContext2DEvent,
    ];

    expect(serializeCanvasGradients(events)).toEqual(events);
  });
});
