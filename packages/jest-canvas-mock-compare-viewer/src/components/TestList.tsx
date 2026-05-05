import type { PayloadIndexFetchKind } from '../hooks/usePayloadIndex.ts';
import { TestListItem } from './TestListItem.tsx';

export function TestList(props: {
  payloadRoot: string | undefined;
  fetchKind: PayloadIndexFetchKind;
  indexOrderedPayloadFiles: readonly string[];
  testListLength: number;
  selectedFile: string | null;
  fileSnapshotAssertionPassed: Record<string, boolean | undefined>;
  fileModifiedLabels: Record<string, string>;
  onSelectTest: (basename: string) => void;
}) {
  const { payloadRoot, fetchKind, indexOrderedPayloadFiles, testListLength, fileModifiedLabels, onSelectTest } = props;

  return (
    <div className="compare-file-list">
      {!payloadRoot ? (
        <p className="compare-error" role="alert">
          Missing <code>payloadRoot</code> in the URL (or a stored value from a previous session). Open the compare link
          printed by a failing canvas snapshot test, or run the compare CLI from the project root that contains{' '}
          <code>.jest-canvas-mock-compare</code>.
        </p>
      ) : null}
      {payloadRoot && fetchKind === 'loading' ? <p>Loading payload index…</p> : null}
      {payloadRoot && fetchKind === 'ready' ? <p>Working directory: {payloadRoot}</p> : null}
      {payloadRoot && fetchKind === 'error' ? (
        <p className="compare-error" role="alert">
          Could not load the payload list for <code>payloadRoot</code> — use the bundled compare CLI or Vite dev server
          so <code>/__jest-canvas-payload__</code> is mounted.
        </p>
      ) : null}
      {payloadRoot && fetchKind === 'ready' && testListLength === 0 ? (
        <p>No JSON payload files in this directory.</p>
      ) : null}

      {indexOrderedPayloadFiles.length > 0
        ? indexOrderedPayloadFiles.map((basename) => {
            if (typeof props.fileSnapshotAssertionPassed[basename] !== 'boolean') {
              console.error('Invalid filename', basename);
            }
            return (
              <TestListItem
                isSelected={props.selectedFile === basename}
                modified={fileModifiedLabels[basename] ?? 'unknown'}
                key={basename}
                testName={basename}
                onClick={() => onSelectTest(basename)}
                testPassed={props.fileSnapshotAssertionPassed[basename] ?? false}
              />
            );
          })
        : null}
    </div>
  );
}
