import type { CanvasRenderingContext2DEvent } from 'jest-canvas-mock';
import { replaceMocksWithCallArgs } from './replaceMocksWithCallArgs.ts';

const IDENTITY_TRANSFORM: CanvasRenderingContext2DEvent['transform'] = [1, 0, 0, 1, 0, 0];

function makeMockGradient(stops: Array<[number, string]>) {
  const addColorStop = jest.fn();
  for (const [offset, color] of stops) {
    addColorStop(offset, color);
  }
  return { addColorStop };
}

function styleEvent(type: string, value: unknown): CanvasRenderingContext2DEvent {
  return {
    type,
    transform: IDENTITY_TRANSFORM,
    props: { value },
  };
}

const thresholdStroke = styleEvent(
  'strokeStyle',
  makeMockGradient([
    [0, '#73BF69ff'],
    [0.5, '#73BF69ff'],
    [1, '#F2495Cff'],
  ])
);

const hueFill = styleEvent(
  'fillStyle',
  makeMockGradient([
    [0, 'rgba(197, 173, 160, 0.17)'],
    [1, 'rgba(90, 90, 90, 0.17)'],
  ])
);

const fillPathEvent: CanvasRenderingContext2DEvent = {
  type: 'fill',
  transform: IDENTITY_TRANSFORM,
  props: {
    fillRule: 'nonzero',
    path: [{ type: 'lineTo', transform: IDENTITY_TRANSFORM, props: { x: 0, y: 1 } }],
  },
};

describe('replaceMockMethodsWithCallArgs', () => {
  it('serializes CanvasGradient on strokeStyle (3 stops, threshold)', () => {
    const input = [thresholdStroke];
    const out = replaceMocksWithCallArgs(input);

    expect(out[0].props.value).toEqual({
      addColorStop: [
        [0, '#73BF69ff'],
        [0.5, '#73BF69ff'],
        [1, '#F2495Cff'],
      ],
    });
  });

  it('serializes fillStyle rgba gradient (2 stops)', () => {
    const out = replaceMocksWithCallArgs([hueFill]);
    expect(out[0].props.value).toEqual({
      addColorStop: [
        [0, 'rgba(197, 173, 160, 0.17)'],
        [1, 'rgba(90, 90, 90, 0.17)'],
      ],
    });
  });

  it('leaves primitive value events unchanged', () => {
    const event = styleEvent('lineWidth', 1);
    const out = replaceMocksWithCallArgs([event]);
    expect(out[0]).toBe(event);
    expect(out[0].props.value).toBe(1);
  });

  it('leaves path-only draw events unchanged', () => {
    const out = replaceMocksWithCallArgs([fillPathEvent]);
    expect(out[0]).toBe(fillPathEvent);
  });
});
