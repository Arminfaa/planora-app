import type { Metadata } from 'next';

export const BRAND_NAME = 'Planora';

/** Child title segment for template `Planora | %s`. */
export function pageMetadata(pageName: string): Metadata {
  return {
    title: pageName,
  };
}
