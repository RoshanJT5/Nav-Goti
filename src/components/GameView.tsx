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
      return `${gameState.winner === 'white' ? 'White' : 'Black'} wins!`;
    }
    if (isAIThinking) {
      return 'Computer is thinking...';
    }
    if (gameState.mustRemove) {
      return `${gameState.currentPlayer === 'white' ? 'White' : 'Black'}: Remove a piece!`;
    }
    if (gameState.phase === 'placing') {
      return `${gameState.currentPlayer === 'white' ? 'White' : 'Black'}: Place a piece`;
    }
    if (gameState.selectedPiece !== null) {
      return `${gameState.currentPlayer === 'white' ? 'White' : 'Black'}: Move piece`;
    }
    return `${gameState.currentPlayer === 'white' ? 'White' : 'Black'}: Select a piece`;
  };

  const getStatusIcon = () => {
    if (gameState.phase === 'gameOver') return <Trophy className="w-5 h-5" />;
    if (isAIThinking) return <Activity className="w-5 h-5 animate-pulse" />;
    if (gameState.mustRemove) return <Swords className="w-5 h-5" />;
    if (gameState.phase === 'placing') return <Layers className="w-5 h-5" />;
    if (gameState.selectedPiece !== null) return <Target className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  const whiteName = mode === 'ai' ? (profile?.name || 'You') : 'White';
  const blackName = mode === 'ai' ? 'Computer' : 'Black';

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-500 font-sans"
      style={{ backgroundColor: theme.appBackground }}
    >
      <header
        className="border-b px-6 py-4 transition-colors duration-500"
        style={{ backgroundColor: theme.headerBg, borderColor: theme.boardLineColor + '20' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center gap-3 transition-all duration-300 transform hover:scale-105"
            style={{ color: theme.textColor }}
          >
            <div className="p-2 rounded-lg transition-colors" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <Home className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: theme.titleColor }}>Mill Master</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 rounded-full border flex items-center gap-2" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
              {mode === 'ai' ? (
                <>
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textColor }}>AI: {difficulty}</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textColor }}>Local PVP</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-12 p-3 lg:p-6 pt-6 lg:pt-12 overflow-x-hidden">
        <div className="flex flex-col items-center gap-8">
          <GameInfoPanel
            gameState={gameState}
            whiteName={whiteName}
            blackName={blackName}
            themeId={profile?.theme_id}
          />

          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-white/5 to-white/0 rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <MorrisBoard
              gameState={gameState}
              onPositionClick={handlePositionClick}
              disabled={!isPlayerTurn || isAIThinking}
              themeId={profile?.theme_id}
            />
          </div>

          <div
            className="w-full max-w-[452px] rounded-2xl p-2 shadow-2xl border backdrop-blur-md overflow-hidden"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <Button
                onClick={handleNewGame}
                className="flex-1 flex items-center justify-center gap-2 h-12 font-black uppercase tracking-tighter rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
                style={{ color: theme.textColor, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Sparkles className="w-5 h-5 text-yellow-400 group-hover:rotate-12 transition-transform" />
                New Game
              </Button>

              <div className="flex items-center gap-1 p-1.5 rounded-xl border shadow-inner" style={{ backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)', borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)' }}>
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
                  style={{ color: theme.textColor, backgroundColor: theme.isDark ? 'transparent' : 'rgba(0,0,0,0.05)' }}
                  className="w-10 h-10 rounded-lg disabled:opacity-30 transition-all active:scale-90"
                >
                  <Undo2 className="w-5 h-5" />
                </Button>

                <div className="w-px h-6 bg-white/10 mx-1" />

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
                  style={{ color: theme.textColor, backgroundColor: theme.isDark ? 'transparent' : 'rgba(0,0,0,0.05)' }}
                  className="w-10 h-10 rounded-lg disabled:opacity-30 transition-all active:scale-90"
                >
                  <Redo2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm lg:w-96 flex flex-col gap-6">
          <div
            className="rounded-3xl p-6 shadow-2xl border relative overflow-hidden group transition-all duration-300"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '10' }}
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest opacity-70" style={{ color: theme.id === 'dark' ? undefined : theme.accentColor }}>
                  <MixedColorText text="Game Status" isCyber={theme.id === 'dark'} startIndex={0} />
                </h3>
                <div className="flex gap-1">
                  <div className={`w-2 h-2 rounded-full ${gameState.currentPlayer === 'white' ? 'bg-white shadow-[0_0_8px_white]' : 'bg-white/20'}`} />
                  <div className={`w-2 h-2 rounded-full ${gameState.currentPlayer === 'black' ? 'bg-zinc-800 border border-white/20 shadow-[0_0_8px_rgba(255,255,255,0.1)]' : 'bg-black/20'}`} />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={getStatusMessage()}
                  initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`
                          p-6 rounded-2xl text-center font-bold text-xl shadow-xl flex flex-col items-center gap-4 border
                        `}
                  style={{
                    backgroundColor: gameState.phase === 'gameOver'
                      ? theme.accentColor
                      : gameState.mustRemove
                        ? '#ef4444'
                        : theme.boardLineColor + '05',
                    borderColor: gameState.phase === 'gameOver' || gameState.mustRemove ? 'transparent' : theme.boardLineColor + '10',
                    color: gameState.phase === 'gameOver' || gameState.mustRemove ? '#fff' : theme.accentColor
                  }}
                >
                  <div className={`p-3 rounded-full ${gameState.phase === 'gameOver' || gameState.mustRemove ? 'bg-white/20' : 'bg-white/10'}`}>
                    {getStatusIcon()}
                  </div>
                  <span className="leading-tight">
                    <MixedColorText text={getStatusMessage()} isCyber={theme.id === 'dark'} startIndex={1} />
                  </span>
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl p-4 border flex flex-col gap-1" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center gap-2 opacity-70 mb-1">
                    <Layers className="w-3 h-3" style={{ color: theme.id === 'dark' ? '#ef4444' : theme.accentColor }} />
                    <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: theme.id === 'dark' ? '#3b82f6' : theme.accentColor }}>Phase</span>
                  </div>
                  <span className="font-black text-lg capitalize tracking-tight" style={{ color: theme.id === 'dark' ? '#22c55e' : theme.accentColor }}>{gameState.phase}</span>
                </div>
                <div className="rounded-2xl p-4 border flex flex-col gap-1" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center gap-2 opacity-70 mb-1">
                    <Activity className="w-3 h-3" style={{ color: theme.id === 'dark' ? '#3b82f6' : theme.accentColor }} />
                    <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: theme.id === 'dark' ? '#22c55e' : theme.accentColor }}>Move</span>
                  </div>
                  <span className="font-black text-lg tracking-tight" style={{ color: theme.id === 'dark' ? '#ef4444' : theme.accentColor }}>{currentMoveIndex + 1}</span>
                </div>
              </div>

              {gameState.phase === 'gameOver' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 flex flex-col gap-3"
                >
                  <Button
                    onClick={handleNewGame}
                    className="w-full text-white h-14 text-lg font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Victory Rematch
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onBack}
                    className="w-full h-12 font-bold rounded-xl hover:bg-white/5"
                    style={{ color: theme.textColor }}
                  >
                    Back to Menu
                  </Button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Tips or additional info could go here */}
          <div className="rounded-3xl p-6 border flex items-start gap-4" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Pro Tip</span>
              <p className="text-xs leading-relaxed opacity-60" style={{ color: theme.textColor }}>
                {gameState.phase === 'placing'
                  ? "Focus on creating traps while placing. Two adjacent pieces can be a strong setup."
                  : "Try to block your opponent's movement. Mobility is key in the moving phase."}
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

