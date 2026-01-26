export type Player = 'white' | 'black';
export type Position = number;
export type BoardState = (Player | null)[];

export type GamePhase = 'placing' | 'moving' | 'removing' | 'gameOver';

export interface GameState {
  board: BoardState;
  currentPlayer: Player;
  phase: GamePhase;
  whitePiecesPlaced: number;
  blackPiecesPlaced: number;
  whitePiecesOnBoard: number;
  blackPiecesOnBoard: number;
  selectedPiece: Position | null;
  mustRemove: boolean;
  winner: Player | null;
  moveHistory: string[];
}

export const TOTAL_PIECES = 9;

export const ADJACENT: Record<number, number[]> = {
  0: [1, 9],
  1: [0, 2, 4],
  2: [1, 14],
  3: [4, 10],
  4: [1, 3, 5, 7],
  5: [4, 13],
  6: [7, 11],
  7: [4, 6, 8],
  8: [7, 12],
  9: [0, 10, 21],
  10: [3, 9, 11, 18],
  11: [6, 10, 15],
  12: [8, 13, 17],
  13: [5, 12, 14, 20],
  14: [2, 13, 23],
  15: [11, 16],
  16: [15, 17, 19],
  17: [12, 16],
  18: [10, 19],
  19: [16, 18, 20, 22],
  20: [13, 19],
  21: [9, 22],
  22: [19, 21, 23],
  23: [14, 22],
};

export const MILLS: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11],
  [12, 13, 14],
  [15, 16, 17],
  [18, 19, 20],
  [21, 22, 23],
  [0, 9, 21],
  [3, 10, 18],
  [6, 11, 15],
  [1, 4, 7],
  [16, 19, 22],
  [8, 12, 17],
  [5, 13, 20],
  [2, 14, 23],
];

export const POSITION_COORDS: Record<number, { x: number; y: number }> = {
  0: { x: 0, y: 0 },
  1: { x: 3, y: 0 },
  2: { x: 6, y: 0 },
  3: { x: 1, y: 1 },
  4: { x: 3, y: 1 },
  5: { x: 5, y: 1 },
  6: { x: 2, y: 2 },
  7: { x: 3, y: 2 },
  8: { x: 4, y: 2 },
  9: { x: 0, y: 3 },
  10: { x: 1, y: 3 },
  11: { x: 2, y: 3 },
  12: { x: 4, y: 3 },
  13: { x: 5, y: 3 },
  14: { x: 6, y: 3 },
  15: { x: 2, y: 4 },
  16: { x: 3, y: 4 },
  17: { x: 4, y: 4 },
  18: { x: 1, y: 5 },
  19: { x: 3, y: 5 },
  20: { x: 5, y: 5 },
  21: { x: 0, y: 6 },
  22: { x: 3, y: 6 },
  23: { x: 6, y: 6 },
};

export function createInitialState(): GameState {
  return {
    board: Array(24).fill(null),
    currentPlayer: 'white',
    phase: 'placing',
    whitePiecesPlaced: 0,
    blackPiecesPlaced: 0,
    whitePiecesOnBoard: 0,
    blackPiecesOnBoard: 0,
    selectedPiece: null,
    mustRemove: false,
    winner: null,
    moveHistory: [],
  };
}

export function checkMill(board: BoardState, position: Position, player: Player): boolean {
  return MILLS.some(
    (mill) =>
      mill.includes(position) && mill.every((pos) => board[pos] === player)
  );
}

export function getAllMills(board: BoardState, player: Player): number[][] {
  return MILLS.filter((mill) => mill.every((pos) => board[pos] === player));
}

export function canRemovePiece(board: BoardState, position: Position, opponent: Player): boolean {
  if (board[position] !== opponent) return false;
  
  const inMill = checkMill(board, position, opponent);
  
  if (!inMill) return true;
  
  const opponentPositions = board
    .map((p, i) => (p === opponent ? i : -1))
    .filter((i) => i !== -1);
  
  const allInMills = opponentPositions.every((pos) => checkMill(board, pos, opponent));
  
  return allInMills;
}

export function getValidMoves(state: GameState, position: Position): Position[] {
  const player = state.board[position];
  if (!player) return [];

  return ADJACENT[position].filter((adj) => state.board[adj] === null);
}

export function hasValidMoves(state: GameState, player: Player): boolean {
  const playerPositions = state.board
    .map((p, i) => (p === player ? i : -1))
    .filter((i) => i !== -1);

  return playerPositions.some((pos) => 
    ADJACENT[pos].some((adj) => state.board[adj] === null)
  );
}

export function checkGameOver(state: GameState): { isOver: boolean; winner: Player | null } {
  const whitePlaced = state.whitePiecesPlaced >= TOTAL_PIECES;
  const blackPlaced = state.blackPiecesPlaced >= TOTAL_PIECES;

  if (!whitePlaced || !blackPlaced) {
    return { isOver: false, winner: null };
  }

  if (state.whitePiecesOnBoard < 3) {
    return { isOver: true, winner: 'black' };
  }
  if (state.blackPiecesOnBoard < 3) {
    return { isOver: true, winner: 'white' };
  }

  if (!hasValidMoves(state, state.currentPlayer)) {
    return { isOver: true, winner: state.currentPlayer === 'white' ? 'black' : 'white' };
  }

  return { isOver: false, winner: null };
}

export function placePiece(state: GameState, position: Position): GameState {
  if (state.board[position] !== null || state.phase !== 'placing') {
    return state;
  }

  const newBoard = [...state.board];
  newBoard[position] = state.currentPlayer;

  const newState: GameState = {
    ...state,
    board: newBoard,
    whitePiecesPlaced: state.currentPlayer === 'white' ? state.whitePiecesPlaced + 1 : state.whitePiecesPlaced,
    blackPiecesPlaced: state.currentPlayer === 'black' ? state.blackPiecesPlaced + 1 : state.blackPiecesPlaced,
    whitePiecesOnBoard: state.currentPlayer === 'white' ? state.whitePiecesOnBoard + 1 : state.whitePiecesOnBoard,
    blackPiecesOnBoard: state.currentPlayer === 'black' ? state.blackPiecesOnBoard + 1 : state.blackPiecesOnBoard,
    moveHistory: [...state.moveHistory, `${state.currentPlayer} placed at ${position}`],
  };

  if (checkMill(newBoard, position, state.currentPlayer)) {
    return { ...newState, mustRemove: true };
  }

  const nextPlayer = state.currentPlayer === 'white' ? 'black' : 'white';
  const bothPlaced = newState.whitePiecesPlaced >= TOTAL_PIECES && newState.blackPiecesPlaced >= TOTAL_PIECES;

  return {
    ...newState,
    currentPlayer: nextPlayer,
    phase: bothPlaced ? 'moving' : 'placing',
  };
}

export function selectPiece(state: GameState, position: Position): GameState {
  if (state.board[position] !== state.currentPlayer) {
    return state;
  }

  const validMoves = getValidMoves(state, position);
  if (validMoves.length === 0) {
    return state;
  }

  return { ...state, selectedPiece: position };
}

export function movePiece(state: GameState, from: Position, to: Position): GameState {
  if (state.board[from] !== state.currentPlayer || state.board[to] !== null) {
    return state;
  }

  const validMoves = getValidMoves(state, from);
  if (!validMoves.includes(to)) {
    return state;
  }

  const newBoard = [...state.board];
  newBoard[from] = null;
  newBoard[to] = state.currentPlayer;

  const newState: GameState = {
    ...state,
    board: newBoard,
    selectedPiece: null,
    moveHistory: [...state.moveHistory, `${state.currentPlayer} moved from ${from} to ${to}`],
  };

  if (checkMill(newBoard, to, state.currentPlayer)) {
    return { ...newState, mustRemove: true };
  }

  const nextPlayer = state.currentPlayer === 'white' ? 'black' : 'white';
  const gameResult = checkGameOver({ ...newState, currentPlayer: nextPlayer });

  return {
    ...newState,
    currentPlayer: nextPlayer,
    phase: gameResult.isOver ? 'gameOver' : 'moving',
    winner: gameResult.winner,
  };
}

export function removePiece(state: GameState, position: Position): GameState {
  const opponent = state.currentPlayer === 'white' ? 'black' : 'white';

  if (!canRemovePiece(state.board, position, opponent)) {
    return state;
  }

  const newBoard = [...state.board];
  newBoard[position] = null;

  const newState: GameState = {
    ...state,
    board: newBoard,
    whitePiecesOnBoard: opponent === 'white' ? state.whitePiecesOnBoard - 1 : state.whitePiecesOnBoard,
    blackPiecesOnBoard: opponent === 'black' ? state.blackPiecesOnBoard - 1 : state.blackPiecesOnBoard,
    mustRemove: false,
    moveHistory: [...state.moveHistory, `${state.currentPlayer} removed piece at ${position}`],
  };

  const nextPlayer = state.currentPlayer === 'white' ? 'black' : 'white';
  const bothPlaced = newState.whitePiecesPlaced >= TOTAL_PIECES && newState.blackPiecesPlaced >= TOTAL_PIECES;
  const gameResult = checkGameOver({ ...newState, currentPlayer: nextPlayer });

  return {
    ...newState,
    currentPlayer: nextPlayer,
    phase: gameResult.isOver ? 'gameOver' : bothPlaced ? 'moving' : 'placing',
    winner: gameResult.winner,
  };
}

export function getPositionName(position: Position): string {
  const coords = POSITION_COORDS[position];
  const col = String.fromCharCode(65 + coords.x);
  const row = 7 - coords.y;
  return `${col}${row}`;
}
