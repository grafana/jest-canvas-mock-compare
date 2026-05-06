import type { CanvasRenderingContext2DEvent } from 'jest-canvas-mock';
import type { JestCanvasMockComparePayload } from 'jest-canvas-mock-compare';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { useAcceptBaseline } from '../hooks/useAcceptBaseline.ts';
import { usePayloadIndex } from '../hooks/usePayloadIndex.ts';
import { isSafePayloadBasename, normalizePayloadFileQueryParam } from '../normalizePayloadFileParam.ts';
import { buildComparePayloadFetchUrl, getEffectivePayloadRoot } from '../payloadApi.ts';
import { isCanvasComparePayload } from '../testUtils.ts';
import type { ResolvedPayload } from '../types.ts';
import { findNextFailedBasename, sortPayloadFilesForIndex } from '../utils/payloadIndexSort.ts';

import { ComparePlots } from './ComparePlots.tsx';
import { TestList } from './TestList.tsx';

type ViewState =
  | { kind: 'loading' }
  | { kind: 'ready'; payload: ResolvedPayload }
  | { kind: 'blocked'; error?: string; hint?: string };

const FALLBACK_CANVAS_WIDTH = 400;
const FALLBACK_CANVAS_HEIGHT = 200;

function readPayloadDimensions(raw: JestCanvasMockComparePayload): Pick<ResolvedPayload, 'width' | 'height'> {
  return { width: raw.width, height: raw.height };
}

export const CompareCanvas = ({ defaultWidth = FALLBACK_CANVAS_WIDTH, defaultHeight = FALLBACK_CANVAS_HEIGHT }) => {
  const [view, setView] = useState<ViewState>({ kind: 'loading' });
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState(() => window.location.search);

  const payloadRoot = useMemo(() => getEffectivePayloadRoot(locationSearch), [locationSearch]);

  const {
    fetchKind: remoteFetchKind,
    files: remoteFiles,
    fileSnapshotAssertionPassed,
    fileModifiedLabels,
    fileModifiedTimestampMs,
  } = usePayloadIndex(payloadRoot);

  const resetAcceptBaselineRef = useRef<(() => void) | null>(null);

  const applyPayload = useCallback(
    (raw: JestCanvasMockComparePayload, sourceLabel: string, options?: { resetJestActions?: boolean }) => {
      if (!isCanvasComparePayload(raw)) {
        setView({
          kind: 'blocked',
          error: `${sourceLabel}: not a valid uplot snapshot payload`,
          hint: 'Paste the JSON logged by toMatchCanvasSnapshot or choose a payload file.',
        });
        return;
      }
      if (options?.resetJestActions !== false) {
        resetAcceptBaselineRef.current?.();
      }
      setView({
        kind: 'ready',
        payload: {
          testName: raw.testName,
          testPath: typeof raw.testPath === 'string' ? raw.testPath : undefined,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          expected: raw.expected as CanvasRenderingContext2DEvent[],
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          actual: raw.actual as CanvasRenderingContext2DEvent[],
          uPlotCanvasEvents: Array.isArray(raw.canvasContextEvents) ? raw.canvasContextEvents : [],
          ...readPayloadDimensions(raw),
          snapshotAssertionPassed: raw.snapshotAssertionPassed,
        },
      });
    },
    []
  );

  const { acceptBaselineState, resetAcceptBaselineState, onRerunTest, onAcceptBaseline } = useAcceptBaseline({
    applyPayload,
    selectedFile,
    payloadRoot,
  });

  resetAcceptBaselineRef.current = resetAcceptBaselineState;

  useEffect(() => {
    const onPop = () => setLocationSearch(window.location.search);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const effectiveBasenames = remoteFiles;

  const navigate = useCallback((basename: string, mode: 'push' | 'replace') => {
    const url = new URL(window.location.href);
    url.searchParams.set('file', basename);
    if (mode === 'push') {
      window.history.pushState({ file: basename }, '', url);
    } else {
      window.history.replaceState({ file: basename }, '', url);
    }
    setLocationSearch(url.search);
  }, []);

  const navigateToIndex = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('file');
    window.history.pushState({}, '', url);
    setLocationSearch(url.search);
    setSelectedFile(null);
    resetAcceptBaselineState();
    setView({
      kind: 'blocked',
      hint: 'Choose a payload file from the list.',
    });
  }, [resetAcceptBaselineState]);

  const setTest = useCallback(
    async (basename: string, historyMode?: 'push' | 'replace') => {
      if (!payloadRoot) {
        setView({
          kind: 'blocked',
          error: `${basename}: cannot load without payloadRoot.`,
          hint: 'Open using the compare link from your test output, or run the compare CLI from the project root.',
        });
        return;
      }
      if (!isSafePayloadBasename(basename)) {
        setView({
          kind: 'blocked',
          error: `${basename}: invalid payload filename.`,
          hint: 'Select one of the listed JSON files.',
        });
        return;
      }
      setSelectedFile(basename);
      try {
        const res = await fetch(buildComparePayloadFetchUrl(basename, { payloadRoot }));
        if (!res.ok) {
          setView({
            kind: 'blocked',
            error: `Could not load ${basename} (${res.status}).`,
            hint: 'Select another payload file from the list.',
          });
          return;
        }
        const raw: JestCanvasMockComparePayload = await res.json();
        applyPayload(raw, basename);
        if (historyMode) {
          navigate(basename, historyMode);
        }
      } catch (e) {
        setView({
          kind: 'blocked',
          error: `Failed to fetch ${basename}.`,
          hint: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [applyPayload, navigate, payloadRoot]
  );

  const indexOrderedPayloadFiles = useMemo(
    () => sortPayloadFilesForIndex(effectiveBasenames, fileSnapshotAssertionPassed, fileModifiedTimestampMs),
    [effectiveBasenames, fileModifiedTimestampMs, fileSnapshotAssertionPassed]
  );

  const nextFailedTestBasename = useMemo(
    () => findNextFailedBasename(indexOrderedPayloadFiles, fileSnapshotAssertionPassed, selectedFile),
    [fileSnapshotAssertionPassed, indexOrderedPayloadFiles, selectedFile]
  );

  const goToNextFailedTest = useCallback(() => {
    if (!nextFailedTestBasename) {
      return;
    }
    void setTest(nextFailedTestBasename, 'push');
  }, [nextFailedTestBasename, setTest]);

  const loadFromLocation = useCallback(() => {
    const run = async () => {
      const params = new URLSearchParams(locationSearch);
      const fileParam = params.get('file');

      if (!fileParam) {
        setSelectedFile(null);
        setView({
          kind: 'blocked',
          hint: 'Choose a payload file from the list.',
        });
        return;
      }

      const basename = normalizePayloadFileQueryParam(fileParam);
      if (!basename) {
        setSelectedFile(null);
        setView({
          kind: 'blocked',
          error: `${fileParam} is not a valid payload filename.`,
          hint: 'Use the `.json` basename or paste a full path (`file://` URLs work too). Links from failing tests already include `payloadRoot` so the viewer can load the right folder. Otherwise run the CLI from the project root that contains `.jest-canvas-mock-compare`.',
        });
        return;
      }

      await setTest(basename);
    };

    void run();
  }, [locationSearch, setTest]);

  useEffect(() => {
    void loadFromLocation();
  }, [loadFromLocation]);

  const rerunFromPlots = useCallback(() => {
    if (view.kind !== 'ready') {
      return;
    }
    onRerunTest(view.payload);
  }, [onRerunTest, view]);

  const acceptFromPlots = useCallback(() => {
    if (view.kind !== 'ready') {
      return;
    }
    onAcceptBaseline(view.payload);
  }, [onAcceptBaseline, view]);

  if (view.kind === 'loading') {
    return <p>Loading…</p>;
  }

  if (view.kind === 'blocked') {
    return (
      <div className="wrap">
        <div className="compare-blocked">
          {view.error ? (
            <p className="compare-error" role="alert">
              {view.error}
            </p>
          ) : null}
          {view.hint ? <p className={'compare-hint'}>{view.hint}</p> : null}
          <TestList
            payloadRoot={payloadRoot}
            fetchKind={remoteFetchKind}
            indexOrderedPayloadFiles={indexOrderedPayloadFiles}
            testListLength={effectiveBasenames.length}
            selectedFile={selectedFile}
            fileSnapshotAssertionPassed={fileSnapshotAssertionPassed}
            fileModifiedLabels={fileModifiedLabels}
            onSelectTest={(b) => setTest(b, 'push')}
          />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackRender={({ error }) => <h2>{error?.toString()}</h2>}>
      <ComparePlots
        defaultWidth={defaultWidth}
        defaultHeight={defaultHeight}
        payload={view.payload}
        acceptBaselineState={acceptBaselineState}
        onBackToIndex={navigateToIndex}
        nextFailedTestBasename={nextFailedTestBasename}
        onGoToNextFailedTest={goToNextFailedTest}
        onRerunTest={rerunFromPlots}
        onAcceptBaseline={acceptFromPlots}
      />
    </ErrorBoundary>
  );
};
