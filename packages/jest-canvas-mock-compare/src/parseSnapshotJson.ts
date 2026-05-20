/**
 * Jest snapshot text uses pretty-printed values. String props may contain raw `"` (e.g. CSS
 * font stacks with "Segoe UI") which is not valid JSON — only the closing `",` at end of
 * line is the real delimiter.
 */
function escapeInnerQuotesInDoubleQuotedPropertyLines(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const m = line.match(/^(\s*"([^"]+)":\s*")(.*)$/);
      if (!m) {
        return line;
      }
      const prefix = m[1];
      const tail = m[3];
      const endMatch = tail.match(/^(.*)(",\s*)$/);
      if (!endMatch) {
        return line;
      }
      const inner = endMatch[1];
      if (!inner.includes('"')) {
        return line;
      }
      const escaped = inner.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return prefix + escaped + endMatch[2];
    })
    .join('\n');
}

/**
 * Snapshot is almost JSON; clean it up so it will parse.
 * Intended for canvas snapshot payloads only.
 */
export function parseSnapshotJson(text: string) {
  let cleaned = escapeInnerQuotesInDoubleQuotedPropertyLines(text.trim());
  // Relaxed JSON: trailing commas before `}` / `]`, and commas after `}` / `]` when
  // the next token is `}` / `]` / EOF (e.g. `[{...},]` snapshot fragments).
  let prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1').replace(/([}\]])(\s*),\s*(?=[\]}]|$)/g, '$1');
  }
  return JSON.parse(cleaned);
}
