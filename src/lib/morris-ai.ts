import {
  GameState,
  Player,
  Position,
  ADJACENT,
  MILLS,
  TOTAL_PIECES,
  checkMill,
  canRemovePiece,
  placePiece,
  movePiece,
  removePiece,
  getValidMoves,
  createInitialState,
} from './morris-game';

export type Difficulty = 'easy' | 'medium' | 'hard';

function evaluateBoard(state: GameState, aiPlayer: Player): number {
  const opponent = aiPlayer === 'white' ? 'black' : 'white';
  
  const aiPieces = aiPlayer === 'white' ? state.whitePiecesOnBoard : state.blackPiecesOnBoard;
  const oppPieces = opponent === 'white' ? state.whitePiecesOnBoard : state.blackPiecesOnBoard;
  
  let score = (aiPieces - oppPieces) * 100;
  
  const aiMills = MILLS.filter(mill => mill.every(pos => state.board[pos] === aiPlayer)).length;
  const oppMills = MILLS.filter(mill => mill.every(pos => state.board[pos] === opponent)).length;
  score += (aiMills - oppMills) * 50;
  
  const aiTwoInRow = MILLS.filter(mill => {
    const aiCount = mill.filter(pos => state.board[pos] === aiPlayer).length;
    const emptyCount = mill.filter(pos => state.board[pos] === null).length;
    return aiCount === 2 && emptyCount === 1;
  }).length;
  
  const oppTwoInRow = MILLS.filter(mill => {
    const oppCount = mill.filter(pos => state.board[pos] === opponent).length;
    const emptyCount = mill.filter(pos => state.board[pos] === null).length;
    return oppCount === 2 && emptyCount === 1;
  }).length;
  
  score += (aiTwoInRow - oppTwoInRow) * 30;
  
  let aiMobility = 0;
  let oppMobility = 0;
  
  for (let i = 0; i < 24; i++) {
    if (state.board[i] === aiPlayer) {
      aiMobility += ADJACENT[i].filter(adj => state.board[adj] === null).length;
    } else if (state.board[i] === opponent) {
      oppMobility += ADJACENT[i].filter(adj => state.board[adj] === null).length;
    }
  }
  
  score += (aiMobility - oppMobility) * 10;
  
  const centerPositions = [4, 10, 13, 19];
  const aiCenter = centerPositions.filter(pos => state.board[pos] === aiPlayer).length;
  const oppCenter = centerPositions.filter(pos => state.board[pos] === opponent).length;
  score += (aiCenter - oppCenter) * 15;
  
  return score;
}

function getPlacingMoves(state: GameState): Position[] {
  return state.board
    .map((piece, index) => (piece === null ? index : -1))
    .filter(index => index !== -1);
}

function getAllMovingMoves(state: GameState, player: Player): { from: Position; to: Position }[] {
  const moves: { from: Position; to: Position }[] = [];
  
  for (let i = 0; i < 24; i++) {
    if (state.board[i] === player) {
      const validMoves = getValidMoves(state, i);
      for (const to of validMoves) {
        moves.push({ from: i, to });
      }
    }
  }
  
  return moves;
}

function getRemovablePieces(state: GameState, player: Player): Position[] {
  const opponent = player === 'white' ? 'black' : 'white';
  const removable: Position[] = [];
  
  for (let i = 0; i < 24; i++) {
    if (canRemovePiece(state.board, i, opponent)) {
      removable.push(i);
    }
  }
  
  return removable;
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Player
): number {
  if (depth === 0 || state.phase === 'gameOver') {
    return evaluateBoard(state, aiPlayer);
  }
  
  const currentPlayer = state.currentPlayer;
  
  if (state.mustRemove) {
    const removable = getRemovablePieces(state, currentPlayer);
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const pos of removable) {
        const newState = removePiece(state, pos);
        const evalScore = minimax(newState, depth - 1, alpha, beta, false, aiPlayer);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const pos of removable) {
        const newState = removePiece(state, pos);
        const evalScore = minimax(newState, depth - 1, alpha, beta, true, aiPlayer);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
  
  if (state.phase === 'placing') {
    const moves = getPlacingMoves(state);
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const pos of moves) {
        const newState = placePiece(state, pos);
        const evalScore = minimax(newState, depth - 1, alpha, beta, newState.currentPlayer === aiPlayer, aiPlayer);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const pos of moves) {
        const newState = placePiece(state, pos);
        const evalScore = minimax(newState, depth - 1, alpha, beta, newState.currentPlayer === aiPlayer, aiPlayer);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  } else {
    const moves = getAllMovingMoves(state, currentPlayer);
    
    if (moves.length === 0) {
      return isMaximizing ? -Infinity : Infinity;
    }
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const newState = movePiece({ ...state, selectedPiece: move.from }, move.from, move.to);
        const evalScore = minimax(newState, depth - 1, alpha, beta, newState.currentPlayer === aiPlayer, aiPlayer);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const newState = movePiece({ ...state, selectedPiece: move.from }, move.from, move.to);
        const evalScore = minimax(newState, depth - 1, alpha, beta, newState.currentPlayer === aiPlayer, aiPlayer);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
}

export function getAIMove(state: GameState, difficulty: Difficulty): GameState {
  const aiPlayer = state.currentPlayer;
  
  const depthMap = { easy: 1, medium: 3, hard: 5 };
  const depth = depthMap[difficulty];
  
  if (state.mustRemove) {
    const removable = getRemovablePieces(state, aiPlayer);
    
    if (difficulty === 'easy') {
      const randomIndex = Math.floor(Math.random() * removable.length);
      return removePiece(state, removable[randomIndex]);
    }
    
    let bestMove = removable[0];
    let bestScore = -Infinity;
    
    for (const pos of removable) {
      const newState = removePiece(state, pos);
      const score = minimax(newState, depth - 1, -Infinity, Infinity, false, aiPlayer);
      if (score > bestScore) {
        bestScore = score;
        bestMove = pos;
      }
    }
    
    return removePiece(state, bestMove);
  }
  
  if (state.phase === 'placing') {
    const moves = getPlacingMoves(state);
    
    if (difficulty === 'easy') {
      const randomIndex = Math.floor(Math.random() * moves.length);
      return placePiece(state, moves[randomIndex]);
    }
    
    for (const pos of moves) {
      const testBoard = [...state.board];
      testBoard[pos] = aiPlayer;
      if (checkMill(testBoard, pos, aiPlayer)) {
        return placePiece(state, pos);
      }
    }
    
    const opponent = aiPlayer === 'white' ? 'black' : 'white';
    for (const pos of moves) {
      const testBoard = [...state.board];
      testBoard[pos] = opponent;
      if (checkMill(testBoard, pos, opponent)) {
        return placePiece(state, pos);
      }
    }
    
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    for (const pos of moves) {
      const newState = placePiece(state, pos);
      const score = minimax(newState, depth - 1, -Infinity, Infinity, newState.currentPlayer === aiPlayer, aiPlayer);
      if (score > bestScore) {
        bestScore = score;
        bestMove = pos;
      }
    }
    
    return placePiece(state, bestMove);
  } else {
    const moves = getAllMovingMoves(state, aiPlayer);
    
    if (moves.length === 0) {
      return { ...state, phase: 'gameOver', winner: aiPlayer === 'white' ? 'black' : 'white' };
    }
    
    if (difficulty === 'easy') {
      const randomIndex = Math.floor(Math.random() * moves.length);
      const move = moves[randomIndex];
      return movePiece({ ...state, selectedPiece: move.from }, move.from, move.to);
    }
    
    for (const move of moves) {
      const testBoard = [...state.board];
      testBoard[move.from] = null;
      testBoard[move.to] = aiPlayer;
      if (checkMill(testBoard, move.to, aiPlayer)) {
        return movePiece({ ...state, selectedPiece: move.from }, move.from, move.to);
      }
    }
    
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    for (const move of moves) {
      const newState = movePiece({ ...state, selectedPiece: move.from }, move.from, move.to);
      const score = minimax(newState, depth - 1, -Infinity, Infinity, newState.currentPlayer === aiPlayer, aiPlayer);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return movePiece({ ...state, selectedPiece: bestMove.from }, bestMove.from, bestMove.to);
  }
}
