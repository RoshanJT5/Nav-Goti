"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

type Screen = 'home' | 'game' | 'rules' | 'matchmaking';

export default function Home() {
  const { profile, loading: profileLoading, updateProfile } = useGuestProfile();
  const [screen, setScreen] = useState<Screen>('home');
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [showOnlineDialog, setShowOnlineDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);

  const theme = getTheme(profile?.theme_id);

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

  const handleMatchFound = (matchedRoomId: string) => {
    setRoomCode(matchedRoomId);
    setGameMode('online');
    setScreen('game');
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#312e2b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#629924] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium">Initializing Mill Game...</p>
        </div>
      </div>
    );
  }

  if (screen === 'matchmaking') {
    return (
      <MatchmakingView
        onMatch={handleMatchFound}
        onCancel={() => setScreen('home')}
        profile={profile}
      />
    );
  }

  if (screen === 'game') {
    if (gameMode === 'online') {
      return (
        <OnlineGameView
          roomId={roomCode}
          onBack={() => setScreen('home')}
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
      <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: theme.appBackground }}>
          <header className="px-4 py-3 border-b" style={{ backgroundColor: theme.headerBg, borderColor: theme.boardLineColor + '20' }}>
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={() => setScreen('home')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <span className="text-2xl font-bold" style={{ color: theme.titleColor }}>Mill</span>
              </button>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-8 shadow-xl"
              style={{ backgroundColor: theme.cardBg }}
            >
              <h1 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ color: theme.titleColor }}>
                <BookOpen className="w-8 h-8" style={{ color: theme.accentColor }} />
                Nine Men&apos;s Morris Rules
              </h1>
  
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2" style={{ color: theme.headingColor }}>
                    <Target className="w-5 h-5" style={{ color: theme.accentColor }} />
                    Objective
                  </h2>
                  <p className="text-gray-500">
                    Reduce your opponent to two pieces OR block all their pieces
                    so they cannot move.
                  </p>
                </section>
  
                <section>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2" style={{ color: theme.headingColor }}>
                    <Zap className="w-5 h-5" style={{ color: theme.accentColor }} />
                    Game Phases
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-black/10 rounded-lg p-4">
                      <h3 className="font-semibold mb-2" style={{ color: theme.headingColor }}>
                        Phase 1: Placing
                      </h3>
                      <p className="text-gray-500">
                        Players take turns placing their 9 pieces on any empty
                        intersection on the board.
                      </p>
                    </div>
                    <div className="bg-black/10 rounded-lg p-4">
                      <h3 className="font-semibold mb-2" style={{ color: theme.headingColor }}>
                        Phase 2: Moving
                      </h3>
                      <p className="text-gray-500">
                        After all pieces are placed, players move one piece per
                        turn to an adjacent empty point along the lines.
                      </p>
                    </div>
                  </div>
                </section>
  
                <section>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2" style={{ color: theme.headingColor }}>
                    <Sparkles className="w-5 h-5" style={{ color: theme.accentColor }} />
                    Forming Mills
                  </h2>
                  <p className="mb-3 text-gray-500">
                    A <strong style={{ color: theme.textColor }}>mill</strong> is three pieces
                    in a row along a line. When you form a mill, you remove one of
                    your opponent&apos;s pieces from the board.
                  </p>

                <ul className="list-disc list-inside space-y-1 text-gray-500 opacity-80">
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
              className="mt-8 bg-[#629924] hover:bg-[#4d7a1c]"
            >
              Back to Home
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: theme.appBackground }}>
        <header className="px-4 py-3 border-b" style={{ backgroundColor: theme.headerBg, borderColor: theme.boardLineColor + '20' }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: theme.accentColor }}>
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="text-2xl font-bold text-white">Mill Game</span>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6 mr-4">
                <button
                  onClick={() => startGame('ai')}
                  className="hover:opacity-80 transition-opacity text-sm font-medium"
                  style={{ color: theme.textColor + 'cc' }}
                >
                  Play
                </button>
                <button
                  onClick={() => setScreen('rules')}
                  className="hover:opacity-80 transition-opacity text-sm font-medium"
                  style={{ color: theme.textColor + 'cc' }}
                >
                  Learn
                </button>
              </nav>
  
              <Button
                onClick={() => setShowProfileDialog(true)}
                variant="ghost"
                className="flex items-center gap-2 border transition-all"
                  style={{ 
                    backgroundColor: theme.cardBg, 
                    borderColor: theme.boardLineColor + '20',
                    color: '#ffffff'
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
  
        <main className="max-w-6xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
              <h1 className="text-5xl md:text-6xl font-bold mb-4" style={{ color: theme.id === 'classic' ? '#629924' : theme.titleColor }}>
                Nine Men&apos;s Morris
              </h1>
              <p className="text-xl max-w-2xl mx-auto opacity-80" style={{ color: theme.isDark ? '#e5e7eb' : '#4b5563' }}>
                The classic strategy board game. Form mills, capture pieces, and
                outsmart your opponent.
              </p>
          </motion.div>
  
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <button
                onClick={() => startGame('ai')}
                className="w-full h-full border rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-xl group text-left"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '20' }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg" style={{ backgroundColor: theme.gameModes.ai.color }}>
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: theme.isDark ? '#ffffff' : '#1f2937' }}>
                  Play vs Computer
                </h3>
                <p className="text-sm opacity-60" style={{ color: theme.isDark ? '#e5e7eb' : '#4b5563' }}>
                  Challenge our AI at Easy, Medium, or Hard difficulty
                </p>
                <div className="mt-4 flex items-center font-bold" style={{ color: theme.gameModes.ai.color }}>
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
                className="w-full h-full border rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-xl group text-left"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '20' }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg" style={{ backgroundColor: theme.gameModes.local.color }}>
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: theme.isDark ? '#ffffff' : '#1f2937' }}>
                  Local Multiplayer
                </h3>
                <p className="text-sm opacity-60" style={{ color: theme.isDark ? '#e5e7eb' : '#4b5563' }}>
                  Play with a friend on the same device
                </p>
                <div className="mt-4 flex items-center font-bold" style={{ color: theme.gameModes.local.color }}>
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
                className="w-full h-full border rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-xl group text-left"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '20' }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg" style={{ backgroundColor: theme.gameModes.online.color }}>
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: theme.isDark ? '#ffffff' : '#1f2937' }}>
                  Online Multiplayer
                </h3>
                <p className="text-sm opacity-60" style={{ color: theme.isDark ? '#e5e7eb' : '#4b5563' }}>
                  Play with friends or random opponents online
                </p>
                <div className="mt-4 flex items-center font-bold" style={{ color: theme.gameModes.online.color }}>
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
            className="mt-12 max-w-4xl mx-auto"
          >
            <div className="rounded-xl p-6 border shadow-lg" style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '20' }}>
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
                <div className="rounded-lg p-4" style={{ backgroundColor: theme.gameModes.online.bg }}>
                  <div className="font-bold mb-1" style={{ color: theme.gameModes.online.color }}>3. Mill</div>
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
                  borderColor: theme.boardLineColor + '40',
                  color: theme.isDark ? '#ffffff' : theme.textColor,
                  backgroundColor: 'transparent'
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
                  <SelectTrigger className="font-bold text-white" style={{ backgroundColor: theme.appBackground, borderColor: theme.boardLineColor + '20' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '20' }}>
                    <SelectItem value="easy" className="font-bold text-white">
                      Easy - Great for beginners
                    </SelectItem>
                    <SelectItem value="medium" className="font-bold text-white">
                      Medium - Balanced challenge
                    </SelectItem>
                    <SelectItem value="hard" className="font-bold text-white">
                      Hard - Expert level AI
                    </SelectItem>
                  </SelectContent>
              </Select>

            <Button
              onClick={startAIGame}
              className="w-full text-white"
              style={{ backgroundColor: theme.accentColor }}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOnlineDialog} onOpenChange={setShowOnlineDialog}>
        <DialogContent className="bg-[#262421] border-[#3d3a37] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#e5a02b]" />
              Online Multiplayer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <Button
              onClick={handleRandomMatch}
              className="w-full bg-gradient-to-r from-[#629924] to-[#81b64c] hover:from-[#4d7a1c] hover:to-[#6d9a3f] h-14 text-lg"
            >
              <Shuffle className="w-5 h-5 mr-2" />
              Find Random Opponent
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#3d3a37]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#262421] px-2 text-gray-500">or play with friends</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Create New Room</h4>
              <Button
                onClick={generateRoomCode}
                variant="outline"
                className="w-full border-[#3d3a37] text-gray-300 hover:bg-[#3d3a37]"
              >
                Generate Room Code
              </Button>
              {roomCode && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 bg-[#3d3a37] rounded-lg px-4 py-2 font-mono text-lg text-center">
                    {roomCode}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyRoomCode}
                    className="border-[#3d3a37] hover:bg-[#3d3a37]"
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
                <span className="w-full border-t border-[#3d3a37]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#262421] px-2 text-gray-500">or</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Join Existing Room</h4>
              <Input
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="bg-[#3d3a37] border-[#4d4a47] text-white placeholder:text-gray-500"
              />
            </div>

            <Button
              onClick={() => {
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
  );
}
