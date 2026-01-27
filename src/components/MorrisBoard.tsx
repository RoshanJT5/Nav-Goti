"use client";

import { useState, useRef, useEffect } from "react";
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
  const isCyber = themeId === 'dark';
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

  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const targetWidth = BOARD_SIZE + 80;
        if (containerWidth < targetWidth) {
          setScale(containerWidth / targetWidth);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center items-center overflow-visible"
      style={{ height: (BOARD_SIZE + 80) * scale }}
    >
      <div
        className="relative rounded-3xl p-10 shadow-2xl transition-all duration-500 origin-center"
        style={{
          width: BOARD_SIZE + 80,
          height: BOARD_SIZE + 80,
          backgroundColor: theme.id === 'dark' ? '#000000' : theme.boardBorder,
          boxShadow: theme.id === 'dark'
            ? '0 0 40px rgba(34, 197, 94, 0.2)'
            : `0 20px 50px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)`,
          transform: `scale(${scale})`,
          border: theme.id === 'dark' ? '1px solid rgba(34, 197, 94, 0.1)' : 'none',
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
            <defs>
              <linearGradient id="cyber-board-gradient" x1="0" y1="0" x2={BOARD_SIZE} y2={BOARD_SIZE} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <filter id="neon-glow-line" x="-50" y="-50" width="100" height="100" filterUnits="userSpaceOnUse">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <style>
                {`
                  @keyframes neon-pulse-refined {
                    0%, 100% { opacity: 0.8; stroke-width: ${isCyber ? 7 : 2}; }
                    50% { opacity: 1; stroke-width: ${isCyber ? 9 : 2}; }
                  }
                  .neon-line {
                    animation: neon-pulse-refined 4s ease-in-out infinite;
                  }
                `}
              </style>
            </defs>
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
                  stroke={isCyber ? "url(#cyber-board-gradient)" : theme.boardLineColor}
                  strokeWidth={isCyber ? 8 : theme.lineWidth}
                  strokeLinecap="round"
                  filter={isCyber ? "url(#neon-glow-line)" : undefined}
                  className={isCyber ? "neon-line" : ""}
                />
              );
            })}
          </svg>

          {Array.from({ length: 24 }, (_, position) => {
            const coords = getCoords(position);
            return (
              <div
                key={`node-${position}`}
                className="absolute flex items-center justify-center translate-x-[-50%] translate-y-[-50%]"
                style={{
                  left: coords.x,
                  top: coords.y,
                  width: 12,
                  height: 12,
                  zIndex: 5,
                }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: isCyber ? '#fff' : theme.nodeInnerColor,
                    boxShadow: isCyber ? '0 0 10px #fff, 0 0 20px rgba(255,255,255,0.4)' : 'none',
                    opacity: 1
                  }}
                />
              </div>
            );
          })}

          {Array.from({ length: 24 }, (_, position) => {
            const coords = getCoords(position);
            const piece = gameState.board[position];
            const isCyber = theme.id === 'dark';
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
                          w-[40px] h-[40px] rounded-full flex items-center justify-center text-xl
                          ${isSelected ? 'ring-4 ring-yellow-400 ring-opacity-80 scale-110' : ''}
                        `}
                        style={{
                          background: pieceTheme.bg,
                          border: `2px solid ${pieceTheme.border}`,
                          boxShadow: isCyber ? `0 0 15px ${piece === 'white' ? '#22c55e' : '#ef4444'}` : pieceTheme.shadow,
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
    </div>
  );
}

