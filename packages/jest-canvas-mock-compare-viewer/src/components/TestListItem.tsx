import { AssertionStatusBadge } from './AssertionStatusBadge.tsx';

export function TestListItem(props: {
  testName: string;
  onClick: () => void;
  modified: string;
  testPassed: boolean;
  isSelected: boolean;
}) {
  return (
    <button
      type="button"
      className={`compare-file-item${props.isSelected ? ' is-selected' : ''}`}
      onClick={props.onClick}
    >
      <div className={'compare-file-item__wrap'}>
        <span className="compare-file-item-header">
          <span className="compare-file-name">{props.testName}</span>
        </span>
        <span className="compare-file-modified">Modified: {props.modified}</span>
      </div>
      <AssertionStatusBadge passed={props.testPassed} />
    </button>
  );
}
