"use client";

import { GameState, TOTAL_PIECES } from "@/lib/morris-game";
import { Clock, CircleDot } from "lucide-react";

import { getTheme } from "@/lib/themes";
import { useGuestProfile } from "@/hooks/use-profile";

interface PlayerPanelProps {
  playerName: string;
  color: 'white' | 'black';
  isCurrentTurn: boolean;
  piecesPlaced: number;
  piecesOnBoard: number;
  captured: number;
  timeLeft?: number;
  avatar?: string;
  rating?: number;
  themeId?: string;
}

export function PlayerPanel({
  playerName,
  color,
  isCurrentTurn,
  piecesPlaced,
  piecesOnBoard,
  captured,
  timeLeft,
  avatar,
  rating,
  themeId,
}: PlayerPanelProps) {
  const theme = getTheme(themeId);
  const piecesToPlace = TOTAL_PIECES - piecesPlaced;
  const pieceTheme = color === 'white' ? theme.whitePiece : theme.blackPiece;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`
        flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border
      `}
      style={{ 
        backgroundColor: isCurrentTurn ? theme.accentColor : theme.cardBg,
        borderColor: isCurrentTurn ? theme.accentColor : theme.boardLineColor + '20',
        boxShadow: isCurrentTurn ? `0 4px 12px ${theme.accentColor}40` : 'none'
      }}
    >
      <div className="relative">
        <div 
          className="w-12 h-12 rounded-md overflow-hidden flex items-center justify-center text-xl font-bold border-2"
          style={{ 
            background: pieceTheme.bg, 
            borderColor: pieceTheme.border,
            color: pieceTheme.color || (color === 'white' ? '#000' : '#fff')
          }}
        >
          {avatar ? (
            <img src={avatar} alt={playerName} className="w-full h-full object-cover" />
          ) : (
            <span>{pieceTheme.content || playerName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        {isCurrentTurn && (
          <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-white rounded-full animate-pulse shadow-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate" style={{ color: isCurrentTurn ? '#fff' : theme.textColor }}>{playerName}</span>
          {rating && (
            <span className="text-sm opacity-60" style={{ color: isCurrentTurn ? '#fff' : theme.textColor }}>({rating})</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs mt-1 opacity-70" style={{ color: isCurrentTurn ? '#fff' : theme.textColor }}>
          <span className="flex items-center gap-1">
            <CircleDot className="w-3 h-3" />
            {piecesToPlace > 0 ? `${piecesToPlace} to place` : `${piecesOnBoard} on board`}
          </span>
          {captured > 0 && (
            <span className={isCurrentTurn ? 'text-white' : 'text-red-500'}>
              {captured} captured
            </span>
          )}
        </div>
      </div>

      {timeLeft !== undefined && (
        <div 
          className={`
            flex items-center gap-1 px-3 py-1 rounded font-mono text-lg font-bold
            ${timeLeft < 30 ? 'bg-red-600 text-white' : 'bg-black/20 text-white'}
          `}
        >
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>
      )}
    </div>
  );
}

interface GameInfoPanelProps {
  gameState: GameState;
  whiteName?: string;
  blackName?: string;
  whiteRating?: number;
  blackRating?: number;
  whiteTime?: number;
  blackTime?: number;
  themeId?: string;
}

export function GameInfoPanel({
  gameState,
  whiteName = "White",
  blackName = "Black",
  whiteRating,
  blackRating,
  whiteTime,
  blackTime,
  themeId,
}: GameInfoPanelProps) {
  const whiteCaptured = TOTAL_PIECES - gameState.blackPiecesOnBoard - (TOTAL_PIECES - gameState.blackPiecesPlaced);
  const blackCaptured = TOTAL_PIECES - gameState.whitePiecesOnBoard - (TOTAL_PIECES - gameState.whitePiecesPlaced);

  return (
    <div className="flex flex-col gap-2 w-full max-w-[452px]">
      <PlayerPanel
        playerName={blackName}
        color="black"
        isCurrentTurn={gameState.currentPlayer === 'black' && gameState.phase !== 'gameOver'}
        piecesPlaced={gameState.blackPiecesPlaced}
        piecesOnBoard={gameState.blackPiecesOnBoard}
        captured={blackCaptured}
        timeLeft={blackTime}
        rating={blackRating}
        themeId={themeId}
      />
      
      <PlayerPanel
        playerName={whiteName}
        color="white"
        isCurrentTurn={gameState.currentPlayer === 'white' && gameState.phase !== 'gameOver'}
        piecesPlaced={gameState.whitePiecesPlaced}
        piecesOnBoard={gameState.whitePiecesOnBoard}
        captured={whiteCaptured}
        timeLeft={whiteTime}
        rating={whiteRating}
        themeId={themeId}
      />
    </div>
  );
}
