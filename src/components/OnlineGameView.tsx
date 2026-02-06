"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { MorrisBoard } from "@/components/MorrisBoard";
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
  TOTAL_PIECES,
} from "@/lib/morris-game";
import { supabase, GameStateJSON } from "@/lib/supabase";
import { Profile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import {
  Home,
  Copy,
  Check,
  Loader2,
  Users,
  RefreshCw,
  MessageSquare,
  Flag,
  Handshake,
  ChevronLeft,
  ChevronRight,
  History,
  Menu,
} from "lucide-react";

import { getTheme } from "@/lib/themes";
import { GameChat } from "@/components/GameChat";
import { GameOverOverlay } from "@/components/GameOverOverlay";
import { DrawOfferModal } from "@/components/DrawOfferModal";
import { playTurnStartSound, playWarningSound, playGameOverSound, playMoveSound, playDrawOfferSound } from "@/lib/sounds";

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

// Constants for heartbeat-based disconnect detection
const HEARTBEAT_INTERVAL = 5000;
const DISCONNECT_TIMEOUT = 30000;

export function OnlineGameView({ roomId, onBack, profile }: OnlineGameViewProps) {
  const theme = getTheme(profile?.theme_id);
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const playerId = profile?.id || "anonymous";
  const playerName = profile?.name || "Guest";
  const [roomStatus, setRoomStatus] = useState<'loading' | 'waiting' | 'playing' | 'finished' | 'error'>('loading');
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [whiteName, setWhiteName] = useState('Waiting...');
  const [blackName, setBlackName] = useState('Waiting...');
  const [copied, setCopied] = useState(false);
  const statsUpdated = useRef(false);
  const lastUpdateTimestamp = useRef<number>(0);
  const gameStartedRef = useRef(false);
  const forfeitHandled = useRef(false);

  // Custom states for Timer and Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // 45-second turn timer (resets each turn)
  const TURN_TIME_LIMIT = 45;
  const WARNING_TIME = 10;
  const [turnTimer, setTurnTimer] = useState(TURN_TIME_LIMIT);
  const lastCurrentPlayerRef = useRef<string | null>(null);

  const [whiteWantsPlayAgain, setWhiteWantsPlayAgain] = useState(false);
  const [blackWantsPlayAgain, setBlackWantsPlayAgain] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Draw offer system
  const [drawOfferedBy, setDrawOfferedBy] = useState<string | null>(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [drawOffererName, setDrawOffererName] = useState('Opponent');

  // Game over overlay
  const [showGameOverOverlay, setShowGameOverOverlay] = useState(false);
  const [endReason, setEndReason] = useState<string | null>(null);

  // Connection status for reconnection handling
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const RECONNECT_GRACE_PERIOD = 30000; // 30 seconds grace period before forfeit

  // History and Review states
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const displayState = isReviewMode && gameState.historyStates && currentHistoryIndex >= 0
    ? jsonToGameState(gameState.historyStates[currentHistoryIndex])
    : gameState;

  // Room cleanup function - calls the new mark_player_left RPC
  const handleLeaveRoom = useCallback(async () => {
    if (!roomId || !playerId) return;
    try {
      await supabase.rpc('mark_player_left', { room_uuid: roomId, leaving_player_id: playerId });
    } catch (err) {
      console.error('Failed to mark player as left:', err);
    }
  }, [roomId, playerId]);

  // beforeunload handler for browser/tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery on page close
      const payload = JSON.stringify({ room_uuid: roomId, leaving_player_id: playerId });
      navigator.sendBeacon?.(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/mark_player_left`,
        new Blob([payload], { type: 'application/json' })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [roomId, playerId]);

  useEffect(() => {
    const initRoom = async () => {
      const { data: existingRoom, error: fetchError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        setRoomStatus('error');
        return;
      }

      if (existingRoom) {
        const room = existingRoom as any;
        if (room.status === 'forfeited' || room.forfeit_winner) {
          setGameState(jsonToGameState(room.game_state));
          if (room.white_player_id === playerId) setPlayerColor('white');
          else if (room.black_player_id === playerId) setPlayerColor('black');
          setWhiteName(room.white_player_name || 'Guest');
          setBlackName(room.black_player_name || 'Guest');
          setRoomStatus('finished');
          setOpponentDisconnected(true);
          forfeitHandled.current = true;
          return;
        }

        const now = new Date();
        if (room.white_player_id === null) {
          await supabase.from('game_rooms').update({ white_player_id: playerId, white_player_name: playerName, white_last_active: now.toISOString() }).eq('id', roomId);
          setPlayerColor('white');
        } else if (room.black_player_id === null && room.white_player_id !== playerId) {
          await supabase.from('game_rooms').update({ black_player_id: playerId, black_player_name: playerName, black_last_active: now.toISOString(), status: 'playing' }).eq('id', roomId);
          setPlayerColor('black');
          setOpponentConnected(true);
        } else if (room.white_player_id === playerId) {
          setPlayerColor('white');
          await supabase.from('game_rooms').update({ white_player_name: playerName, white_last_active: now.toISOString() }).eq('id', roomId);
        } else if (room.black_player_id === playerId) {
          setPlayerColor('black');
          await supabase.from('game_rooms').update({ black_player_name: playerName, black_last_active: now.toISOString() }).eq('id', roomId);
        } else {
          setRoomStatus('error');
          return;
        }

        const updatedRoom = (await supabase.from('game_rooms').select('*').eq('id', roomId).single()).data;
        if (updatedRoom) {
          setGameState(jsonToGameState(updatedRoom.game_state));
          setRoomStatus(updatedRoom.status);
          setOpponentConnected(updatedRoom.black_player_id !== null && updatedRoom.white_player_id !== null);
          setWhiteName(updatedRoom.white_player_name || 'Guest');
          setBlackName(updatedRoom.black_player_name || 'Guest');
          if (updatedRoom.status === 'playing') gameStartedRef.current = true;

          // Sync turn timer for late join/refresh
          if (updatedRoom.turn_timer_start) {
            const start = new Date(updatedRoom.turn_timer_start).getTime();
            const elapsed = Math.floor((Date.now() - start) / 1000);
            setTurnTimer(Math.max(0, TURN_TIME_LIMIT - elapsed));
          }
        }
      } else {
        const initialState = createInitialState();
        await supabase.from('game_rooms').insert({ id: roomId, white_player_id: playerId, white_player_name: playerName, game_state: gameStateToJSON(initialState), status: 'waiting' });
        setPlayerColor('white');
        setWhiteName(playerName);
        setRoomStatus('waiting');
      }
    };
    initRoom();
  }, [roomId, playerId, playerName]);

  useEffect(() => {
    let channel: any = null;
    let pollingInterval: any = null;
    let isMounted = true;

    const setupSubscription = async () => {
      channel = supabase
        .channel(`room:${roomId}`, { config: { broadcast: { self: true }, presence: { key: playerId } } })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` }, (payload: any) => {
          const room = payload.new;
          const serverState = jsonToGameState(room.game_state);
          setGameState(currentState => {
            const serverMoveCount = serverState.moveHistory?.length || 0;
            const localMoveCount = currentState.moveHistory?.length || 0;
            if (serverMoveCount !== localMoveCount || serverState.phase !== currentState.phase || serverState.winner !== currentState.winner) {
              return serverState;
            }
            return currentState;
          });
          setRoomStatus(room.status);
          setOpponentConnected(room.black_player_id !== null && room.white_player_id !== null);
          setWhiteName(room.white_player_name || 'Guest');
          setBlackName(room.black_player_name || 'Guest');
          setWhiteWantsPlayAgain(room.white_wants_play_again || false);
          setBlackWantsPlayAgain(room.black_wants_play_again || false);

          if (room.status === 'playing' && !gameStartedRef.current) gameStartedRef.current = true;

          // Check for Play Again consensus
          if (room.white_wants_play_again && room.black_wants_play_again && room.status === 'playing' && serverState.phase === 'placing' && serverState.moveHistory?.length === 0) {
            // Success reset
            forfeitHandled.current = false;
            setTurnTimer(TURN_TIME_LIMIT);
            setEndReason(null);
            setShowGameOverOverlay(false);
          }

          // Handle draw offer detection
          if (room.draw_offered_by && room.draw_offered_by !== playerId) {
            setDrawOfferedBy(room.draw_offered_by);
            setDrawOffererName(room.draw_offered_by === room.white_player_id ? room.white_player_name : room.black_player_name || 'Opponent');
            setShowDrawModal(true);
            playDrawOfferSound();
          } else {
            setShowDrawModal(false);
            setDrawOfferedBy(null);
          }

          // Handle game end
          if ((room.status === 'finished' || room.status === 'forfeited') && room.end_reason) {
            setEndReason(room.end_reason);
            if (!showGameOverOverlay) {
              setShowGameOverOverlay(true);
              playGameOverSound();
            }
          }
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel?.presenceState() || {};
          if (Object.keys(state).length >= 2) {
            setOpponentConnected(true);
            setOpponentDisconnected(false);
          }
        })
        .on('presence', { event: 'leave' }, async (payload: any) => {
          // Opponent left - start grace period instead of immediate forfeit
          if (gameStartedRef.current && payload.key !== playerId && gameState.phase !== 'gameOver') {
            setConnectionStatus('reconnecting');
            setOpponentConnected(false);

            // Clear any existing timeout
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

            // Start 30-second grace period
            reconnectTimeoutRef.current = setTimeout(() => {
              // Only forfeit if still disconnected after grace period
              setOpponentDisconnected(true);
              setConnectionStatus('disconnected');
              setGameState(prev => ({ ...prev, phase: 'gameOver', winner: playerColor }));
              supabase.from('game_rooms').update({
                status: 'finished',
                game_state: gameStateToJSON({ ...gameState, phase: 'gameOver', winner: playerColor })
              }).eq('id', roomId);
            }, RECONNECT_GRACE_PERIOD);
          }

          // Security & Cleanup: Check if anyone is left
          const state = channel?.presenceState() || {};
          if (Object.keys(state).length === 0) {
            console.log("Room empty, cleaning up...");
            await supabase.rpc('delete_game_room_data', { room_uuid: roomId });
          }
        })
        .on('presence', { event: 'join' }, (payload: any) => {
          // Opponent reconnected - cancel forfeit timer
          if (payload.key !== playerId && reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
            setConnectionStatus('connected');
            setOpponentConnected(true);
            setOpponentDisconnected(false);
          }
        })
        .subscribe(async (status: any) => {
          if (status === 'SUBSCRIBED') await channel?.track({ user_id: playerId, user_name: playerName, status: 'connected' });
        });

      pollingInterval = setInterval(async () => {
        if (!isMounted) return;
        const { data: room } = await supabase.from('game_rooms').select('*').eq('id', roomId).single();
        if (room && isMounted) {
          const bothConnected = room.black_player_id !== null && room.white_player_id !== null;
          setOpponentConnected(bothConnected);
          setRoomStatus(room.status);
          setWhiteName(room.white_player_name || 'Guest');
          setBlackName(room.black_player_name || 'Guest');
        }
      }, 5000);
    };

    setupSubscription();
    return () => { isMounted = false; clearInterval(pollingInterval); if (channel) supabase.removeChannel(channel); };
  }, [roomId, playerId, playerName, playerColor, gameState]);

  // 45-Second Turn Timer Countdown
  useEffect(() => {
    if (roomStatus !== 'playing' || gameState.phase === 'gameOver' || !opponentConnected) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTurnTimer((prev: number) => {
        // Play warning sound at 10 seconds
        if (prev === WARNING_TIME + 1) {
          playWarningSound();
        }

        if (prev <= 1) {
          // Time's up - only the active player's client should handle timeout
          if (gameState.currentPlayer === playerColor) {
            handleTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [roomStatus, gameState.phase, gameState.currentPlayer, opponentConnected, playerColor]);

  // Reset timer when turn changes and play turn start sound
  useEffect(() => {
    if (lastCurrentPlayerRef.current !== null && lastCurrentPlayerRef.current !== gameState.currentPlayer) {
      setTurnTimer(TURN_TIME_LIMIT);
      if (gameState.currentPlayer === playerColor) {
        playTurnStartSound();
      }
    }
    lastCurrentPlayerRef.current = gameState.currentPlayer;
  }, [gameState.currentPlayer, playerColor]);

  // Consensus Play Again Trigger
  useEffect(() => {
    const checkConsensus = async () => {
      if (whiteWantsPlayAgain && blackWantsPlayAgain) {
        // Only one player (white) should perform the reset to avoid race conditions
        if (playerColor === 'white') {
          const newState = createInitialState();
          await supabase.from('game_rooms').update({
            game_state: gameStateToJSON(newState),
            status: 'playing',
            forfeit_winner: null,
            white_wants_play_again: false,
            black_wants_play_again: false,
            // Reset turn timer
            turn_timer_start: new Date().toISOString(),
            active_player: 'white',
            draw_offered_by: null,
            end_reason: null
          }).eq('id', roomId);
        }
      }
    };
    checkConsensus();
  }, [whiteWantsPlayAgain, blackWantsPlayAgain, playerColor, roomId]);

  // Timeout handler - called when 45-second timer reaches 0
  const handleTimeout = async () => {
    if (forfeitHandled.current || gameState.phase === 'gameOver') return;
    forfeitHandled.current = true;

    const winner = playerColor === 'white' ? 'black' : 'white';
    const forfeitState = { ...gameState, phase: 'gameOver' as const, winner: winner as Player };

    await supabase.from('game_rooms').update({
      status: 'finished',
      forfeit_winner: winner,
      end_reason: 'timeout',
      game_state: gameStateToJSON(forfeitState)
    }).eq('id', roomId);

    setGameState(forfeitState);
    setRoomStatus('finished');
    setEndReason('timeout');
    setShowGameOverOverlay(true);
    playGameOverSound();
  };

  // Resign handler - player voluntarily loses
  const handleResign = async () => {
    if (forfeitHandled.current || gameState.phase === 'gameOver') return;
    forfeitHandled.current = true;

    const winner = playerColor === 'white' ? 'black' : 'white';
    const forfeitState = { ...gameState, phase: 'gameOver' as const, winner: winner as Player };

    await supabase.from('game_rooms').update({
      status: 'finished',
      forfeit_winner: winner,
      end_reason: 'resign',
      game_state: gameStateToJSON(forfeitState)
    }).eq('id', roomId);

    setGameState(forfeitState);
    setRoomStatus('finished');
    setEndReason('resign');
    setShowGameOverOverlay(true);
    playGameOverSound();
  };

  // Draw offer handlers
  const handleOfferDraw = async () => {
    await supabase.from('game_rooms')
      .update({ draw_offered_by: playerId })
      .eq('id', roomId);
  };

  const handleAcceptDraw = async () => {
    const drawState = { ...gameState, phase: 'gameOver' as const, winner: null };
    await supabase.from('game_rooms')
      .update({
        status: 'finished',
        end_reason: 'draw',
        draw_offered_by: null,
        game_state: gameStateToJSON(drawState)
      })
      .eq('id', roomId);

    setGameState(drawState);
    setRoomStatus('finished');
    setEndReason('draw');
    setShowDrawModal(false);
    setShowGameOverOverlay(true);
    playGameOverSound();
  };

  const handleDeclineDraw = async () => {
    await supabase.from('game_rooms')
      .update({ draw_offered_by: null })
      .eq('id', roomId);
    setShowDrawModal(false);
  };

  // Legacy handler - kept for backward compatibility  
  const handleTimerForfeit = async (timedOutPlayer: 'white' | 'black') => {
    await handleTimeout();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const updateGameState = async (newState: GameState) => {
    // Sync turn timer and active player on server
    await supabase.from('game_rooms').update({
      game_state: gameStateToJSON(newState),
      status: newState.phase === 'gameOver' ? 'finished' : 'playing',
      active_player: newState.currentPlayer,
      turn_timer_start: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', roomId);

    // Play move sound if turn changed or piece was removed
    if (newState.currentPlayer !== gameState.currentPlayer || newState.mustRemove !== gameState.mustRemove) {
      playMoveSound();
    }
  };

  const isPlayerTurn = playerColor === gameState.currentPlayer;

  const handleBackHistory = () => {
    if (!gameState.historyStates || gameState.historyStates.length === 0) return;
    setIsReviewMode(true);
    setCurrentHistoryIndex(prev => {
      const newIndex = prev === -1 ? gameState.historyStates!.length - 2 : prev - 1;
      return Math.max(0, newIndex);
    });
  };

  const handleForwardHistory = () => {
    if (!gameState.historyStates || currentHistoryIndex === -1) return;
    setCurrentHistoryIndex(prev => {
      const newIndex = prev + 1;
      if (newIndex >= gameState.historyStates!.length - 1) {
        setIsReviewMode(false);
        return -1;
      }
      return newIndex;
    });
  };

  const handleAbort = async () => {
    if (gameState.phase === 'gameOver') return;
    if (confirm("Are you sure you want to abort the game? This will count as a loss.")) {
      const winner = playerColor === 'white' ? 'black' : 'white';
      const forfeitState = { ...gameState, phase: 'gameOver' as const, winner: winner as Player };
      await supabase.from('game_rooms').update({
        status: 'forfeited',
        forfeit_winner: winner,
        game_state: gameStateToJSON(forfeitState)
      }).eq('id', roomId);
      setGameState(forfeitState);
      setRoomStatus('finished');
    }
  };

  const handlePositionClick = useCallback(async (position: Position) => {
    if (isReviewMode) return; // Disable moves in review mode
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
        setGameState(newState);
        return;
      } else {
        if (position === gameState.selectedPiece) {
          setGameState({ ...gameState, selectedPiece: null });
          return;
        }
        if (gameState.board[position] === gameState.currentPlayer) {
          if (getValidMoves(gameState, position).length > 0) {
            setGameState({ ...gameState, selectedPiece: position });
            return;
          }
        }
        newState = movePiece(gameState, gameState.selectedPiece, position);
        if (newState === gameState) return;
      }
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
    setGameState(newState);
    await updateGameState(newState);
  }, [gameState, isPlayerTurn, opponentConnected, roomId]);

  const handlePlayAgain = useCallback(async () => {
    if (!playerColor) return;

    const updateField = playerColor === 'white' ? 'white_wants_play_again' : 'black_wants_play_again';

    await supabase.from('game_rooms')
      .update({ [updateField]: true })
      .eq('id', roomId);
  }, [roomId, playerColor]);

  const getStatusMessage = () => {
    if (roomStatus === 'loading') return 'Connecting...';
    if (roomStatus === 'waiting') return 'Waiting for opponent...';
    if (connectionStatus === 'reconnecting') return 'Opponent reconnecting...';
    if (gameState.phase === 'gameOver') {
      if (opponentDisconnected) return 'Opponent left - You win!';
      if (endReason === 'timeout') return 'Time out - ' + (gameState.winner === playerColor ? 'You win!' : 'You lose!');
      if (endReason === 'resign') return gameState.winner === playerColor ? 'Opponent resigned - You win!' : 'You resigned!';
      if (endReason === 'draw') return 'Game ended in a draw!';
      return gameState.winner === playerColor ? 'You win!' : 'You lose!';
    }
    if (!isPlayerTurn) return "Opponent's turn...";
    if (gameState.mustRemove) return "Remove opponent's piece!";
    return gameState.phase === 'placing' ? 'Place a piece' : 'Make a move';
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden transition-all duration-500 relative"
      style={{
        backgroundColor: theme.id === 'peacock' ? 'transparent' : (theme.appBackground?.includes('gradient') ? 'transparent' : theme.appBackground),
        backgroundImage: theme.appBackground?.includes('gradient') ? theme.appBackground : 'none',
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

      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col h-full">
        <header
          className="border-b px-4 py-2 shrink-0 sticky top-0 z-50 backdrop-blur-md"
          style={{
            backgroundColor: theme.headerBg,
            borderColor: theme.id === 'peacock' ? 'rgba(255, 215, 0, 0.3)' : theme.boardLineColor + '20'
          }}
        >
          <div className="flex items-center justify-between">
            <button onClick={() => { handleLeaveRoom(); onBack(); }} className="flex items-center gap-2 hover:opacity-80 transition-colors" style={{ color: theme.textColor }}>
              <Home className="w-5 h-5" />
              <span className="font-bold text-sm" style={{ color: theme.titleColor }}>Nav Goti</span>
            </button>
            <div className="flex items-center gap-2 text-xs">
              <code
                className="px-2 py-1 rounded font-mono border"
                style={{
                  backgroundColor: theme.appBackground,
                  borderColor: theme.id === 'peacock' ? 'rgba(255, 215, 0, 0.3)' : 'transparent',
                  color: theme.textColor
                }}
              >
                {roomId}
              </code>
              <Button size="icon" variant="ghost" onClick={copyRoomCode} className="h-7 w-7">
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" style={{ color: theme.textColor }} />}
              </Button>
            </div>
          </div>
        </header>

        {roomStatus === 'waiting' ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-xl p-5 sm:p-8 text-center max-w-md w-full border backdrop-blur-xl shadow-2xl"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.id === 'peacock' ? 'rgba(255, 215, 0, 0.5)' : theme.boardLineColor + '20',
                boxShadow: theme.id === 'peacock' ? '0 8px 32px 0 rgba(0, 0, 0, 0.6)' : 'none'
              }}
            >
              <div
                className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  backgroundColor: theme.accentColor,
                  filter: theme.id === 'peacock' ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))' : 'none'
                }}
              >
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.headingColor }}>Waiting for Opponent</h2>
              <p className="text-sm opacity-80 mb-6" style={{ color: theme.textColor }}>Share this code with a friend to start the game.</p>

              <div
                className="block p-5 text-3xl font-mono mb-6 rounded-lg border tracking-wider"
                style={{
                  backgroundColor: theme.appBackground,
                  borderColor: theme.boardLineColor + '10',
                  color: theme.textColor
                }}
              >
                {roomId}
              </div>

              <Button
                onClick={copyRoomCode}
                className="w-full mb-4 font-bold h-12 text-lg transition-transform hover:scale-105"
                style={{
                  backgroundColor: theme.id === 'peacock' ? '#ffd700' : theme.accentColor,
                  color: theme.id === 'peacock' ? '#000' : '#fff'
                }}
              >
                <Copy className="w-5 h-5 mr-3" />
                Copy Room Code
              </Button>

              <div className="flex items-center justify-center gap-3 opacity-60" style={{ color: theme.textColor }}>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Waiting for player to connect...</span>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row w-full h-full overflow-hidden items-center justify-center lg:items-stretch lg:justify-start">
            {/* Main Board Area */}
            <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden items-center">
              <div className="w-full px-4 py-3 flex items-center justify-between shrink-0 border-b z-10 transition-all duration-300"
                style={{
                  backgroundColor: gameState.currentPlayer !== playerColor ? 'rgba(0, 15, 20, 0.95)' : 'transparent',
                  borderBottom: `2px solid ${gameState.currentPlayer !== playerColor ? 'rgba(255, 255, 255, 0.2)' : 'transparent'}`,
                  opacity: gameState.currentPlayer !== playerColor ? 1.0 : 0.4,
                  boxShadow: gameState.currentPlayer !== playerColor ? '0 0 15px rgba(0, 0, 0, 0.5)' : 'none'
                }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm shrink-0 font-bold" style={{
                    background: playerColor === 'white' ? theme.blackPiece.bg : theme.whitePiece.bg,
                    borderColor: gameState.currentPlayer === (playerColor === 'white' ? 'black' : 'white') ? theme.accentColor : 'transparent',
                    color: playerColor === 'white' ? theme.blackPiece.color : theme.whitePiece.color
                  }}>
                    {playerColor === 'white' ? theme.blackPiece.content : theme.whitePiece.content}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold truncate" style={{ color: gameState.currentPlayer === (playerColor === 'white' ? 'black' : 'white') ? theme.accentColor : '#ffffff' }}>
                      {playerColor === 'white'
                        ? (theme.blackPlayerName || blackName)
                        : (theme.whitePlayerName || whiteName)}
                    </div>
                    <div className="text-xs opacity-70 truncate text-white">
                      {playerColor === 'white' ? `${TOTAL_PIECES - gameState.blackPiecesPlaced} left • ${gameState.blackPiecesOnBoard} total` : `${TOTAL_PIECES - gameState.whitePiecesPlaced} left • ${gameState.whitePiecesOnBoard} total`}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-md font-mono text-lg font-bold w-[70px] shrink-0 text-center tabular-nums ${turnTimer < 10 ? 'animate-pulse text-red-500' : ''}`} style={{ backgroundColor: theme.appBackground + '80', color: turnTimer < 10 ? '#ef4444' : theme.textColor }}>
                  {formatTime(turnTimer)}
                </div>
              </div>

              {/* Board Area */}
              <div className="w-full flex-1 flex flex-col items-center justify-center p-2 overflow-hidden relative">
                {/* Status Message - Responsive HUD (Pill on Mobile, Square on Web) */}
                <div className="hidden sm:flex sm:absolute sm:right-8 lg:right-24 sm:top-[45%] sm:-translate-y-1/2 z-50 sm:mt-0 mb-0">
                  <motion.div
                    className={`
                      flex items-center justify-center gap-2 font-bold transition-all duration-500 text-center box-border
                      /* Mobile: Compact Pill */
                      px-4 py-1.5 rounded-full shadow-lg border-2
                      /* Desktop: Square HUD */
                      sm:w-28 sm:h-28 lg:w-32 lg:h-32 sm:rounded-2xl sm:flex-col sm:backdrop-blur-md sm:px-2 sm:shadow-2xl sm:gap-1 lg:gap-2
                    `}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      backgroundColor: theme.id === 'peacock'
                        ? (gameState.currentPlayer === 'white' ? 'rgba(0, 255, 127, 0.15)' : 'rgba(0, 255, 255, 0.15)')
                        : theme.accentColor + 'dd',
                      borderColor: theme.id === 'peacock'
                        ? (gameState.currentPlayer === 'white' ? '#00FF7F' : '#00FFFF')
                        : theme.accentColor + '40',
                      color: theme.id === 'peacock'
                        ? (gameState.currentPlayer === 'white' ? '#00FF7F' : '#00FFFF')
                        : theme.textColor,
                      boxShadow: theme.id === 'peacock'
                        ? `0 0 30px ${gameState.currentPlayer === 'white' ? 'rgba(0, 255, 127, 0.3)' : 'rgba(0, 255, 255, 0.3)'}`
                        : '0 10px 25px -5px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    {/* Mobile View: Simple Text */}
                    <span className="text-xs sm:hidden">
                      {gameState.mustRemove
                        ? 'Remove piece!'
                        : (gameState.phase === 'placing' ? 'Place piece' : 'Move piece')
                      }
                    </span>

                    {/* Desktop View: Stacked Text Labels */}
                    <div className="hidden sm:flex flex-col items-center">
                      <span className="text-[9px] lg:text-[10px] leading-tight uppercase tracking-wider opacity-70">
                        {gameState.mustRemove
                          ? 'Action'
                          : (gameState.phase === 'placing' ? 'Place a' : 'Move a')
                        }
                      </span>
                      <span className="text-[10px] lg:text-xs font-black leading-tight uppercase">
                        {gameState.mustRemove
                          ? 'Remove Piece'
                          : 'Piece'
                        }
                      </span>
                      {!gameState.mustRemove && (
                        <span className="text-[9px] lg:text-[10px] mt-1 font-medium opacity-80">
                          {gameState.currentPlayer === 'white' ? whiteName : blackName}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </div>
                <div className="w-full max-w-[min(100vw-2rem,600px)] aspect-square flex items-center justify-center relative z-10">
                  <MorrisBoard
                    gameState={displayState}
                    onPositionClick={handlePositionClick}
                    disabled={!isPlayerTurn || !opponentConnected || isReviewMode}
                    flipped={playerColor === 'black'}
                    themeId={profile?.theme_id}
                  />
                </div>

                {/* Draw Offer Modal - Using new component */}
                <DrawOfferModal
                  isOpen={showDrawModal}
                  offeredByName={drawOffererName}
                  onAccept={handleAcceptDraw}
                  onDecline={handleDeclineDraw}
                />
              </div>

              {/* Bottom Player Bar */}
              <div className="w-full px-4 py-3 flex items-center justify-between shrink-0 border-t z-10 transition-all duration-300"
                style={{
                  backgroundColor: gameState.currentPlayer === playerColor ? 'rgba(0, 15, 20, 0.95)' : 'transparent',
                  borderTop: `2px solid ${gameState.currentPlayer === playerColor ? 'rgba(255, 255, 255, 0.2)' : 'transparent'}`,
                  opacity: gameState.currentPlayer === playerColor ? 1.0 : 0.4,
                  boxShadow: gameState.currentPlayer === playerColor ? '0 0 15px rgba(0, 0, 0, 0.5)' : 'none'
                }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm shrink-0 font-bold" style={{
                    background: playerColor === 'white' ? theme.whitePiece.bg : theme.blackPiece.bg,
                    borderColor: gameState.currentPlayer === playerColor ? theme.accentColor : 'transparent',
                    color: playerColor === 'white' ? theme.whitePiece.color : theme.blackPiece.color
                  }}>
                    {playerColor === 'white' ? theme.whitePiece.content : theme.blackPiece.content}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold truncate" style={{ color: gameState.currentPlayer === playerColor ? theme.accentColor : '#ffffff' }}>
                      {playerColor === 'white'
                        ? (theme.whitePlayerName || whiteName)
                        : (theme.blackPlayerName || blackName)} (You)
                    </div>
                    <div className="text-xs opacity-70 truncate text-white">
                      {playerColor === 'white' ? `${TOTAL_PIECES - gameState.whitePiecesPlaced} left • ${gameState.whitePiecesOnBoard} total` : `${TOTAL_PIECES - gameState.blackPiecesPlaced} left • ${gameState.blackPiecesOnBoard} total`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="sm:hidden font-bold text-xs animate-pulse text-right w-[110px] shrink-0" style={{ color: theme.accentColor }}>
                    {gameState.phase === 'gameOver'
                      ? (gameState.winner === playerColor ? 'You Win!' : 'You Lose')
                      : (!isPlayerTurn ? "Opponent's Turn" : (
                        gameState.mustRemove ? 'Remove Piece!' :
                          (gameState.phase === 'placing' ? 'Place Piece' : 'Move Piece')
                      ))
                    }
                  </div>
                  <div className={`px-3 py-1.5 rounded-md font-mono text-lg font-bold w-[70px] shrink-0 text-center tabular-nums ${turnTimer < 10 ? 'animate-pulse text-red-500' : ''}`} style={{ backgroundColor: theme.appBackground + '80', color: turnTimer < 10 ? '#ef4444' : theme.textColor }}>
                    {formatTime(turnTimer)}
                  </div>
                </div>
              </div>

              {/* Nav Icons (Mobile Only) */}
              <div className="w-full lg:hidden px-4 py-3 flex items-center justify-around shrink-0 border-t z-10 font-bold" style={{ backgroundColor: theme.headerBg, borderColor: theme.boardLineColor + '20' }}>
                {gameState.phase === 'gameOver' || roomStatus === 'finished' ? (
                  <>
                    {!opponentDisconnected && <Button onClick={handlePlayAgain} variant="ghost" className="flex flex-col h-auto py-2" style={{ color: theme.textColor }}><RefreshCw className="w-5 h-5 mb-1" /><span className="text-[10px]">Retry</span></Button>}
                    <Button variant="ghost" onClick={() => { handleLeaveRoom(); onBack(); }} className="flex flex-col h-auto py-2" style={{ color: theme.textColor }}><Home className="w-5 h-5 mb-1" /><span className="text-[10px]">Menu</span></Button>
                    <Button
                      variant="ghost"
                      onClick={handleBackHistory}
                      disabled={!gameState.historyStates || gameState.historyStates.length <= 1 || currentHistoryIndex === 0}
                      className="flex flex-col h-auto py-2"
                      style={{ color: theme.textColor }}
                    >
                      <ChevronLeft className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold">Back</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleForwardHistory}
                      disabled={!isReviewMode}
                      className="flex flex-col h-auto py-2"
                      style={{ color: theme.textColor }}
                    >
                      <ChevronRight className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold">Forward</span>
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col w-full gap-2">
                    {/* History Scrubber */}
                    {(gameState.historyStates?.length || 0) > 1 && (
                      <div className="px-4 flex items-center gap-3">
                        <span className="text-[10px] font-bold min-w-[40px]" style={{ color: theme.textColor }}>
                          {currentHistoryIndex === -1 ? gameState.historyStates!.length : currentHistoryIndex + 1} / {gameState.historyStates!.length}
                        </span>
                        <input
                          type="range"
                          min="0"
                          max={(gameState.historyStates?.length || 1) - 1}
                          value={currentHistoryIndex === -1 ? (gameState.historyStates?.length || 1) - 1 : currentHistoryIndex}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val === (gameState.historyStates?.length || 1) - 1) {
                              setIsReviewMode(false);
                              setCurrentHistoryIndex(-1);
                            } else {
                              setIsReviewMode(true);
                              setCurrentHistoryIndex(val);
                            }
                          }}
                          className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        {isReviewMode && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setIsReviewMode(false); setCurrentHistoryIndex(-1); }}
                            className="h-6 px-2 text-[8px] uppercase tracking-wider font-black bg-blue-500/20 text-blue-400"
                          >
                            Live
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-around w-full">
                      {/* Options Menu Button (Hamburger) */}
                      <Button
                        variant="ghost"
                        onClick={() => setIsMenuOpen(true)}
                        className="flex flex-col h-auto py-2 px-4"
                        style={{ color: theme.textColor }}
                      >
                        <Menu className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold">Menu</span>
                      </Button>

                      {/* Chat Button */}
                      <Button variant="ghost" onClick={() => setIsChatOpen(true)} className="flex flex-col h-auto py-2 px-4 relative" style={{ color: theme.textColor }}>
                        <MessageSquare className="w-5 h-5 mb-1" />
                        {unreadMessages > 0 && !isChatOpen && <span className="absolute top-1 right-3 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{unreadMessages}</span>}
                        <span className="text-[10px] font-bold">Chat</span>
                      </Button>

                      {/* Back Button */}
                      <Button
                        variant="ghost"
                        onClick={handleBackHistory}
                        disabled={!gameState.historyStates || gameState.historyStates.length <= 1 || currentHistoryIndex === 0}
                        className={`flex flex-col h-auto py-2 px-4 ${(gameState.historyStates?.length || 0) <= 1 ? 'opacity-30' : ''}`}
                        style={{ color: theme.textColor }}
                      >
                        <ChevronLeft className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold">Back</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Options Menu Overlay */}
              {isMenuOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
                  <div
                    className="w-full sm:w-80 p-6 rounded-t-2xl sm:rounded-2xl border shadow-2xl space-y-4 animate-in slide-in-from-bottom-10 fade-in"
                    style={{ backgroundColor: theme.cardBg, borderColor: theme.lineColor + '20' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold" style={{ color: theme.textColor }}>Game Options</h3>
                      <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(false)}>✕</Button>
                    </div>

                    <Button
                      onClick={() => { handleOfferDraw(); setIsMenuOpen(false); }}
                      variant="outline"
                      className="w-full justify-start h-12 text-base font-medium"
                      style={{ borderColor: theme.lineColor + '40' }}
                    >
                      <Handshake className="mr-3 w-5 h-5" /> Offer Draw
                    </Button>

                    <Button
                      onClick={() => { handleResign(); setIsMenuOpen(false); }}
                      variant="outline"
                      className="w-full justify-start h-12 text-base font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      style={{ borderColor: theme.lineColor + '40' }}
                    >
                      <Flag className="mr-3 w-5 h-5" /> Resign
                    </Button>
                  </div>
                </div>
              )}


              {/* Chat Drawer (Mobile Only) */}
              {roomStatus !== 'loading' && roomStatus !== 'error' && (
                <div className="lg:hidden">
                  <GameChat
                    roomId={roomId}
                    playerId={playerId}
                    playerName={playerName}
                    themeId={profile?.theme_id}
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    onUnreadChange={setUnreadMessages}
                    variant="drawer"
                  />
                </div>
              )}
            </div>

            {/* Desktop Sidebar (Rendered conditionally for clean DOM on mobile) */}
            <div className="hidden lg:flex w-96 flex-col border-l z-20 shrink-0" style={{ backgroundColor: theme.cardBg, borderColor: theme.boardLineColor + '20' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: theme.headerBg, borderColor: theme.lineColor + '20' }}>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" style={{ color: theme.accentColor }} />
                  <span className="font-bold" style={{ color: theme.textColor }}>Game Room</span>
                </div>
                <Button size="sm" variant="outline" onClick={copyRoomCode} className="h-8 text-xs gap-2">
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />} {roomId}
                </Button>
              </div>

              {/* Desktop Controls & History */}
              <div className="p-4 border-b space-y-4 shrink-0" style={{ borderColor: theme.lineColor + '10' }}>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleOfferDraw}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    style={{ borderColor: theme.lineColor + '40', color: theme.textColor }}
                    disabled={gameState.phase === 'gameOver'}
                  >
                    <Handshake className="mr-2 w-3 h-3" /> Offer Draw
                  </Button>
                  <Button
                    onClick={handleResign}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    style={{ borderColor: theme.lineColor + '40' }}
                    disabled={gameState.phase === 'gameOver'}
                  >
                    <Flag className="mr-2 w-3 h-3" /> Resign
                  </Button>
                </div>

                {/* Play Again (Desktop) */}
                {(gameState.phase === 'gameOver' || roomStatus === 'finished') && !opponentDisconnected && (
                  <Button
                    onClick={handlePlayAgain}
                    className="w-full font-bold transition-all"
                    style={{ backgroundColor: theme.accentColor, color: '#fff' }}
                    disabled={(playerColor === 'white' ? whiteWantsPlayAgain : blackWantsPlayAgain)}
                  >
                    <RefreshCw className={`mr-2 w-4 h-4 ${(playerColor === 'white' ? whiteWantsPlayAgain : blackWantsPlayAgain) ? 'animate-spin' : ''}`} />
                    {(playerColor === 'white' ? whiteWantsPlayAgain : blackWantsPlayAgain) ? 'Waiting for Opponent...' : 'Play Again'}
                  </Button>
                )}

                {/* Desktop History Controls */}
                {(gameState.historyStates?.length || 0) > 1 && (
                  <div className="bg-black/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold mb-1" style={{ color: theme.textColor }}>
                      <span>Move History</span>
                      <span>{currentHistoryIndex === -1 ? gameState.historyStates!.length : currentHistoryIndex + 1} / {gameState.historyStates!.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleBackHistory}
                        disabled={!gameState.historyStates || gameState.historyStates.length <= 1 || currentHistoryIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      <input
                        type="range"
                        min="0"
                        max={(gameState.historyStates?.length || 1) - 1}
                        value={currentHistoryIndex === -1 ? (gameState.historyStates?.length || 1) - 1 : currentHistoryIndex}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val === (gameState.historyStates?.length || 1) - 1) {
                            setIsReviewMode(false);
                            setCurrentHistoryIndex(-1);
                          } else {
                            setIsReviewMode(true);
                            setCurrentHistoryIndex(val);
                          }
                        }}
                        className="flex-1 h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleForwardHistory}
                        disabled={!isReviewMode}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    {isReviewMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setIsReviewMode(false); setCurrentHistoryIndex(-1); }}
                        className="w-full h-6 text-[10px] uppercase font-black bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                      >
                        Return to Live Game
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Desktop Inline Chat */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-4 py-2 text-xs font-bold opacity-50 uppercase tracking-widest shrink-0" style={{ color: theme.textColor }}>Chat</div>
                <div className="flex-1 overflow-hidden relative min-h-0">
                  <GameChat
                    roomId={roomId}
                    playerId={playerId}
                    playerName={playerName}
                    themeId={profile?.theme_id}
                    isOpen={true}
                    onClose={() => { }}
                    variant="inline"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game Over Overlay */}
      {showGameOverOverlay && gameState.phase === 'gameOver' && (
        <GameOverOverlay
          isWinner={endReason === 'draw' ? null : (gameState.winner === playerColor)}
          reason={endReason || 'checkmate'}
          onBackToLobby={() => {
            setShowGameOverOverlay(false);
            handleLeaveRoom();
            onBack();
          }}
          opponentName={playerColor === 'white' ? blackName : whiteName}
        />
      )}
    </div>
  );
}
