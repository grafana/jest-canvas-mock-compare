import { type RefObject, useEffect } from 'react';
import { type CanvasReplayEvent, eventsToCanvasScript } from '../canvas/eventsToCanvas.ts';

export function useCanvasEventsEffect(
  ref: RefObject<HTMLCanvasElement | null>,
  events: CanvasReplayEvent[],
  setupEvents: CanvasReplayEvent[],
  includeSetup: boolean
) {
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    // identity transform and clearRect need to be called or toggling the uPlot canvas events doesn't work
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (includeSetup) {
      eventsToCanvasScript(setupEvents, context);
    }
    eventsToCanvasScript(events, context);
  }, [events, includeSetup, ref, setupEvents]);
}
