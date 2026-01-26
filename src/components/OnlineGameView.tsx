"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
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
  Player,
} from "@/lib/morris-game";
import { supabase, GameStateJSON } from "@/lib/supabase";
import { Profile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Home,
  Trophy,
  Copy,
  Check,
  Loader2,
  Users,
} from "lucide-react";

import { getTheme } from "@/lib/themes";
import { GameChat } from "@/components/GameChat";

interface OnlineGameViewProps {
  roomId: string;
  onBack: () => void;
  profile: Profile | null;
}

function gameStateToJSON(state: GameState): GameStateJSON {
  return {
    board: state.board,
    currentPlayer: state.currentPlayer,
    phase: state.phase,
    whitePiecesPlaced: state.whitePiecesPlaced,
    blackPiecesPlaced: state.blackPiecesPlaced,
    whitePiecesOnBoard: state.whitePiecesOnBoard,
    blackPiecesOnBoard: state.blackPiecesOnBoard,
    selectedPiece: state.selectedPiece,
    mustRemove: state.mustRemove,
    winner: state.winner,
    moveHistory: state.moveHistory,
  };
}

function jsonToGameState(json: GameStateJSON): GameState {
  return {
    board: json.board as (Player | null)[],
    currentPlayer: json.currentPlayer,
    phase: json.phase as GameState['phase'],
    whitePiecesPlaced: json.whitePiecesPlaced,
    blackPiecesPlaced: json.blackPiecesPlaced,
    whitePiecesOnBoard: json.whitePiecesOnBoard,
    blackPiecesOnBoard: json.blackPiecesOnBoard,
    selectedPiece: json.selectedPiece,
    mustRemove: json.mustRemove,
    winner: json.winner as Player | null,
    moveHistory: json.moveHistory,
  };
}

export function OnlineGameView({ roomId, onBack, profile }: OnlineGameViewProps) {
  const theme = getTheme(profile?.theme_id);
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const playerId = profile?.id || "anonymous";
  const playerName = profile?.name || "Guest";
  const [roomStatus, setRoomStatus] = useState<'loading' | 'waiting' | 'playing' | 'finished' | 'error'>('loading');
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [whiteName, setWhiteName] = useState('Waiting...');
  const [blackName, setBlackName] = useState('Waiting...');
  const [copied, setCopied] = useState(false);
  const statsUpdated = useRef(false);
  const lastUpdateTimestamp = useRef<number>(0);

  useEffect(() => {
    const initRoom = async () => {
      const { data: existingRoom, error: fetchError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching room:', fetchError);
        setRoomStatus('error');
        return;
      }

      if (existingRoom) {
        const room = existingRoom as any;

        if (room.white_player_id === null) {
          await supabase
            .from('game_rooms')
            .update({
              white_player_id: playerId,
              white_player_name: playerName
            })
            .eq('id', roomId);
          setPlayerColor('white');
        } else if (room.black_player_id === null && room.white_player_id !== playerId) {
          await supabase
            .from('game_rooms')
            .update({
              black_player_id: playerId,
              black_player_name: playerName,
              status: 'playing'
            })
            .eq('id', roomId);
          setPlayerColor('black');
          setOpponentConnected(true);
        } else if (room.white_player_id === playerId) {
          setPlayerColor('white');
          if (room.white_player_name !== playerName) {
            await supabase.from('game_rooms').update({ white_player_name: playerName }).eq('id', roomId);
          }
        } else if (room.black_player_id === playerId) {
          setPlayerColor('black');
          if (room.black_player_name !== playerName) {
            await supabase.from('game_rooms').update({ black_player_name: playerName }).eq('id', roomId);
          }
        } else {
          setRoomStatus('error');
          return;
        }

        const updatedRoom = (await supabase.from('game_rooms').select('*').eq('id', roomId).single()).data;
        if (updatedRoom) {
          setGameState(jsonToGameState(updatedRoom.game_state));
          setRoomStatus(updatedRoom.status);
          setOpponentConnected(updatedRoom.black_player_id !== null);
          setWhiteName(updatedRoom.white_player_name || 'Guest');
          setBlackName(updatedRoom.black_player_name || 'Guest');
        }
      } else {
        const initialState = createInitialState();
        const { error: createError } = await supabase
          .from('game_rooms')
          .insert({
            id: roomId,
            white_player_id: playerId,
            white_player_name: playerName,
            game_state: gameStateToJSON(initialState),
            status: 'waiting'
          });

        if (createError) {
          console.error('Error creating room:', createError);
          setRoomStatus('error');
          return;
        }

        setPlayerColor('white');
        setWhiteName(playerName);
        setRoomStatus('waiting');
      }
    };

    initRoom();
  }, [roomId, playerId, playerName]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;

    const setupSubscription = async () => {
      // Subscribe to game room changes with improved real-time handling
      channel = supabase
        .channel(`room:${roomId}`, {
          config: {
            broadcast: { self: true }, // Receive our own updates for confirmation
            presence: { key: playerId },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_rooms',
            filter: `id=eq.${roomId}`
          },
          (payload) => {
            const room = payload.new as any;
            const updateTime = new Date(room.updated_at).getTime();

            // Always update state to stay in sync with server
            // This ensures both players see the same game state
            console.log('Receiving game state update:', updateTime);
            lastUpdateTimestamp.current = updateTime;
            setGameState(jsonToGameState(room.game_state));
            setRoomStatus(room.status);
            setOpponentConnected(room.black_player_id !== null && room.white_player_id !== null);
            setWhiteName(room.white_player_name || 'Guest');
            setBlackName(room.black_player_name || 'Guest');
          }
        )
        .on(
          'presence',
          { event: 'sync' },
          () => {
            const state = channel?.presenceState() || {};
            const presenceCount = Object.keys(state).length;
            console.log('Presence sync:', presenceCount, 'users connected');
            if (presenceCount >= 2) {
              setOpponentConnected(true);
            }
          }
        )
        .on(
          'presence',
          { event: 'leave' },
          (payload) => {
            console.log('User left:', payload.key);
          }
        )
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Game room channel subscribed successfully');
            // Send presence update to let opponent know we're connected
            await channel?.track({
              user_id: playerId,
              user_name: playerName,
              status: 'connected'
            });
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            console.error('Game room channel error/closed:', status);
            // Attempt to reconnect after delay
            setTimeout(() => {
              console.log('Attempting to reconnect to game room');
              if (channel) {
                supabase.removeChannel(channel);
              }
              setupSubscription();
            }, 3000);
          }
        });

      // Polling fallback: Check for opponent every 2 seconds while waiting
      pollingInterval = setInterval(async () => {
        const { data: room } = await supabase
          .from('game_rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (room) {
          const bothConnected = room.black_player_id !== null && room.white_player_id !== null;
          if (bothConnected) {
            console.log('Polling: Both players connected!');
            setOpponentConnected(true);
            setRoomStatus(room.status);
            setGameState(jsonToGameState(room.game_state));
            setWhiteName(room.white_player_name || 'Guest');
            setBlackName(room.black_player_name || 'Guest');
          }
        }
      }, 2000);
    };

    setupSubscription();

    return () => {
      console.log('Unsubscribing from game room channel');
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [roomId, playerId, playerName]);

  useEffect(() => {
    if (gameState.phase === 'gameOver' && !statsUpdated.current && profile) {
      const updateStats = async () => {
        statsUpdated.current = true;
        const isWinner = gameState.winner === playerColor;
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
  }, [gameState.phase, gameState.winner, playerColor, profile]);

  const updateGameState = async (newState: GameState) => {
    // Don't use a blocking flag - let updates queue naturally
    const updateTime = Date.now();
    lastUpdateTimestamp.current = updateTime;

    try {
      // Update immediately with retry logic
      let retryCount = 0;
      const maxRetries = 3;

      const attemptUpdate = async (): Promise<boolean> => {
        try {
          const { error } = await supabase
            .from('game_rooms')
            .update({
              game_state: gameStateToJSON(newState),
              status: newState.phase === 'gameOver' ? 'finished' : 'playing',
              updated_at: new Date(updateTime).toISOString()
            })
            .eq('id', roomId);

          if (error) {
            console.error('Error updating game state:', error);
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying update (${retryCount}/${maxRetries})...`);
              // Wait before retry with exponential backoff
              await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
              return attemptUpdate();
            }

            // After max retries, try to recover the state
            const { data: currentRoom } = await supabase
              .from('game_rooms')
              .select('*')
              .eq('id', roomId)
              .single();

            if (currentRoom) {
              console.log('Recovering game state from server');
              setGameState(jsonToGameState(currentRoom.game_state));
            }
            return false;
          }

          console.log('Game state updated successfully');
          return true;
        } catch (err) {
          console.error('Exception updating game state:', err);
          if (retryCount < maxRetries) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
            return attemptUpdate();
          }
          return false;
        }
      };

      await attemptUpdate();
    } catch (err) {
      console.error('Unexpected error in updateGameState:', err);
    }
  };

  const isPlayerTurn = playerColor === gameState.currentPlayer;

  const handlePositionClick = useCallback(async (position: Position) => {
    if (!isPlayerTurn || gameState.phase === 'gameOver' || !opponentConnected) return;

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
        // Local UI update only - don't sync to server
        setGameState(newState);
        return;
      } else {
        if (position === gameState.selectedPiece) {
          // Deselect - local UI update only
          setGameState({ ...gameState, selectedPiece: null });
          return;
        }

        if (gameState.board[position] === gameState.currentPlayer) {
          const validMoves = getValidMoves(gameState, position);
          if (validMoves.length > 0) {
            // Select different piece - local UI update only
            setGameState({ ...gameState, selectedPiece: position });
            return;
          }
        }

        newState = movePiece(gameState, gameState.selectedPiece, position);
        if (newState === gameState) return;
      }
    }

    // Optimistic update: Update local state immediately for responsive UI
    setGameState(newState);

    // Then sync to server (realtime subscription will confirm for both players)
    await updateGameState(newState);
  }, [gameState, isPlayerTurn, opponentConnected, roomId]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusMessage = () => {
    if (roomStatus === 'loading') return 'Connecting...';
    if (roomStatus === 'error') return 'Failed to connect to room';
    if (roomStatus === 'waiting') return 'Waiting for opponent...';
    if (gameState.phase === 'gameOver') {
      const winner = gameState.winner === playerColor ? 'You win!' : 'You lose!';
      return winner;
    }
    if (!isPlayerTurn) return "Opponent's turn...";
    if (gameState.mustRemove) return "Remove opponent's piece!";
    if (gameState.phase === 'placing') return 'Place a piece';
    if (gameState.selectedPiece !== null) return 'Move to highlighted position';
    return 'Select a piece to move';
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500" style={{ backgroundColor: theme.appBackground }}>
      <header className="border-b px-4 py-2" style={{ backgroundColor: theme.headerBg, borderColor: theme.lineColor + '20' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 hover:opacity-80 transition-colors"
            style={{ color: theme.textColor + '80' }}
          >
            <Home className="w-5 h-5" />
            <span className="font-semibold">Mill Game</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-60" style={{ color: theme.textColor }}>Room:</span>
              <code className="px-2 py-1 rounded text-sm font-mono" style={{ backgroundColor: theme.cardBg, color: theme.textColor }}>
                {roomId}
              </code>
              <Button
                size="icon"
                variant="ghost"
                onClick={copyRoomCode}
                className="h-8 w-8"
                style={{ color: theme.textColor + '60' }}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            {playerColor && (
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-60" style={{ color: theme.textColor }}>You:</span>
                <div
                  className="w-5 h-5 rounded-full border-2 shadow-sm flex items-center justify-center text-[8px]"
                  style={{
                    background: playerColor === 'white' ? theme.whitePiece.bg : theme.blackPiece.bg,
                    borderColor: playerColor === 'white' ? theme.whitePiece.border : theme.blackPiece.border,
                    color: playerColor === 'white' ? theme.whitePiece.color : theme.blackPiece.color
                  }}
                >
                  {playerColor === 'white' ? theme.whitePiece.content : theme.blackPiece.content}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 p-4 pt-8">
        <div className="flex flex-col items-center gap-6">
          {roomStatus === 'waiting' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl p-8 text-center max-w-md border-2"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.lineColor + '10' }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: theme.accentColor }}>
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.textColor }}>Waiting for Opponent</h2>
              <p className="opacity-60 mb-4" style={{ color: theme.textColor }}>Share this room code with a friend:</p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <code className="px-6 py-3 rounded-lg text-3xl font-mono shadow-inner" style={{ backgroundColor: theme.appBackground, color: theme.textColor }}>
                  {roomId}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyRoomCode}
                  className="h-12 w-12"
                  style={{ borderColor: theme.lineColor + '20' }}
                >
                  {copied ? <Check className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6" style={{ color: theme.textColor }} />}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-3 opacity-60" style={{ color: theme.textColor }}>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Waiting for player...</span>
              </div>
            </motion.div>
          ) : (
            <>
              <GameInfoPanel
                gameState={gameState}
                whiteName={whiteName}
                blackName={blackName}
                themeId={profile?.theme_id}
              />

              <MorrisBoard
                gameState={gameState}
                onPositionClick={handlePositionClick}
                disabled={!isPlayerTurn || !opponentConnected}
                flipped={playerColor === 'black'}
                themeId={profile?.theme_id}
              />
            </>
          )}
        </div>

        {roomStatus !== 'waiting' && (
          <div className="w-full max-w-sm lg:w-80">
            <div className="rounded-xl p-4 shadow-xl border" style={{ backgroundColor: theme.cardBg, borderColor: theme.lineColor + '20' }}>
              <h3 className="font-semibold mb-4" style={{ color: theme.textColor }}>Game Status</h3>
              <div
                className="p-4 rounded-xl text-center font-bold text-lg shadow-inner"
                style={{
                  backgroundColor: gameState.phase === 'gameOver'
                    ? theme.accentColor
                    : isPlayerTurn
                      ? theme.accentColor + '20'
                      : theme.lineColor + '10',
                  color: gameState.phase === 'gameOver' ? '#fff' : theme.textColor
                }}
              >
                {getStatusMessage()}
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="opacity-60 font-medium" style={{ color: theme.textColor }}>Phase</span>
                  <span className="font-bold capitalize" style={{ color: theme.textColor }}>{gameState.phase}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-60 font-medium" style={{ color: theme.textColor }}>Your Color</span>
                  <span className="font-bold capitalize" style={{ color: theme.textColor }}>{playerColor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-60 font-medium" style={{ color: theme.textColor }}>Opponent</span>
                  <span className="font-bold" style={{ color: opponentConnected ? theme.accentColor : '#e5a02b' }}>
                    {opponentConnected ? 'Connected' : 'Waiting...'}
                  </span>
                </div>
              </div>

              {gameState.phase === 'gameOver' && (
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={onBack}
                    className="w-full h-12"
                    style={{ borderColor: theme.lineColor + '20', color: theme.textColor }}
                  >
                    Back to Menu
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-xl p-4 mt-4 shadow-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.lineColor + '20' }}>
              <h3 className="font-semibold mb-4" style={{ color: theme.textColor }}>Players</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border shadow-sm flex items-center justify-center text-[10px]"
                    style={{ background: theme.whitePiece.bg, borderColor: theme.whitePiece.border, color: theme.whitePiece.color }}
                  >
                    {theme.whitePiece.content}
                  </div>
                  <span className="text-sm font-medium flex-1 truncate" style={{ color: theme.textColor }}>{whiteName}</span>
                  {playerColor === 'white' && (
                    <span className="text-[10px] text-white px-2 py-0.5 rounded-full font-bold shadow-sm" style={{ backgroundColor: theme.accentColor }}>You</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border shadow-sm flex items-center justify-center text-[10px]"
                    style={{ background: theme.blackPiece.bg, borderColor: theme.blackPiece.border, color: theme.blackPiece.color }}
                  >
                    {theme.blackPiece.content}
                  </div>
                  <span className="text-sm font-medium flex-1 truncate" style={{ color: theme.textColor }}>{blackName}</span>
                  {playerColor === 'black' && (
                    <span className="text-[10px] text-white px-2 py-0.5 rounded-full font-bold shadow-sm" style={{ backgroundColor: theme.accentColor }}>You</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {roomStatus !== 'loading' && roomStatus !== 'error' && (
        <GameChat
          roomId={roomId}
          playerId={playerId}
          playerName={playerName}
          themeId={profile?.theme_id}
        />
      )}
    </div>
  );
}

