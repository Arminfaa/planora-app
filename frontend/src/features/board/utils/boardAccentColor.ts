import { BOARD_COLOR_OPTIONS } from '../types';

export function getBoardAccentColor(
  boardId: string,
  color?: string | null,
): string {
  if (color) return color;

  let hash = 0;
  for (let i = 0; i < boardId.length; i++) {
    hash = boardId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BOARD_COLOR_OPTIONS[Math.abs(hash) % BOARD_COLOR_OPTIONS.length];
}
