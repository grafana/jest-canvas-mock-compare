import { render, waitFor } from '@testing-library/react';
import type { CanvasRenderingContext2DEvent } from 'jest-canvas-mock';
import uPlot from 'uplot';
import { matchers, removeCanvasTransforms } from 'jest-canvas-mock-compare';

// IMPORTANT! You must extend expect with the exported matchers in order to make the `toMatchCanvasSnapshot` method avialable
expect.extend(matchers);

describe('Examples', () => {
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
      process.env.GEN_CANVAS_OUTPUT_ON_PASS = '1'; // Force output file generation on pass, otherwise visual diffs are not
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
