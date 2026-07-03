import type { Board } from '@/features/board/types';
import type { ProjectSocketEvent } from '../types/socket';

function insertBoard(boards: Board[], board: Board): Board[] {
  const exists = boards.some((item) => item.id === board.id);
  const next = exists
    ? boards.map((item) => (item.id === board.id ? board : item))
    : [...boards, board];

  return next.sort((a, b) => a.position - b.position);
}

function updateBoard(boards: Board[], board: Board): Board[] {
  return boards
    .map((item) => (item.id === board.id ? { ...item, ...board } : item))
    .sort((a, b) => a.position - b.position);
}

function removeBoard(boards: Board[], boardId: string): Board[] {
  return boards.filter((item) => item.id !== boardId);
}

export function applyProjectBoardEvent(
  boards: Board[],
  event: ProjectSocketEvent,
): Board[] {
  switch (event.type) {
    case 'board:created': {
      const { board } = event.payload as { board: Board };
      if (!board) return boards;
      return insertBoard(boards, board);
    }
    case 'board:updated': {
      const { board } = event.payload as { board: Board };
      if (!board) return boards;
      return updateBoard(boards, board);
    }
    case 'board:deleted': {
      const { boardId } = event.payload as { boardId: string };
      if (!boardId) return boards;
      return removeBoard(boards, boardId);
    }
    default:
      return boards;
  }
}
