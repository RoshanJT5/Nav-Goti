"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MorrisBoard } from "@/components/MorrisBoard";
import { GameInfoPanel } from "@/components/PlayerPanel";
import {
  GameState,
  Position,
  createInitialState,
  placePiece,
  selectPiece,
  movePiece,
  removePiece,
  getValidMoves,
  TOTAL_PIECES,
} from "@/lib/morris-game";
import { getAIMove, Difficulty } from "@/lib/morris-ai";
import { Profile } from "@/hooks/use-profile";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Home,
  Trophy,
  Activity,
  Layers,
  Swords,
  Target,
  Info,
  User,
  Cpu,
  Undo2,
  Redo2,
  Sparkles
} from "lucide-react";

import { getTheme } from "@/lib/themes";

export type GameMode = 'local' | 'ai' | 'online';

interface GameViewProps {
  mode: GameMode;
  difficulty?: Difficulty;
  onBack: () => void;
  roomId?: string;
  playerColor?: 'white' | 'black';
  profile: Profile | null;
}

const MixedColorText = ({ text, isCyber, startIndex = 0 }: { text: string; isCyber: boolean; startIndex?: number }) => {
  if (!isCyber) return <>{text}</>;
  const colors = ['#ef4444', '#3b82f6', '#22c55e']; // Red (Red-500), Blue (Blue-500), Green (Green-500)
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <span key={i} style={{ color: colors[(i + startIndex) % colors.length] }}>
          {word}{i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
};

export function GameView({
  mode,
  difficulty = 'medium',
  onBack,
  roomId,
  playerColor = 'white',
  profile,
}: GameViewProps) {
  const theme = getTheme(profile?.theme_id);
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [moveHistory, setMoveHistory] = useState<GameState[]>([createInitialState()]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const statsUpdated = useRef(false);

  const isPlayerTurn = mode === 'ai'
    ? gameState.currentPlayer === 'white'
    : true;

  const handlePositionClick = useCallback((position: Position) => {
    if (!isPlayerTurn || gameState.phase === 'gameOver' || isAIThinking) return;

    let newState: GameState;

    if (gameState.mustRemove) {
      newState = removePiece(gameState, position);
      if (newState === gameState) return;
    } else if (gameState.phase === 'placing') {
      newState = placePiece(gameState, position);
      if (newState === gameState) return;
    } else {
      if (gameState.selectedPiece === null) {
        newState = selectPiece(gameState, position);
        if (newState === gameState) return;
        setGameState(newState);
        return;
      } else {
        if (position === gameState.selectedPiece) {
          setGameState({ ...gameState, selectedPiece: null });
          return;
        }

        if (gameState.board[position] === gameState.currentPlayer) {
          const validMoves = getValidMoves(gameState, position);
          if (validMoves.length > 0) {
            setGameState({ ...gameState, selectedPiece: position });
            return;
          }
        }

        newState = movePiece(gameState, gameState.selectedPiece, position);
        if (newState === gameState) return;
      }
    }

    setGameState(newState);
    setMoveHistory(prev => [...prev.slice(0, currentMoveIndex + 1), newState]);
    setCurrentMoveIndex(prev => prev + 1);
  }, [gameState, isPlayerTurn, currentMoveIndex, isAIThinking]);

  useEffect(() => {
    if (mode === 'ai' && gameState.currentPlayer === 'black' && gameState.phase !== 'gameOver' && !gameState.mustRemove) {
      setIsAIThinking(true);
      const timer = setTimeout(() => {
        let newState = getAIMove(gameState, difficulty);

        while (newState.mustRemove && newState.currentPlayer === 'black') {
          newState = getAIMove(newState, difficulty);
        }

        setGameState(newState);
        setMoveHistory(prev => [...prev.slice(0, currentMoveIndex + 1), newState]);
        setCurrentMoveIndex(prev => prev + 1);
        setIsAIThinking(false);
      }, 500);
      return () => clearTimeout(timer);
    }

    if (mode === 'ai' && gameState.currentPlayer === 'black' && gameState.mustRemove) {
      setIsAIThinking(true);
      const timer = setTimeout(() => {
        const newState = getAIMove(gameState, difficulty);
        setGameState(newState);
        setMoveHistory(prev => [...prev.slice(0, currentMoveIndex + 1), newState]);
        setCurrentMoveIndex(prev => prev + 1);
        setIsAIThinking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState, mode, difficulty, currentMoveIndex]);

  // Handle game end and stats update for AI mode
  useEffect(() => {
    if (mode === 'ai' && gameState.phase === 'gameOver' && !statsUpdated.current && profile) {
      const updateStats = async () => {
        statsUpdated.current = true;
        const isWinner = gameState.winner === 'white'; // Player is always white in AI mode for now
        const updates: any = {};

        if (isWinner) {
          updates.wins = (profile.wins || 0) + 1;
        } else {
          updates.losses = (profile.losses || 0) + 1;
        }

        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', profile.id);
      };
      updateStats();
    }
  }, [gameState.phase, gameState.winner, mode, profile]);

  const handleNewGame = () => {
    const initial = createInitialState();
    setGameState(initial);
    setMoveHistory([initial]);
    setCurrentMoveIndex(0);
    statsUpdated.current = false;
  };

  const getStatusMessage = () => {
    if (gameState.phase === 'gameOver') {
      const winnerName = gameState.winner === 'white'
        ? (theme.whitePlayerName || 'White')
        : (theme.blackPlayerName || 'Black');
      return `${winnerName} wins!`;
    }
    if (isAIThinking) {
      return 'Computer is thinking...';
    }
    const currentPlayerName = gameState.currentPlayer === 'white'
      ? (theme.whitePlayerName || 'White')
      : (theme.blackPlayerName || 'Black');

    if (gameState.mustRemove) {
      return `${currentPlayerName}: Remove a piece!`;
    }
    if (gameState.phase === 'placing') {
      return `${currentPlayerName}: Place a piece`;
    }
    if (gameState.selectedPiece !== null) {
      return `${currentPlayerName}: Move piece`;
    }
    return `${currentPlayerName}: Select a piece`;
  };

  const getStatusIcon = () => {
    if (gameState.phase === 'gameOver') return <Trophy className="w-5 h-5" />;
    if (isAIThinking) return <Activity className="w-5 h-5 animate-pulse" />;
    if (gameState.mustRemove) return <Swords className="w-5 h-5" />;
    if (gameState.phase === 'placing') return <Layers className="w-5 h-5" />;
    if (gameState.selectedPiece !== null) return <Target className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  const whiteName = mode === 'ai' ? (profile?.name || 'You') : (theme.whitePlayerName || 'White');
  const blackName = mode === 'ai' ? 'Computer' : (theme.blackPlayerName || 'Black');

  return (
    <div
      className="h-screen flex flex-col overflow-hidden transition-all duration-500 relative"
      style={{
        background: theme.id === 'peacock' ? 'transparent' : theme.appBackground,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background Atmosphere Layer */}
      <div className={theme.id === 'peacock' ? 'peacock-atmosphere' : ''} />

      {/* Background Texture Layer */}
      {theme.bgImage && (
        <div
          className={`absolute inset-0 pointer-events-none z-0 ${theme.id === 'peacock' ? 'peacock-feather-pattern' : ''}`}
          style={{
            backgroundImage: `url(${theme.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            opacity: theme.bgImageOpacity ?? 1,
          }}
        />
      )}
      {/* Compact Header */}
      <header
        className="border-b px-3 py-2 transition-colors duration-500 flex-shrink-0"
        style={{ backgroundColor: theme.headerBg, borderColor: theme.boardLineColor + '20' }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 transition-all"
            style={{ color: theme.textColor }}
          >
            <Home className="w-5 h-5" />
            <span className="font-bold text-sm hidden sm:inline" style={{ color: theme.titleColor }}>Nav Goti</span>
          </button>
          <div className="px-3 py-1 rounded-full border flex items-center gap-2 text-xs" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            {mode === 'ai' ? (
              <>
                <Cpu className="w-3 h-3 text-blue-400" />
                <span className="font-bold uppercase" style={{ color: theme.textColor }}>{difficulty}</span>
              </>
            ) : (
              <>
                <User className="w-3 h-3 text-green-400" />
                <span className="font-bold uppercase" style={{ color: theme.textColor }}>PVP</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Top Player Bar (Opponent/Black) */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0"
        style={{
          backgroundColor: gameState.currentPlayer === 'black' ? 'rgba(0, 15, 20, 0.95)' : 'transparent',
          borderBottom: gameState.currentPlayer === 'black' ? '2px solid rgba(255, 255, 255, 0.2)' : 'none',
          opacity: gameState.currentPlayer === 'black' ? 1.0 : 0.4,
          boxShadow: gameState.currentPlayer === 'black' ? '0 0 15px rgba(0, 0, 0, 0.5)' : 'none',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg"
            style={{ backgroundColor: '#1f2937', border: '2px solid #374151' }}
          >
            {mode === 'ai' ? <Cpu className="w-5 h-5" /> : blackName.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-sm text-white">{blackName}</div>
            <div className="text-xs opacity-60 text-white">
              {TOTAL_PIECES - gameState.blackPiecesPlaced} to place, {gameState.blackPiecesOnBoard} on board
            </div>
          </div>
        </div>
        {gameState.currentPlayer === 'black' && (
          <div className="flex items-center gap-2">
            {isAIThinking && <Activity className="w-4 h-4 animate-pulse" style={{ color: theme.accentColor }} />}
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* Game Board - Centered and Responsive */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 overflow-hidden">
        <div className="w-full max-w-[min(100vw-2rem,500px)] aspect-square flex items-center justify-center">
          <MorrisBoard
            gameState={gameState}
            onPositionClick={handlePositionClick}
            disabled={!isPlayerTurn || isAIThinking}
            themeId={profile?.theme_id}
          />
        </div>

        {/* Status Message - Compact */}
        <AnimatePresence mode="wait">
          <motion.div
            key={getStatusMessage()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`px-4 py-1.5 rounded-full flex items-center gap-2 font-bold shadow-lg border-2 z-10 transition-colors duration-500`}
            style={{
              backgroundColor: theme.id === 'peacock'
                ? (gameState.currentPlayer === 'white' ? 'rgba(0, 255, 127, 0.2)' : 'rgba(0, 0, 255, 0.2)')
                : (gameState.phase === 'gameOver' || gameState.mustRemove ? '#ef4444' : theme.accentColor),
              borderColor: theme.id === 'peacock'
                ? (gameState.currentPlayer === 'white' ? '#00FF7F' : '#00FFFF')
                : (gameState.phase === 'gameOver' || gameState.mustRemove ? '#dc2626' : theme.mutedColor),
              color: theme.id === 'peacock'
                ? (gameState.currentPlayer === 'white' ? '#00FF7F' : '#00FFFF')
                : '#fff',
              boxShadow: theme.id === 'peacock'
                ? `0 0 15px ${gameState.currentPlayer === 'white' ? 'rgba(0, 255, 127, 0.4)' : 'rgba(0, 255, 255, 0.4)'}`
                : 'none'
            }}
          >
            {getStatusIcon()}
            <span className="text-xs sm:text-sm">
              {gameState.phase === 'gameOver'
                ? `${gameState.winner === 'white' ? whiteName : blackName} wins!`
                : (theme.id === 'peacock'
                  ? `${gameState.currentPlayer === 'white' ? 'EMERALD' : 'SAPPHIRE'}'S TURN`
                  : (gameState.mustRemove
                    ? 'Remove piece!'
                    : gameState.phase === 'placing'
                      ? 'Place piece'
                      : 'Move piece'
                  )
                )
              }
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Player Bar (You/White) */}
      <div
        className="px-4 py-3 border-t flex items-center justify-between flex-shrink-0"
        style={{
          backgroundColor: gameState.currentPlayer === 'white' ? 'rgba(0, 15, 20, 0.95)' : 'transparent',
          borderTop: gameState.currentPlayer === 'white' ? '2px solid rgba(255, 255, 255, 0.2)' : 'none',
          opacity: gameState.currentPlayer === 'white' ? 1.0 : 0.4,
          boxShadow: gameState.currentPlayer === 'white' ? '0 0 15px rgba(0, 0, 0, 0.5)' : 'none',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg"
            style={{ backgroundColor: '#f3f4f6', color: '#1f2937', border: '2px solid #e5e7eb' }}
          >
            {mode === 'ai' ? <User className="w-5 h-5" /> : whiteName.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-sm text-white">{whiteName}</div>
            <div className="text-xs opacity-60 text-white">
              {TOTAL_PIECES - gameState.whitePiecesPlaced} to place, {gameState.whitePiecesOnBoard} on board
            </div>
          </div>
        </div>
        {gameState.currentPlayer === 'white' && (
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        )}
      </div>

      {/* Bottom Action Bar */}
      <div
        className="px-3 py-2 border-t flex items-center gap-2 flex-shrink-0"
        style={{ backgroundColor: theme.headerBg, borderColor: theme.boardLineColor + '20' }}
      >
        <Button
          onClick={handleNewGame}
          className="flex-1 flex items-center justify-center gap-2 h-10 font-bold text-sm rounded-lg transition-all active:scale-95 shadow-lg"
          style={{
            backgroundColor: '#FFD700',
            color: '#000',
            opacity: 0.95,
            fontWeight: 'bold',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.95';
            e.currentTarget.style.transform = 'scale(1.0)';
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">New Game</span>
          <span className="sm:hidden">New</span>
        </Button>

        <div className="flex items-center gap-1 px-2 py-1 rounded-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '20' }}>
          <Button
            variant="ghost"
            size="icon"
            disabled={currentMoveIndex === 0}
            onClick={() => {
              if (currentMoveIndex > 0) {
                setCurrentMoveIndex(currentMoveIndex - 1);
                setGameState(moveHistory[currentMoveIndex - 1]);
              }
            }}
            className="w-8 h-8 rounded disabled:opacity-30"
            style={{ color: theme.textColor }}
          >
            <Undo2 className="w-4 h-4" />
          </Button>

          <div className="px-2 text-xs font-bold" style={{ color: theme.textColor }}>
            {currentMoveIndex + 1}
          </div>

          <Button
            variant="ghost"
            size="icon"
            disabled={currentMoveIndex === moveHistory.length - 1}
            onClick={() => {
              if (currentMoveIndex < moveHistory.length - 1) {
                setCurrentMoveIndex(currentMoveIndex + 1);
                setGameState(moveHistory[currentMoveIndex + 1]);
              }
            }}
            className="w-8 h-8 rounded disabled:opacity-30"
            style={{ color: theme.textColor }}
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-2 py-1 rounded-lg border text-xs font-bold flex items-center gap-1" style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '20', color: theme.textColor }}>
          <Layers className="w-3 h-3" />
          <span className="capitalize hidden sm:inline">{gameState.phase}</span>
        </div>
      </div>

      {/* Game Over Modal */}
      {gameState.phase === 'gameOver' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-6 shadow-2xl max-w-sm w-full"
            style={{ backgroundColor: theme.cardBg }}
          >
            <div className="text-center mb-6">
              <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: theme.accentColor }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.titleColor }}>
                {gameState.winner === 'white' ? whiteName : blackName} Wins!
              </h2>
              <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
                Game completed in {currentMoveIndex + 1} moves
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleNewGame}
                className="w-full h-12 text-lg font-bold rounded-xl"
                style={{ backgroundColor: theme.accentColor, color: '#fff' }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Play Again
              </Button>
              <Button
                variant="outline"
                onClick={onBack}
                className="w-full h-12 font-bold rounded-xl"
                style={{ borderColor: theme.boardLineColor + '20', color: theme.textColor }}
              >
                Back to Menu
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

