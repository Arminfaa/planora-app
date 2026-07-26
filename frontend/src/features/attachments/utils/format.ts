export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type FileKind = 'pdf' | 'text' | 'archive' | 'file';

export function getFileKind(mimeType: string, filename: string): FileKind {
  if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    mimeType.startsWith('text/') ||
    filename.endsWith('.txt') ||
    filename.endsWith('.md')
  ) {
    return 'text';
  }
  if (
    mimeType.includes('zip') ||
    filename.endsWith('.zip') ||
    filename.endsWith('.rar')
  ) {
    return 'archive';
  }
  return 'file';
}

/** True for http(s) links that browsers can open directly. */
export function isWebAttachmentUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}
