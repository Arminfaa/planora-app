export function getAssetUrl(url: string): string {
  if (url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('http://')) {
    try {
      const { pathname } = new URL(url);
      if (pathname.startsWith('/uploads/')) {
        return pathname;
      }
    } catch {
      return url;
    }
    return url;
  }

  return url.startsWith('/') ? url : `/${url}`;
}

export function isImageAttachment(type: string, mimeType: string): boolean {
  if (type === 'LINK') return false;
  return type === 'IMAGE' || mimeType.startsWith('image/');
}
