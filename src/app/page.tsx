"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { GameView, GameMode } from "@/components/GameView";
import { OnlineGameView } from "@/components/OnlineGameView";
import { MatchmakingView } from "@/components/MatchmakingView";
import { ProfileDialog } from "@/components/ProfileDialog";
import { Difficulty } from "@/lib/morris-ai";
import { useGuestProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { getTheme } from "@/lib/themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Users,
  Globe,
  Trophy,
  BookOpen,
  Zap,
  Target,
  Sparkles,
  Play,
  Copy,
  Check,
  Shuffle,
  UserCircle,
  Settings,
  Download
} from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";

type Screen = 'home' | 'game' | 'rules' | 'matchmaking';

// Session storage keys
const ACTIVE_ROOM_KEY = 'mill_game_active_room';
const GAME_MODE_KEY = 'mill_game_mode';

export default function Home() {
  const { profile, loading: profileLoading, updateProfile } = useGuestProfile();
  const { isInstallable, installApp } = usePWA();
  const [screen, setScreen] = useState<Screen>('home');
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [showOnlineDialog, setShowOnlineDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);

  const theme = getTheme(profile?.theme_id);

  // Restore active game session on page load (for refresh persistence)
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionRestored) {
      const savedRoom = localStorage.getItem(ACTIVE_ROOM_KEY);
      const savedMode = localStorage.getItem(GAME_MODE_KEY);

      if (savedRoom && savedMode === 'online') {
        console.log('Restoring online game session:', savedRoom);
        setRoomCode(savedRoom);
        setGameMode('online');
        setScreen('game');
      }
      setSessionRestored(true);
    }
  }, [sessionRestored]);

  // Save/clear session when entering/leaving online game
  const enterOnlineGame = useCallback((code: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_ROOM_KEY, code);
      localStorage.setItem(GAME_MODE_KEY, 'online');
    }
    setRoomCode(code);
    setGameMode('online');
    setScreen('game');
  }, []);

  const exitOnlineGame = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_ROOM_KEY);
      localStorage.removeItem(GAME_MODE_KEY);
    }
    setRoomCode('');
    setScreen('home');
  }, []);

  const startGame = (mode: GameMode) => {
    if (mode === 'ai') {
      setShowDifficultyDialog(true);
    } else if (mode === 'online') {
      setShowOnlineDialog(true);
    } else {
      setGameMode(mode);
      setScreen('game');
    }
  };

  const startAIGame = () => {
    setGameMode('ai');
    setShowDifficultyDialog(false);
    setScreen('game');
  };

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRandomMatch = () => {
    setShowOnlineDialog(false);
    setScreen('matchmaking');
  };

  const handleMatchFound = useCallback((matchedRoomId: string) => {
    // Use the new enterOnlineGame to properly save session
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_ROOM_KEY, matchedRoomId);
      localStorage.setItem(GAME_MODE_KEY, 'online');
    }
    setRoomCode(matchedRoomId);
    setGameMode('online');
    setScreen('game');
  }, []);

  const handleCancelMatchmaking = useCallback(() => {
    setScreen('home');
  }, []);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#312e2b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#629924] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium">Initializing Nav Goti...</p>
        </div>
      </div>
    );
  }

  if (screen === 'matchmaking') {
    return (
      <MatchmakingView
        onMatch={handleMatchFound}
        onCancel={handleCancelMatchmaking}
        profile={profile}
      />
    );
  }

  if (screen === 'game') {
    if (gameMode === 'online') {
      return (
        <OnlineGameView
          roomId={roomCode}
          onBack={exitOnlineGame}
          profile={profile}
        />
      );
    }
    return (
      <GameView
        mode={gameMode}
        difficulty={difficulty}
        onBack={() => setScreen('home')}
        roomId={roomCode}
        profile={profile}
      />
    );
  }

  if (screen === 'rules') {
    return (
      <div
        className="min-h-screen transition-all duration-500 relative"
        style={{
          backgroundColor: theme.appBackground?.includes('gradient') ? 'transparent' : theme.appBackground,
          backgroundImage: theme.appBackground?.includes('gradient') ? theme.appBackground : 'none',
          backgroundAttachment: 'fixed',
        }}
      >
        {theme.bgImage && (
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `url(${theme.bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
              opacity: theme.bgImageOpacity ?? 1,
            }}
          />
        )}
        <div className="relative z-10 min-h-screen flex flex-col">
          <header
            className="px-4 py-3 border-b sticky top-0 z-50 backdrop-blur-md"
            style={{
              backgroundColor: theme.headerBg,
              borderColor: theme.id === 'peacock' ? 'rgba(255, 215, 0, 0.3)' : theme.boardLineColor + '20'
            }}
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={() => setScreen('home')}
                className="flex items-center gap-2 transition-colors"
                style={{ color: theme.textColor }}
              >
                <span className="text-2xl font-bold" style={{ color: theme.titleColor }}>Nav Goti</span>
              </button>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-8 flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-8 backdrop-blur-xl border"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.id === 'peacock' ? 'rgba(255, 215, 0, 0.5)' : theme.boardLineColor + '20',
                boxShadow: theme.id === 'peacock' ? '0 8px 32px 0 rgba(0, 0, 0, 0.5)' : 'none'
              }}
            >
              <h1 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ color: theme.titleColor }}>
                <BookOpen
                  className="w-8 h-8"
                  style={{
                    color: theme.accentColor,
                    filter: theme.id === 'peacock' ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))' : 'none'
                  }}
                />
                Nav Goti Rules
              </h1>

              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2" style={{ color: theme.headingColor }}>
                    <Target
                      className="w-5 h-5"
                      style={{
                        color: theme.accentColor,
                        filter: theme.id === 'peacock' ? 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.6))' : 'none'
                      }}
                    />
                    Objective
                  </h2>
                  <p style={{ color: theme.textColor }}>
                    Reduce your opponent to two pieces OR block all their pieces
                    so they cannot move.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2" style={{ color: theme.headingColor }}>
                    <Zap
                      className="w-5 h-5"
                      style={{
                        color: theme.id === 'peacock' ? '#00ffcc' : theme.accentColor,
                        filter: theme.id === 'peacock' ? 'drop-shadow(0 0 6px rgba(0, 255, 204, 0.6))' : 'none'
                      }}
                    />
                    Game Phases
                  </h2>
                  <div className="space-y-4">
                    <div className="rounded-lg p-4 bg-white/5 border border-white/10">
                      <h3 className="font-semibold mb-2" style={{ color: theme.headingColor }}>
                        Phase 1: Placing
                      </h3>
                      <p style={{ color: theme.textColor }}>
                        Players take turns placing their 9 pieces on any empty
                        intersection on the board.
                      </p>
                    </div>
                    <div className="rounded-lg p-4 bg-white/5 border border-white/10">
                      <h3 className="font-semibold mb-2" style={{ color: theme.headingColor }}>
                        Phase 2: Moving
                      </h3>
                      <p style={{ color: theme.textColor }}>
                        After all pieces are placed, players move one piece per
                        turn to an adjacent empty point along the lines.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2" style={{ color: theme.headingColor }}>
                    <Sparkles
                      className="w-5 h-5"
                      style={{
                        color: theme.accentColor,
                        filter: theme.id === 'peacock' ? 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.6))' : 'none'
                      }}
                    />
                    Forming Mills
                  </h2>
                  <p className="mb-3" style={{ color: theme.textColor }}>
                    A <strong className="font-bold">mill</strong> is three pieces
                    in a row along a line. When you form a mill, you remove one of
                    your opponent&apos;s pieces from the board.
                  </p>

                  <ul className="list-disc list-inside space-y-1 opacity-90" style={{ color: theme.textColor }}>
                    <li>
                      You cannot remove a piece that is part of a mill unless no
                      other pieces are available
                    </li>
                    <li>Removed pieces are out of the game permanently</li>
                    <li>You can form the same mill multiple times by moving a piece out and back</li>
                  </ul>
                </section>
              </div>

              <Button
                onClick={() => setScreen('home')}
                className="mt-8 transition-transform hover:scale-105"
                style={{
                  backgroundColor: theme.id === 'peacock' ? '#ffd700' : '#629924',
                  color: theme.id === 'peacock' ? '#000' : '#fff',
                  boxShadow: theme.id === 'peacock' ? '0 0 15px rgba(255, 215, 0, 0.4)' : 'none'
                }}
              >
                Back to Home
              </Button>
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-all duration-500 relative overflow-x-hidden"
      style={{
        backgroundColor: theme.id === 'peacock' ? 'transparent' : (theme.appBackground?.includes('gradient') ? 'transparent' : theme.appBackground),
        backgroundImage: theme.id === 'peacock'
          ? 'linear-gradient(135deg, #0a9d81 0%, #0066b3 100%)'
          : (theme.appBackground?.includes('gradient') ? theme.appBackground : 'none'),
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background Atmosphere Layer (Universal) */}
      <div className={theme.id === 'peacock' ? 'peacock-atmosphere' : ''} />

      {/* Background Watermark/Texture Layer */}
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

      {/* Main Content Layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <header
          className="px-4 py-3 border-b sticky top-0 z-50 backdrop-blur-md"
          style={{
            backgroundColor: theme.headerBg,
            borderColor: theme.id === 'peacock' ? 'rgba(255, 215, 0, 0.3)' : theme.boardLineColor + '20'
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
                style={{
                  backgroundColor: theme.accentColor,
                  filter: theme.id === 'peacock' ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))' : 'none'
                }}
              >
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className={`text-2xl font-bold ${theme.id === 'modern' ? 'text-gray-900' : 'text-white'}`}>Nav Goti</span>
            </div>

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6 mr-4">
                <button
                  onClick={() => startGame('ai')}
                  className={`hover:opacity-80 transition-opacity text-sm font-medium ${theme.id === 'modern' ? 'text-gray-900' : 'text-white'}`}
                >
                  Play
                </button>
                <button
                  onClick={() => setScreen('rules')}
                  className={`hover:opacity-80 transition-opacity text-sm font-medium ${theme.id === 'modern' ? 'text-gray-900' : 'text-white'}`}
                >
                  Learn
                </button>
              </nav>

              {isInstallable && (
                <Button
                  onClick={installApp}
                  variant="outline"
                  className="mr-2 flex items-center gap-2 border-green-500/50 text-green-500 hover:bg-green-500/10"
                  style={{ backgroundColor: theme.cardBg }}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Install App</span>
                </Button>
              )}

              <Button
                onClick={() => setShowProfileDialog(true)}
                variant="ghost"
                className="flex items-center gap-2 border transition-all"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.id === 'peacock' ? 'rgba(255, 215, 0, 0.4)' : theme.boardLineColor + '20',
                  color: theme.textColor,
                  boxShadow: theme.id === 'peacock' ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: theme.accentColor }}>
                  {profile?.name?.substring(0, 2).toUpperCase() || 'G'}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline">
                  {profile?.name || 'Guest'}
                </span>
                <Settings className="w-4 h-4 ml-1 opacity-50" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4" style={{ color: theme.id === 'classic' ? '#629924' : theme.titleColor }}>
              Nav Goti
            </h1>
            <p className={`text-xl max-w-3xl mx-auto opacity-80 ${theme.id === 'modern' ? 'text-gray-800' : 'text-white'}`}>
              The ancient strategy game from Sindhu, India. Form mills, capture pieces, and
              outsmart your opponent.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <button
                onClick={() => startGame('ai')}
                className="w-full h-full border rounded-xl p-4 sm:p-6 transition-all hover:scale-[1.02] hover:shadow-xl group text-left backdrop-blur-xl"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.id === 'peacock' ? 'rgba(0, 255, 204, 0.5)' : theme.boardLineColor + '20',
                  boxShadow: theme.id === 'peacock' ? '0 8px 32px 0 rgba(0, 0, 0, 0.5)' : 'none'
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg"
                  style={{
                    backgroundColor: theme.gameModes.ai.color,
                    filter: theme.id === 'peacock' ? 'drop-shadow(0 0 12px rgba(0, 255, 204, 0.6))' : 'none'
                  }}
                >
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${theme.id === 'modern' ? 'text-gray-900' : 'text-white'}`}>
                  Play vs Computer
                </h3>
                <p className={`text-sm opacity-100 ${theme.id === 'modern' ? 'text-gray-700' : 'text-white'}`}>
                  Challenge our AI at Easy, Medium, or Hard difficulty
                </p>
                <div className="mt-4 flex items-center font-bold" style={{ color: theme.id === 'peacock' ? '#00ffcc' : theme.gameModes.ai.color }}>
                  <Play className="w-4 h-4 mr-1" />
                  Start Game
                </div>
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={() => startGame('local')}
                className="w-full h-full border rounded-xl p-4 sm:p-6 transition-all hover:scale-[1.02] hover:shadow-xl group text-left backdrop-blur-xl"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.id === 'peacock' ? 'rgba(255, 215, 0, 0.5)' : theme.boardLineColor + '20',
                  boxShadow: theme.id === 'peacock' ? '0 8px 32px 0 rgba(0, 0, 0, 0.5)' : 'none'
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg"
                  style={{
                    backgroundColor: theme.gameModes.local.color,
                    filter: theme.id === 'peacock' ? 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.6))' : 'none'
                  }}
                >
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${theme.id === 'modern' ? 'text-gray-900' : 'text-white'}`}>
                  Local Multiplayer
                </h3>
                <p className={`text-sm opacity-100 ${theme.id === 'modern' ? 'text-gray-700' : 'text-white'}`}>
                  Play with a friend on the same device
                </p>
                <div className="mt-4 flex items-center font-bold" style={{ color: theme.id === 'peacock' ? '#ffd700' : theme.gameModes.local.color }}>
                  <Zap className="w-4 h-4 mr-1" />
                  Play Local
                </div>
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => startGame('online')}
                className="w-full h-full border rounded-xl p-4 sm:p-6 transition-all hover:scale-[1.02] hover:shadow-xl group text-left backdrop-blur-xl"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.id === 'peacock' ? 'rgba(236, 72, 153, 0.4)' : theme.boardLineColor + '20',
                  boxShadow: theme.id === 'peacock' ? '0 8px 32px 0 rgba(0, 0, 0, 0.5)' : 'none'
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg"
                  style={{
                    backgroundColor: '#ec4899',
                    filter: theme.id === 'peacock' ? 'drop-shadow(0 0 12px rgba(236, 72, 153, 0.6))' : 'none'
                  }}
                >
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${theme.id === 'modern' ? 'text-gray-900' : 'text-white'}`}>
                  Online Multiplayer
                </h3>
                <p className={`text-sm opacity-100 ${theme.id === 'modern' ? 'text-gray-700' : 'text-white'}`}>
                  Play with friends or random opponents online
                </p>
                <div className="mt-4 flex items-center font-bold" style={{ color: '#ec4899' }}>
                  <Trophy className="w-4 h-4 mr-1" />
                  Play Online
                </div>
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 max-w-5xl mx-auto"
          >
            <div className="rounded-xl p-4 sm:p-6 border shadow-lg" style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '20' }}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.isDark ? '#ffffff' : '#1f2937' }}>
                <BookOpen className="w-5 h-5" style={{ color: theme.accentColor }} />
                Quick Rules
              </h3>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div className="rounded-lg p-4" style={{ backgroundColor: theme.gameModes.ai.bg }}>
                  <div className="font-bold mb-1" style={{ color: theme.gameModes.ai.color }}>1. Place</div>
                  <p className="opacity-80" style={{ color: theme.isDark ? '#e5e7eb' : '#4b5563' }}>
                    Take turns placing 9 pieces each on the board
                  </p>
                </div>
                <div className="rounded-lg p-4" style={{ backgroundColor: theme.gameModes.local.bg }}>
                  <div className="font-bold mb-1" style={{ color: theme.gameModes.local.color }}>2. Move</div>
                  <p className="opacity-80" style={{ color: theme.isDark ? '#e5e7eb' : '#4b5563' }}>
                    Slide pieces along lines to adjacent empty points
                  </p>
                </div>
                <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
                  <div className="font-bold mb-1" style={{ color: '#ec4899' }}>3. Mill</div>
                  <p className="opacity-80" style={{ color: theme.isDark ? '#e5e7eb' : '#4b5563' }}>
                    Get 3 in a row to remove an opponent&apos;s piece
                  </p>
                </div>
                <div className="rounded-lg p-4" style={{ backgroundColor: theme.accentColor + '15' }}>
                  <div className="font-bold mb-1" style={{ color: theme.accentColor }}>4. Win</div>
                  <p className="opacity-80" style={{ color: theme.isDark ? '#e5e7eb' : '#4b5563' }}>
                    Reduce opponent to 2 pieces or block all moves
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setScreen('rules')}
                variant="outline"
                className="mt-4 transition-all font-semibold"
                style={{
                  borderColor: theme.id === 'peacock' ? 'rgba(255, 215, 0, 0.4)' : theme.boardLineColor + '40',
                  color: theme.id === 'peacock' ? '#ffffff' : theme.textColor,
                  backgroundColor: theme.id === 'peacock' ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
                  fontWeight: 'bold',
                  boxShadow: theme.id === 'peacock' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                Read Full Rules
              </Button>
            </div>
          </motion.div>
        </main>

        <Dialog open={showDifficultyDialog} onOpenChange={setShowDifficultyDialog}>
          <DialogContent style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '20', color: theme.textColor }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" style={{ color: theme.accentColor }} />
                Select Difficulty
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as Difficulty)}
              >
                <SelectTrigger className="font-bold" style={{ backgroundColor: theme.appBackground, borderColor: theme.boardLineColor + '20', color: theme.textColor }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '20' }}>
                  <SelectItem value="easy" className="font-bold" style={{ color: theme.textColor }}>
                    Easy - Great for beginners
                  </SelectItem>
                  <SelectItem value="medium" className="font-bold" style={{ color: theme.textColor }}>
                    Medium - Balanced challenge
                  </SelectItem>
                  <SelectItem value="hard" className="font-bold" style={{ color: theme.textColor }}>
                    Hard - Expert level AI
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={startAIGame}
                className="w-full"
                style={{
                  backgroundColor: theme.accentColor,
                  color: theme.id === 'peacock' ? '#000000' : '#ffffff',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showOnlineDialog} onOpenChange={setShowOnlineDialog}>
          <DialogContent style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '20', color: theme.textColor }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: theme.titleColor }}>
                <Globe className="w-5 h-5" style={{ color: theme.accentColor }} />
                Online Multiplayer
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <Button
                onClick={handleRandomMatch}
                style={{
                  background: theme.isDark ? `linear-gradient(to right, ${theme.accentColor}, ${theme.mutedColor})` : theme.accentColor,
                  color: theme.isDark ? '#ffffff' : '#000000'
                }}
                className="w-full h-14 text-lg hover:opacity-90"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                Find Random Opponent
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" style={{ borderColor: theme.boardLineColor + '20' }} />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span style={{ backgroundColor: theme.cardBg, color: theme.textColor, opacity: 0.6 }} className="px-2">or play with friends</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: theme.headingColor }}>Create New Room</h4>
                <Button
                  onClick={generateRoomCode}
                  variant="outline"
                  style={{ borderColor: theme.boardLineColor + '20', color: theme.textColor }}
                  className="w-full hover:opacity-70"
                >
                  Generate Room Code
                </Button>
                {roomCode && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 rounded-lg px-4 py-2 font-mono text-lg text-center" style={{ backgroundColor: theme.cardBg, color: theme.textColor, border: `1px solid ${theme.boardLineColor}20` }}>
                      {roomCode}
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={copyRoomCode}
                      style={{ borderColor: theme.boardLineColor + '20', color: theme.textColor }}
                      className="hover:opacity-70"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" style={{ borderColor: theme.boardLineColor + '20' }} />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span style={{ backgroundColor: theme.cardBg, color: theme.textColor, opacity: 0.6 }} className="px-2">or</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: theme.headingColor }}>Join Existing Room</h4>
                <Input
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '20', color: theme.textColor }}
                  className="placeholder:opacity-60"
                />
              </div>

              <Button
                onClick={() => {
                  // Save session before entering game
                  if (typeof window !== 'undefined') {
                    localStorage.setItem(ACTIVE_ROOM_KEY, roomCode);
                    localStorage.setItem(GAME_MODE_KEY, 'online');
                  }
                  setGameMode('online');
                  setShowOnlineDialog(false);
                  setScreen('game');
                }}
                disabled={!roomCode}
                className="w-full bg-[#e5a02b] hover:bg-[#c98f26]"
              >
                <Play className="w-4 h-4 mr-2" />
                {roomCode ? 'Join Room' : 'Enter Room Code'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <ProfileDialog
          open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
          profile={profile}
          onUpdate={updateProfile}
        />
      </div>
    </div>
  );
}
