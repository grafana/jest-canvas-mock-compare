/** Next payload with `snapshotAssertionPassed === false`, after `currentBasename` in circular list order. */
export function findNextFailedBasename(
  orderedFiles: readonly string[],
  passedMap: Record<string, boolean | undefined>,
  currentBasename: string | null
): string | null {
  const n = orderedFiles.length;
  if (n === 0) {
    return null;
  }

  const isFailed = (name: string) => passedMap[name] === false;

  const startIdx = currentBasename ? orderedFiles.indexOf(currentBasename) : -1;

  if (startIdx === -1) {
    for (let i = 0; i < n; i++) {
      const name = orderedFiles[i];
      if (isFailed(name)) {
        return name;
      }
    }
    return null;
  }

  for (let step = 1; step < n; step++) {
    const idx = (startIdx + step) % n;
    const name = orderedFiles[idx];
    if (isFailed(name)) {
      return name;
    }
  }

  return null;
}

/** Failed payloads first, then passing, then unknown status; within each group by Last-Modified descending. */
export function sortPayloadFilesForIndex(
  files: readonly string[],
  passedMap: Record<string, boolean | undefined>,
  modifiedMsByBasename: Record<string, number>
): string[] {
  const failureTier = (passed: boolean | undefined): number => {
    if (passed === false) {
      return 0;
    }
    if (passed === true) {
      return 1;
    }
    return 2;
  };

  return [...files].sort((a, b) => {
    const tierDiff = failureTier(passedMap[a]) - failureTier(passedMap[b]);
    if (tierDiff !== 0) {
      return tierDiff;
    }
    const ma = modifiedMsByBasename[a];
    const mb = modifiedMsByBasename[b];
    const maNum = !Number.isNaN(ma) ? ma : -Infinity;
    const mbNum = !Number.isNaN(mb) ? mb : -Infinity;
    if (maNum !== mbNum) {
      return mbNum - maNum;
    }
    return a.localeCompare(b);
  });
}
