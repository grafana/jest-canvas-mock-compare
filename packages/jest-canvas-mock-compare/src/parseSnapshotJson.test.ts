import { parseSnapshotJson } from './parseSnapshotJson.ts';

describe('parseSnapshotJson', () => {
  const actual = `{"props":{"height":400,"width":400,"x":0,"y":0},"transform":[1,0,0,1,0,0],"type":"clearRect"}`;
  const trailingCommas = `{"props":{"height":400,"width":400,"x":0,"y":0,},"transform":[1,0,0,1,0,0,],"type":"clearRect",},`;
  test('should strip trailing commas', () => {
    expect(parseSnapshotJson(trailingCommas)).toEqual(JSON.parse(actual));
  });

  test('should escape unescaped quotes in Jest pretty-print string props (e.g. font stack)', () => {
    const line = ' "value": "12px system-ui, -apple-system, "Segoe UI", Roboto, "Noto Color Emoji"",';
    const blob = `[\n  {\n    "props": {\n${line}\n    },\n    "type": "font",\n  },\n]`;
    const parsed = parseSnapshotJson(blob);
    expect(parsed[0].type).toBe('font');
    expect(parsed[0].props.value).toContain('Segoe UI');
  });

  test('should work with valid json', () => {
    const actual = `{"props":{"height":400,"width":400,"x":0,"y":0},"transform":[1,0,0,1,0,0],"type":"clearRect"}`;
    expect(parseSnapshotJson(actual)).toEqual(JSON.parse(actual));
  });
});
