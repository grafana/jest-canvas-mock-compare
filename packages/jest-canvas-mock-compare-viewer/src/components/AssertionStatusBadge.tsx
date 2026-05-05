export function AssertionStatusBadge({ passed }: { passed: boolean }) {
  return (
    <span
      className={`compare-snapshot-status${passed ? ' is-pass' : ' is-fail'}`}
      title="Whether the test passed when this payload was written"
    >
      {passed ? 'passed' : 'failed'}
    </span>
  );
}
