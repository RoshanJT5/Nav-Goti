"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  GameState,
  Position,
  POSITION_COORDS,
  ADJACENT,
  getValidMoves,
  canRemovePiece,
  TOTAL_PIECES,
} from "@/lib/morris-game";
import { getTheme } from "@/lib/themes";

const BOARD_SIZE = 420;
const CELL_SIZE = BOARD_SIZE / 6;
const PIECE_SIZE = 36;

const LINES: { from: Position; to: Position }[] = [
  { from: 0, to: 1 }, { from: 1, to: 2 },
  { from: 3, to: 4 }, { from: 4, to: 5 },
  { from: 6, to: 7 }, { from: 7, to: 8 },
  { from: 9, to: 10 }, { from: 10, to: 11 },
  { from: 12, to: 13 }, { from: 13, to: 14 },
  { from: 15, to: 16 }, { from: 16, to: 17 },
  { from: 18, to: 19 }, { from: 19, to: 20 },
  { from: 21, to: 22 }, { from: 22, to: 23 },
  { from: 0, to: 9 }, { from: 9, to: 21 },
  { from: 3, to: 10 }, { from: 10, to: 18 },
  { from: 6, to: 11 }, { from: 11, to: 15 },
  { from: 1, to: 4 }, { from: 4, to: 7 },
  { from: 16, to: 19 }, { from: 19, to: 22 },
  { from: 8, to: 12 }, { from: 12, to: 17 },
  { from: 5, to: 13 }, { from: 13, to: 20 },
  { from: 2, to: 14 }, { from: 14, to: 23 },
];

interface MorrisBoardProps {
  gameState: GameState;
  onPositionClick: (position: Position) => void;
  disabled?: boolean;
  flipped?: boolean;
  themeId?: string;
}

export function MorrisBoard({ 
  gameState, 
  onPositionClick, 
  disabled = false, 
  flipped = false,
  themeId = 'classic'
}: MorrisBoardProps) {
  const theme = getTheme(themeId);
  const getCoords = (position: Position) => {
    const coords = POSITION_COORDS[position];
    let x = coords.x * CELL_SIZE;
    let y = coords.y * CELL_SIZE;
    if (flipped) {
      x = BOARD_SIZE - x;
      y = BOARD_SIZE - y;
    }
    return { x, y };
  };

  const isValidTarget = (position: Position) => {
    if (disabled) return false;
    
    if (gameState.mustRemove) {
      const opponent = gameState.currentPlayer === 'white' ? 'black' : 'white';
      return canRemovePiece(gameState.board, position, opponent);
    }

    if (gameState.phase === 'placing') {
      return gameState.board[position] === null;
    }

    if (gameState.selectedPiece !== null) {
      const validMoves = getValidMoves(gameState, gameState.selectedPiece);
      return validMoves.includes(position);
    }

    return gameState.board[position] === gameState.currentPlayer;
  };

  const isSelectable = (position: Position) => {
    if (disabled) return false;
    if (gameState.mustRemove) return false;
    if (gameState.phase !== 'moving') return false;
    if (gameState.board[position] !== gameState.currentPlayer) return false;
    const validMoves = getValidMoves(gameState, position);
    return validMoves.length > 0;
  };

  return (
    <div 
      className="relative rounded-3xl p-10 shadow-2xl transition-all duration-500"
      style={{ 
        width: BOARD_SIZE + 80, 
        height: BOARD_SIZE + 80,
        backgroundColor: theme.boardBorder,
        boxShadow: `0 20px 50px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)`
      }}
    >
      <div 
        className="relative rounded-2xl"
        style={{ 
          width: BOARD_SIZE, 
          height: BOARD_SIZE,
          backgroundColor: theme.boardBg,
        }}
      >
        <svg 
          className="absolute inset-0 overflow-visible" 
          width={BOARD_SIZE} 
          height={BOARD_SIZE}
        >
          {LINES.map((line, index) => {
            const from = getCoords(line.from);
            const to = getCoords(line.to);
            return (
              <line
                key={index}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={theme.boardLineColor}
                strokeWidth={theme.lineWidth}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

          {Array.from({ length: 24 }, (_, position) => {
            const coords = getCoords(position);
            return (
              <div
                key={`node-${position}`}
                className="absolute"
                style={{
                  left: coords.x - 6,
                  top: coords.y - 6,
                  width: 12,
                  height: 12,
                  zIndex: 5,
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: theme.nodeInnerColor }}
                />
              </div>
            );
          })}

          {Array.from({ length: 24 }, (_, position) => {
            const coords = getCoords(position);
            const piece = gameState.board[position];
            const isSelected = gameState.selectedPiece === position;
            const canClick = isValidTarget(position) || isSelectable(position);
            const showHighlight = gameState.selectedPiece !== null && 
              getValidMoves(gameState, gameState.selectedPiece).includes(position);
            const canRemove = gameState.mustRemove && 
              canRemovePiece(gameState.board, position, gameState.currentPlayer === 'white' ? 'black' : 'white');

            const pieceTheme = piece === 'white' ? theme.whitePiece : theme.blackPiece;

            return (
              <div
                key={`click-${position}`}
                className="absolute z-10"
                style={{
                  left: coords.x - PIECE_SIZE / 2,
                  top: coords.y - PIECE_SIZE / 2,
                  width: PIECE_SIZE,
                  height: PIECE_SIZE,
                }}
              >
                <div
                  className={`
                    w-full h-full rounded-full flex items-center justify-center
                    transition-all duration-200 cursor-pointer
                    ${showHighlight ? 'ring-4 ring-green-400 ring-opacity-80' : ''}
                    ${canRemove ? 'ring-4 ring-red-500 ring-opacity-80' : ''}
                    ${canClick && !disabled ? 'hover:scale-110' : ''}
                  `}
                  style={{
                    backgroundColor: 'transparent',
                  }}
                  onClick={() => canClick && onPositionClick(position)}
                >
                  <AnimatePresence mode="wait">
                    {piece && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`
                          w-[36px] h-[36px] rounded-full flex items-center justify-center text-lg
                          ${isSelected ? 'ring-4 ring-yellow-400 ring-opacity-80 scale-110' : ''}
                        `}
                        style={{
                          background: pieceTheme.bg,
                          border: `2px solid ${pieceTheme.border}`,
                          boxShadow: pieceTheme.shadow,
                          color: pieceTheme.color,
                        }}
                      >
                        {pieceTheme.content}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

