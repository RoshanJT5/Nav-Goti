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

const BOARD_SIZE = 380;
const CELL_SIZE = BOARD_SIZE / 6;
const PIECE_SIZE = 32;

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

  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const targetSize = BOARD_SIZE + 60;
        const scaleW = containerWidth / targetSize;
        const scaleH = containerHeight / targetSize;
        const newScale = Math.min(scaleW, scaleH, 1);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

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

  const [isDraggingIndex, setIsDraggingIndex] = useState<number | null>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (index: number) => {
    if (disabled || isReviewMode) return;
    setIsDraggingIndex(index);
    if (gameState.selectedPiece !== index && isSelectable(index)) {
      onPositionClick(index);
    }
  };

  const handleDragEnd = (event: any, info: any, fromIndex: number) => {
    setIsDraggingIndex(null);
    if (disabled || isReviewMode) return;

    const boardElement = boardContainerRef.current;
    if (!boardElement) return;

    const rect = boardElement.getBoundingClientRect();
    const dropX = (info.point.x - rect.left) / scale;
    const dropY = (info.point.y - rect.top) / scale;

    let nearestPos = -1;
    let minDistance = Infinity;
    const threshold = 50;

    for (let i = 0; i < 24; i++) {
      const coords = getCoords(i);
      const dist = Math.sqrt(Math.pow(dropX - coords.x, 2) + Math.pow(dropY - coords.y, 2));
      if (dist < minDistance) {
        minDistance = dist;
        nearestPos = i;
      }
    }

    if (nearestPos !== -1 && minDistance < threshold && nearestPos !== fromIndex) {
      const validMoves = getValidMoves(gameState, fromIndex);
      if (validMoves.includes(nearestPos)) {
        onPositionClick(nearestPos);
      }
    }
  };

  const isReviewMode = gameState.historyStates && gameState.historyStates.length > 0 && !disabled;

  const isPeacock = themeId === 'peacock';

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex justify-center items-center"
    >
      <div
        className={`relative transition-all duration-500 flex justify-center items-center ${isPeacock ? '' : 'rounded-2xl shadow-2xl'}`}
        style={{
          width: BOARD_SIZE + 60,
          height: BOARD_SIZE + 60,
          padding: 0,
          background: isPeacock
            ? 'linear-gradient(135deg, rgba(0, 25, 20, 0.95), rgba(0, 10, 10, 0.98))'
            : (theme.id === 'dark' ? '#000000' : theme.boardBorder),
          boxShadow: isPeacock
            ? '0 0 20px rgba(255, 215, 0, 0.4)'
            : (theme.id === 'dark'
              ? '0 0 40px rgba(34, 197, 94, 0.2)'
              : `0 20px 50px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)`),
          transform: `scale(${scale})`,
          border: isPeacock ? '8px solid #B8860B' : (theme.id === 'dark' ? '1px solid rgba(34, 197, 94, 0.1)' : 'none'),
          borderRadius: isPeacock ? '16px' : '0',
          position: 'relative'
        }}
      >
        {/* Corner Ornaments for Peacock Theme */}
        {isPeacock && (
          <>
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#B8860B] rounded-tl-lg -translate-x-1 -translate-y-1" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#B8860B] rounded-tr-lg translate-x-1 -translate-y-1" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#B8860B] rounded-bl-lg -translate-x-1 translate-y-1" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#B8860B] rounded-br-lg translate-x-1 translate-y-1" />
          </>
        )}

        <div
          ref={boardContainerRef}
          className="relative"
          style={{
            width: BOARD_SIZE,
            height: BOARD_SIZE,
            background: 'transparent',
            backgroundImage: isPeacock ? 'none' : (theme.boardImage ? `url(${theme.boardImage})` : undefined),
            backdropFilter: isPeacock ? 'blur(4px)' : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: isPeacock ? '8px' : '0',
          }}
        >
          <svg
            className="absolute inset-0 overflow-visible"
            width={BOARD_SIZE}
            height={BOARD_SIZE}
          >
            <defs>
              <linearGradient
                id="cyber-board-gradient"
                x1="0" y1="0" x2={BOARD_SIZE} y2={BOARD_SIZE}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>

              <filter
                id="neon-glow"
                x="-100" y="-100" width={BOARD_SIZE + 200} height={BOARD_SIZE + 200}
                filterUnits="userSpaceOnUse"
              >
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur3" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur8" />
                <feMerge>
                  <feMergeNode in="blur8" />
                  <feMergeNode in="blur3" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter
                id="peacock-glow"
                x="-50" y="-50" width={BOARD_SIZE + 100} height={BOARD_SIZE + 100}
              >
                {/* Layer 1: Warm Orange Ambient Glow (Replacing Blue) */}
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blurOrange" />
                <feFlood floodColor="rgba(255, 100, 0, 0.6)" result="colorOrange" />
                <feComposite in="colorOrange" in2="blurOrange" operator="in" result="shadowOrange" />

                {/* Layer 2: Bright Gold Immediate Glow */}
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blurGold" />
                <feFlood floodColor="#FFD700" result="colorGold" />
                <feComposite in="colorGold" in2="blurGold" operator="in" result="shadowGold" />

                <feMerge>
                  <feMergeNode in="shadowOrange" />
                  <feMergeNode in="shadowGold" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <style>
                {`
                  @keyframes neon-pulse-refined {
                    0%, 100% { opacity: 0.8; }
                    50% { opacity: 1; }
                  }
                  .neon-group {
                    animation: neon-pulse-refined 4s ease-in-out infinite;
                  }
                  .peacock-line {
                    filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.8));
                  }
                `}
              </style>
            </defs>

            <g
              className={isCyber || isPeacock ? "neon-group" : ""}
              filter={isCyber ? "url(#neon-glow)" : (isPeacock ? "url(#peacock-glow)" : undefined)}
            >
              {isPeacock ? (
                <>
                  {/* Concentric Squares for Peacock Theme */}
                  {[0, 1, 2].map((i) => {
                    const offset = i * CELL_SIZE;
                    const size = BOARD_SIZE - (i * 2 * CELL_SIZE);
                    return (
                      <rect
                        key={`square-${i}`}
                        x={offset}
                        y={offset}
                        width={size}
                        height={size}
                        fill="none"
                        stroke="#FFD700"
                        strokeWidth="5"
                        rx="12"
                        className="peacock-line"
                        style={{ transition: 'all 0.3s ease' }}
                      />
                    );
                  })}
                  {/* Connecting Lines for Peacock Theme */}
                  {[
                    { x1: 3 * CELL_SIZE, y1: 0, x2: 3 * CELL_SIZE, y2: 2 * CELL_SIZE },
                    { x1: 3 * CELL_SIZE, y1: 4 * CELL_SIZE, x2: 3 * CELL_SIZE, y2: 6 * CELL_SIZE },
                    { x1: 0, y1: 3 * CELL_SIZE, x2: 2 * CELL_SIZE, y2: 3 * CELL_SIZE },
                    { x1: 4 * CELL_SIZE, y1: 3 * CELL_SIZE, x2: 6 * CELL_SIZE, y2: 3 * CELL_SIZE },
                  ].map((line, index) => (
                    <line
                      key={`connect-${index}`}
                      {...line}
                      stroke="#FFD700"
                      strokeWidth="5"
                      strokeLinecap="round"
                      className="peacock-line"
                    />
                  ))}
                </>
              ) : (
                LINES.map((line, index) => {
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
                      style={{ transition: 'all 0.3s ease' }}
                    />
                  );
                })
              )}
            </g>

            {isDraggingIndex !== null && getValidMoves(gameState, isDraggingIndex).map(pos => {
              const coords = getCoords(pos);
              return (
                <circle
                  key={`drop-zone-${pos}`}
                  cx={coords.x}
                  cy={coords.y}
                  r={15}
                  fill={isPeacock ? "#00ffcc" : (isCyber ? "#22c55e" : theme.accentColor)}
                  fillOpacity={0.2}
                  stroke={isPeacock ? "#00ffcc" : (isCyber ? "#22c55e" : theme.accentColor)}
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />
              );
            })}
          </svg>

          {Array.from({ length: 24 }, (_, position) => {
            const coords = getCoords(position);
            const isCyber = theme.id === 'dark';
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
                  className="rounded-full w-2 h-2"
                  style={{
                    backgroundColor: 'transparent',
                    background: isPeacock ? 'radial-gradient(circle at 30% 30%, #FFF7CC, #DAA520)' : (isCyber ? '#fff' : theme.nodeInnerColor),
                    boxShadow: isPeacock ? '0 0 10px #DAA520, 1px 1px 2px rgba(0,0,0,0.8)' : (isCyber ? '0 0 10px #fff, 0 0 20px rgba(255,255,255,0.4)' : 'none'),
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
            const isDraggable = !disabled && !isReviewMode && piece === gameState.currentPlayer && (gameState.phase === 'moving' || (gameState.phase === 'placing' && false));

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
                    transition-all duration-200 
                    ${showHighlight ? 'ring-4 ring-green-400 ring-opacity-80' : ''}
                    ${canRemove ? 'ring-[6px] ring-red-500 ring-opacity-80' : ''}
                    ${canClick && !disabled && !isDraggingIndex ? 'hover:scale-110 cursor-pointer' : ''}
                  `}
                  style={{ backgroundColor: 'transparent' }}
                  onClick={() => !isDraggingIndex && canClick && onPositionClick(position)}
                >
                  <AnimatePresence mode="wait">
                    {piece && (
                      <motion.div
                        drag={isDraggable}
                        dragSnapToOrigin
                        dragConstraints={boardContainerRef}
                        onDragStart={() => handleDragStart(position)}
                        onDragEnd={(e, info) => handleDragEnd(e, info, position)}
                        whileDrag={{
                          scale: 1.3,
                          zIndex: 50,
                          boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: isSelected ? 1.15 : 1,
                          opacity: 1,
                          zIndex: isDraggingIndex === position ? 50 : 10
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`
                          rounded-full flex items-center justify-center text-xl
                          ${isSelected ? 'ring-4 ring-yellow-400 ring-opacity-80' : ''}
                          ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
                        `}
                        style={{
                          width: PIECE_SIZE + 4,
                          height: PIECE_SIZE + 4,
                          aspectRatio: '1 / 1',
                          background: pieceTheme.bg,
                          border: `2px solid ${pieceTheme.border}`,
                          boxShadow: isCyber ? `0 0 15px ${piece === 'white' ? '#22c55e' : '#ef4444'}` : pieceTheme.shadow,
                          color: pieceTheme.color,
                          touchAction: 'none'
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
