import type { CanvasRenderingContext2DEvent } from 'jest-canvas-mock';

import { eventsToCanvasScript } from './eventsToCanvas.ts';

function makeCtx(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 50;
  return canvas.getContext('2d')!;
}

function event(type: string, props: Record<string, unknown>): CanvasRenderingContext2DEvent {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { type, transform: [1, 0, 0, 1, 0, 0], props } as CanvasRenderingContext2DEvent;
}

function gradientMock(value: unknown): { addColorStop: jest.Mock } {
  // The viewer reconstructs a real `CanvasGradient` from `jest-canvas-mock`, whose
  // `addColorStop` is a jest.fn we can introspect — but TypeScript only sees the DOM
  // `CanvasGradient` shape. Narrow once here so each test stays readable.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return value as { addColorStop: jest.Mock };
}

describe('eventsToCanvasScript gradient replay', () => {
  test('pairs the structured CanvasGradient placeholder with the most recent createLinearGradient and assigns it', () => {
    const ctx = makeCtx();
    const linearSpy = jest.spyOn(ctx, 'createLinearGradient');

    eventsToCanvasScript(
      [
        event('createLinearGradient', { x0: 0, y0: 0, x1: 0, y1: 50 }),
        event('strokeStyle', {
          value: {
            __kind: 'CanvasGradient',
            stops: [
              [0, '#73BF69ff'],
              [1, '#F2495Cff'],
            ],
          },
        }),
      ],
      ctx
    );

    expect(linearSpy).toHaveBeenCalledWith(0, 0, 0, 50);
    // The strokeStyle is now a real CanvasGradient (jest-canvas-mock's class) whose
    // addColorStop received both stops.
    const stroke = gradientMock(ctx.strokeStyle);
    expect(stroke.addColorStop).toBeDefined();
    expect(stroke.addColorStop.mock.calls).toEqual([
      [0, '#73BF69ff'],
      [1, '#F2495Cff'],
    ]);
  });

  test('FIFO-pairs interleaved gradients with stroke then fill', () => {
    const ctx = makeCtx();
    const linearSpy = jest.spyOn(ctx, 'createLinearGradient');

    eventsToCanvasScript(
      [
        event('createLinearGradient', { x0: 0, y0: 0, x1: 0, y1: 10 }),
        event('createLinearGradient', { x0: 0, y0: 20, x1: 0, y1: 30 }),
        event('strokeStyle', { value: { __kind: 'CanvasGradient', stops: [[0.5, '#111111']] } }),
        event('fillStyle', { value: { __kind: 'CanvasGradient', stops: [[0.5, '#222222']] } }),
      ],
      ctx
    );

    expect(linearSpy).toHaveBeenNthCalledWith(1, 0, 0, 0, 10);
    expect(linearSpy).toHaveBeenNthCalledWith(2, 0, 20, 0, 30);
    const stroke = gradientMock(ctx.strokeStyle);
    const fill = gradientMock(ctx.fillStyle);
    expect(stroke.addColorStop.mock.calls).toEqual([[0.5, '#111111']]);
    expect(fill.addColorStop.mock.calls).toEqual([[0.5, '#222222']]);
  });

  test('still assigns solid color strings without consuming any pending gradient', () => {
    const ctx = makeCtx();

    eventsToCanvasScript(
      [
        event('createLinearGradient', { x0: 0, y0: 0, x1: 0, y1: 50 }),
        event('strokeStyle', { value: '#ff0000' }),
        event('fillStyle', { value: { __kind: 'CanvasGradient', stops: [[0, '#aabbcc']] } }),
      ],
      ctx
    );

    // Solid color was assigned literally
    expect(ctx.strokeStyle).toBe('#ff0000');
    // The previously-created gradient is consumed by the *fillStyle* assignment, not the stroke
    const fill = gradientMock(ctx.fillStyle);
    expect(fill.addColorStop.mock.calls).toEqual([[0, '#aabbcc']]);
  });

  test('replay state is per-call so two consecutive scripts do not leak gradients', () => {
    const ctx = makeCtx();
    const linearSpy = jest.spyOn(ctx, 'createLinearGradient');

    // First script leaves an unconsumed gradient in its local queue.
    eventsToCanvasScript([event('createLinearGradient', { x0: 0, y0: 0, x1: 0, y1: 50 })], ctx);

    // Second script's strokeStyle should *not* see that gradient — it falls back to a
    // throwaway zero-extent gradient instead.
    eventsToCanvasScript([event('strokeStyle', { value: { __kind: 'CanvasGradient', stops: [[0, '#deadbe']] } })], ctx);

    // Two creations recorded: one from the first call (the leaked one) and one fallback from the
    // second call.
    expect(linearSpy).toHaveBeenCalledTimes(2);
    expect(linearSpy).toHaveBeenLastCalledWith(0, 0, 0, 0);
  });
});
