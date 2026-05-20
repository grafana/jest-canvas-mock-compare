import { render, waitFor } from '@testing-library/react';
import type { CanvasRenderingContext2DEvent } from 'jest-canvas-mock';
import uPlot from 'uplot';
import { matchers, removeCanvasTransforms } from 'jest-canvas-mock-compare';

// IMPORTANT! You must extend expect with the exported matchers in order to make the `toMatchCanvasSnapshot` method avialable
expect.extend(matchers);

process.env.GEN_CANVAS_OUTPUT_ON_PASS = '1'; // Force output file generation on pass, otherwise visual diffs are not

describe('Examples', () => {
  describe('gradient', () => {
    test('linear and radial fill styles serialize addColorStop in snapshot', () => {
      const width = 100;
      const height = 50;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      const linear = ctx.createLinearGradient(0, 0, width, 0);
      linear.addColorStop(0, '#73BF69');
      linear.addColorStop(1, '#F2495C');
      ctx.fillStyle = linear;
      ctx.fillRect(0, 0, width, height / 2);

      const radial = ctx.createRadialGradient(width / 2, height * 0.75, 0, width / 2, height * 0.75, 40);
      radial.addColorStop(0, '#ffffff');
      radial.addColorStop(1, '#000000');
      ctx.fillStyle = radial;
      ctx.fillRect(0, height / 2, width, height / 2);

      expect(ctx.__getEvents()).toMatchCanvasSnapshot([], { width, height });
    });
  });

  test('should draw', () => {
    const canvas = new CanvasRenderingContext2D();

    render(<canvas id="canvas"></canvas>);
    expect(canvas).toBeDefined();
  });

  describe('uPlot', () => {
    const height = 400;
    const width = 400;
    let axisEvents: CanvasRenderingContext2DEvent[] | undefined, addedSeries: boolean;
    const setUp = () => {
      return new uPlot(
        {
          height,
          width,
          series: [{}, { stroke: 'red' }],
          hooks: {
            addSeries: [
              () => {
                addedSeries = true;
              },
            ],
            drawAxes: [
              (u) => {
                axisEvents = u.ctx.__getEvents();
                u.ctx.__clearEvents();
              },
            ],
          },
        },
        [
          [1000, 2000, 3000],
          [10, 11, 10],
        ]
      );
    };

    beforeEach(() => {
      axisEvents = undefined;
      addedSeries = false;
    });

    test('passes', async () => {
      const plot = setUp();
      await waitFor(() => expect(addedSeries).toBe(true));
      // removeCanvasTransforms will scrub out the identity transforms that take up a lot of unnecessary space in the snapshot file
      expect(removeCanvasTransforms(plot.ctx.__getEvents())).toMatchCanvasSnapshot(axisEvents!, { width, height });
    });

    // Remove the .skip from this test to see an example of a failing test in the debug tool.
    test.skip('fails', async () => {
      const plot = setUp();
      plot.setData([
        [1000, 2000, 3000, 4000],
        [10, 11, 10, 15],
      ]);
      await waitFor(() => expect(addedSeries).toBe(true));
      expect(removeCanvasTransforms(plot.ctx.__getEvents())).toMatchCanvasSnapshot(axisEvents!, { width, height });
    });
  });
});
