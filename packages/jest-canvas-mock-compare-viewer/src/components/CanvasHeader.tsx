import type { CSSProperties } from 'react';

import { OVERLAY_BLEND_MODES } from '../constants.ts';

function toOverlayBlendMode(value: string): CSSProperties['mixBlendMode'] {
  return OVERLAY_BLEND_MODES.find((mode) => mode === value) ?? 'exclusion';
}

export function CanvasHeader(props: {
  onClick: () => void;
  showCanvasContext: boolean;
  showBlend: boolean;
  mixBlendMode: CSSProperties['mixBlendMode'];
  onChangeBlendMode: (mode: CSSProperties['mixBlendMode']) => void;
  title: string;
  hasCanvasContext: boolean;
}) {
  return (
    <div className="plot-header">
      <div className={'plot-label'}>{props.title}</div>
      <div className={'plot-action-wrap'}>
        {props.hasCanvasContext && (
          <button
            title={'Toggle additional canvas context outside the scope of the test. Shared between actual and expected'}
            className="plot-action-btn"
            type="button"
            onClick={props.onClick}
          >
            {props.showCanvasContext ? 'Hide canvas context' : 'Show canvas context'}
          </button>
        )}
        {props.showBlend ? (
          <select
            className="overlay-blend-select"
            value={props.mixBlendMode}
            onChange={(e) => props.onChangeBlendMode(toOverlayBlendMode(e.target.value))}
          >
            {OVERLAY_BLEND_MODES.map((mode) => (
              <option key={mode} value={mode}>
                Blend: {mode}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}
