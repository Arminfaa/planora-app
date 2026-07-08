import * as XLSX from 'xlsx';

export interface ParsedExcelSheet {
  headers: string[];
  rows: string[][];
}

function normalizeCell(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function rowHasContent(row: string[]): boolean {
  return row.some((cell) => cell.trim() !== '');
}

export function parseExcelFile(file: File): Promise<ParsedExcelSheet> {
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
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: '',
          raw: false,
        });

        if (rawRows.length === 0) {
          reject(new Error('empty'));
          return;
        }

        const headerRow = rawRows[0] ?? [];
        const headers = headerRow.map((cell, index) => {
          const label = normalizeCell(cell);
          return label || `Column ${index + 1}`;
        });

        const rows = rawRows
          .slice(1)
          .map((row) =>
            headers.map((_, index) => normalizeCell((row as unknown[])[index])),
          )
          .filter(rowHasContent);

        if (rows.length === 0) {
          reject(new Error('noRows'));
          return;
        }

        resolve({ headers, rows });
      } catch {
        reject(new Error('parse'));
      }
    };

    reader.onerror = () => reject(new Error('read'));
    reader.readAsArrayBuffer(file);
  });
}
