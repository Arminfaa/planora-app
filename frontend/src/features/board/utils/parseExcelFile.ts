import * as XLSX from 'xlsx';

export interface ParsedExcelWorkbook {
  rawRows: string[][];
}

export interface ParsedExcelSheet {
  headers: string[];
  headerLabels: string[];
  rows: string[][];
}

function normalizeCell(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function rowHasContent(row: string[]): boolean {
  return row.some((cell) => cell.trim() !== '');
}

export function columnLetter(index: number): string {
  let n = index + 1;
  let result = '';

  while (n > 0) {
    const remainder = (n - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }

  return result;
}

export function buildHeaderLabels(
  headerRow: string[],
  emptyHeaderLabel: string,
): string[] {
  const seen = new Map<string, number>();

  return headerRow.map((cell, index) => {
    const trimmed = normalizeCell(cell);
    const letter = columnLetter(index);
    const base = trimmed || `${emptyHeaderLabel} (${letter})`;

    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    if (count === 0) {
      return `${letter} — ${base}`;
    }

    return `${letter} — ${base} (${count + 1})`;
  });
}

export function extractSheetData(
  rawRows: string[][],
  headerRowIndex: number,
  emptyHeaderLabel: string,
): ParsedExcelSheet {
  const headerRow = rawRows[headerRowIndex] ?? [];
  const maxColumns = Math.max(
    headerRow.length,
    ...rawRows
      .slice(headerRowIndex + 1)
      .map((row) => row.length),
    0,
  );

  const headers = Array.from({ length: maxColumns }, (_, index) => {
    const label = normalizeCell(headerRow[index]);
    return label || `__col_${index}`;
  });

  const headerLabels = buildHeaderLabels(
    Array.from({ length: maxColumns }, (_, index) =>
      normalizeCell(headerRow[index]),
    ),
    emptyHeaderLabel,
  );

  const rows = rawRows
    .slice(headerRowIndex + 1)
    .map((row) =>
      headers.map((_, index) => normalizeCell(row[index])),
    )
    .filter(rowHasContent);

  return { headers, headerLabels, rows };
}

export function parseExcelFile(file: File): Promise<ParsedExcelWorkbook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        if (!buffer || !(buffer instanceof ArrayBuffer)) {
          reject(new Error('read'));
          return;
        }

        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
          reject(new Error('empty'));
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils
          .sheet_to_json<unknown[]>(sheet, {
            header: 1,
            defval: '',
            raw: false,
          })
          .map((row) => (row as unknown[]).map(normalizeCell));

        if (rawRows.length === 0) {
          reject(new Error('empty'));
          return;
        }

        resolve({ rawRows });
      } catch {
        reject(new Error('parse'));
      }
    };

    reader.onerror = () => reject(new Error('read'));
    reader.readAsArrayBuffer(file);
  });
}
