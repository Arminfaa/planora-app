import type { ReactNode } from 'react';

const URL_REGEX = /https?:\/\/[^\s<>"']+/g;

export function formatMessageText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_REGEX)) {
    const url = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    nodes.push(
      <a
        key={`link-${index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all font-medium text-primary-600 underline decoration-primary-300 underline-offset-2 hover:text-primary-700"
      >
        {url}
      </a>,
    );

    lastIndex = index + url.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}
