import type { JestCanvasMockComparePayload } from 'jest-canvas-mock-compare';
import { useCallback, useMemo, useState } from 'react';

import { buildComparePayloadFetchUrl } from '../payloadApi.ts';
import { isCanvasComparePayload } from '../testUtils.ts';
import type { AcceptBaselineState, ResolvedPayload } from '../types.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readOptionalString(o: Record<string, unknown>, key: string): string | undefined {
  const v = o[key];
  return typeof v === 'string' ? v : undefined;
}

function readOptionalBoolean(o: Record<string, unknown>, key: string): boolean | undefined {
  const v = o[key];
  return typeof v === 'boolean' ? v : undefined;
}

function readOptionalNumber(o: Record<string, unknown>, key: string): number | undefined {
  const v = o[key];
  return typeof v === 'number' ? v : undefined;
}

function parseAcceptBaselineResponse(data: unknown): {
  ok?: boolean;
  exitCode?: number;
  stdout: string;
  stderr: string;
  command: string;
  error?: string;
} {
  if (!isRecord(data)) {
    return { stdout: '', stderr: '', command: '' };
  }
  return {
    ok: readOptionalBoolean(data, 'ok'),
    exitCode: readOptionalNumber(data, 'exitCode'),
    stdout: readOptionalString(data, 'stdout') ?? '',
    stderr: readOptionalString(data, 'stderr') ?? '',
    command: readOptionalString(data, 'command') ?? '',
    error: readOptionalString(data, 'error'),
  };
}

interface UseAcceptBaselineArgs {
  applyPayload: (
    raw: JestCanvasMockComparePayload,
    sourceLabel: string,
    options?: { resetJestActions?: boolean }
  ) => void;
  selectedFile: string | null;
  payloadRoot: string | undefined;
}

export function useAcceptBaseline({ applyPayload, selectedFile, payloadRoot }: UseAcceptBaselineArgs): {
  acceptBaselineState: AcceptBaselineState;
  resetAcceptBaselineState: () => void;
  onRerunTest: (payload: ResolvedPayload) => void;
  onAcceptBaseline: (payload: ResolvedPayload) => void;
} {
  const [acceptBaselineState, setAcceptBaselineState] = useState<AcceptBaselineState>({ kind: 'idle' });

  const resetAcceptBaselineState = useCallback(() => setAcceptBaselineState({ kind: 'idle' }), []);

  const reloadPayloadAfterJest = useCallback(async () => {
    const basename = selectedFile ?? new URLSearchParams(window.location.search).get('file');
    if (!basename || !payloadRoot) {
      return;
    }
    try {
      const res = await fetch(
        `${buildComparePayloadFetchUrl(basename, { payloadRoot })}?_=${encodeURIComponent(String(Date.now()))}`,
        {
          cache: 'no-store',
        }
      );
      if (!res.ok) {
        return;
      }
      const rawUnknown: unknown = await res.json();
      if (!isCanvasComparePayload(rawUnknown)) {
        console.warn('canvas compare payload incorrect', rawUnknown);
        return;
      }
      applyPayload(rawUnknown, basename, { resetJestActions: false });
    } catch {
      // Ignore reload failures (missing file or invalid JSON).
      console.warn('failed to apply payload', { basename });
    }
  }, [applyPayload, payloadRoot, selectedFile]);

  const runJestForPayload = useCallback(
    async (payload: ResolvedPayload, updateSnapshot: boolean) => {
      if (!payload.testPath) {
        return;
      }
      setAcceptBaselineState({ kind: 'running', updateSnapshot });
      try {
        const res = await fetch('/compare/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testPath: payload.testPath,
            testName: payload.testName,
            updateSnapshot,
          }),
        });
        const data = parseAcceptBaselineResponse(await res.json());

        if (!res.ok) {
          setAcceptBaselineState({
            kind: 'error',
            updateSnapshot,
            message: data.error ?? `Request failed (${res.status})`,
            stdout: data.stdout ?? '',
            stderr: data.stderr ?? '',
            command: data.command,
          });
          return;
        }

        if (data.ok && data.exitCode === 0) {
          setAcceptBaselineState({
            kind: 'success',
            updateSnapshot,
            stdout: data.stdout ?? '',
            stderr: data.stderr ?? '',
            command: data.command ?? '',
          });
          return;
        }

        setAcceptBaselineState({
          kind: 'error',
          updateSnapshot,
          message: data.error ?? `jest exited with code ${String(data.exitCode)}`,
          stdout: data.stdout ?? '',
          stderr: data.stderr ?? '',
          command: data.command,
        });
      } catch (e) {
        setAcceptBaselineState({
          kind: 'error',
          updateSnapshot,
          message: e instanceof Error ? e.message : String(e),
          stdout: '',
          stderr: '',
        });
      } finally {
        await reloadPayloadAfterJest();
      }
    },
    [reloadPayloadAfterJest]
  );

  return useMemo(
    () => ({
      acceptBaselineState,
      resetAcceptBaselineState,
      onRerunTest: (payload: ResolvedPayload) => {
        void runJestForPayload(payload, false);
      },
      onAcceptBaseline: (payload: ResolvedPayload) => {
        void runJestForPayload(payload, true);
      },
    }),
    [acceptBaselineState, resetAcceptBaselineState, runJestForPayload]
  );
}
