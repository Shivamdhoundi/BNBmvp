// RFC 4180 quoting plus spreadsheet formula neutralization on every exported cell.
export function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function toCsv(columns: readonly string[], records: Record<string, unknown>[]): string {
  return "\uFEFF" + [columns.map(csvCell).join(","), ...records.map(record => columns.map(column => csvCell(record[column])).join(","))].join("\r\n") + "\r\n";
}

export function parseCsv(input: string): string[][] {
  if (new TextEncoder().encode(input).length > 128 * 1024) throw new Error("CSV must be 128 KB or smaller.");
  const text = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, closed = false;
  const endCell = () => { row.push(cell); cell = ""; closed = false; };
  const endRow = () => {
    endCell(); if (row.some(value => value !== "")) rows.push(row); row = [];
    if (rows.length > 201) throw new Error("Import at most 200 records at a time.");
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; }
      } else cell += char;
    } else if (char === ",") endCell();
    else if (char === "\n" || char === "\r") { if (char === "\r" && text[i + 1] === "\n") i++; endRow(); }
    else if (char === '"' && cell === "" && !closed) quoted = true;
    else {
      if (closed || char === '"') throw new Error("Invalid CSV quoting.");
      cell += char;
    }
  }
  if (quoted) throw new Error("Unclosed CSV quote.");
  if (cell || row.length || closed) endRow();
  return rows;
}
