import sanitizeHtml from 'sanitize-html';

export const sanitizeString = (value: string): string =>
  sanitizeHtml(value.trim(), { allowedTags: [], allowedAttributes: {} });
