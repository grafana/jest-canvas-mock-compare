import { useEffect, useState } from 'react';

import { buildComparePayloadListUrl } from '../payloadApi.ts';
import { readRemotePayloadListResponse } from '../payloadListResponse.ts';

export type PayloadIndexFetchKind = 'no-root' | 'loading' | 'ready' | 'error';

export function usePayloadIndex(payloadRoot: string | undefined): {
  fetchKind: PayloadIndexFetchKind;
  files: string[];
  fileSnapshotAssertionPassed: Record<string, boolean | undefined>;
  fileModifiedLabels: Record<string, string>;
  fileModifiedTimestampMs: Record<string, number>;
} {
  const [fetchKind, setFetchKind] = useState<PayloadIndexFetchKind>('loading');
  const [files, setFiles] = useState<string[]>([]);
  const [fileSnapshotAssertionPassed, setFileSnapshotAssertionPassed] = useState<Record<string, boolean | undefined>>(
    {}
  );
  const [fileModifiedLabels, setFileModifiedLabels] = useState<Record<string, string>>({});
  const [fileModifiedTimestampMs, setFileModifiedTimestampMs] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!payloadRoot) {
      setFetchKind('no-root');
      setFiles([]);
      setFileSnapshotAssertionPassed({});
      setFileModifiedLabels({});
      setFileModifiedTimestampMs({});
      return;
    }

    let cancelled = false;
    setFetchKind('loading');

    void (async () => {
      try {
        const res = await fetch(buildComparePayloadListUrl(payloadRoot, { meta: true }));
        const data: unknown = await res.json().catch(() => undefined);
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          setFetchKind('error');
          setFiles([]);
          setFileSnapshotAssertionPassed({});
          setFileModifiedLabels({});
          setFileModifiedTimestampMs({});
          return;
        }
        const parsed = readRemotePayloadListResponse(data);
        if (!parsed) {
          setFetchKind('error');
          setFiles([]);
          setFileSnapshotAssertionPassed({});
          setFileModifiedLabels({});
          setFileModifiedTimestampMs({});
          return;
        }

        const passed: Record<string, boolean | undefined> = {};
        const labels: Record<string, string> = {};
        const ms: Record<string, number> = {};

        if (parsed.meta) {
          for (const basename of parsed.files) {
            const m = parsed.meta[basename];
            if (m) {
              passed[basename] = m.snapshotAssertionPassed;
              if (m.modifiedMs > 0) {
                ms[basename] = m.modifiedMs;
                labels[basename] = new Date(m.modifiedMs).toLocaleString();
              }
            }
          }
        }

        setFiles(parsed.files);
        setFileSnapshotAssertionPassed(passed);
        setFileModifiedLabels(labels);
        setFileModifiedTimestampMs(ms);
        setFetchKind('ready');
      } catch {
        if (!cancelled) {
          setFetchKind('error');
          setFiles([]);
          setFileSnapshotAssertionPassed({});
          setFileModifiedLabels({});
          setFileModifiedTimestampMs({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payloadRoot]);

  return { fetchKind, files, fileSnapshotAssertionPassed, fileModifiedLabels, fileModifiedTimestampMs };
}
