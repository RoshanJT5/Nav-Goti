"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { createInitialState } from "@/lib/morris-game";
import { Button } from "@/components/ui/button";
import { Profile } from "@/hooks/use-profile";
import {
  Loader2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { getTheme } from "@/lib/themes";

interface MatchmakingViewProps {
  onMatch: (roomId: string) => void;
  onCancel: () => void;
  profile: Profile | null;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MatchmakingView({ onMatch, onCancel, profile }: MatchmakingViewProps) {
  const theme = getTheme(profile?.theme_id);
  const [status, setStatus] = useState<'searching' | 'found' | 'error'>('searching');
  const playerId = profile?.id || "anonymous";
  const [queueId] = useState(() => Math.random().toString(36).substring(2, 10).toUpperCase());
  const [searchTime, setSearchTime] = useState(0);
  const cleanupRef = useRef(false);
  const queueEntryIdRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isSubscribed = true;
    let matchingCheckInterval: NodeJS.Timeout | null = null;

    const joinMatchmaking = async () => {
      try {
        console.log('Initiating matchmaking for:', playerId);

        // Check for existing waiting players
        const { data: existingQueue, error: queueFetchError } = await supabase
          .from('matchmaking_queue')
          .select('*')
          .eq('status', 'waiting')
          .neq('player_id', playerId)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        // PGRST116 means "no rows returned" which is expected when queue is empty
        if (queueFetchError && queueFetchError.code !== 'PGRST116') {
          console.error('Matchmaking: Error checking queue:', queueFetchError.message || queueFetchError);
          if (isSubscribed) setStatus('error');
          return;
        }

        if (existingQueue && isSubscribed && !cleanupRef.current) {
          console.log('Matchmaking: Found existing player, creating room...');
          const roomId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          const initialState = createInitialState();

          // Create game room
          const { error: roomError } = await supabase.from('game_rooms').insert({
            id: roomId,
            white_player_id: existingQueue.player_id,
            white_player_name: existingQueue.player_name,
            black_player_id: playerId,
            black_player_name: profile?.name || 'Guest',
            game_state: initialState,
            status: 'playing',
          });

          if (roomError) {
            console.error('Matchmaking: Error creating game room:', roomError.message || roomError);
            if (isSubscribed) setStatus('error');
            return;
          }

          // Update the matched queue entry
          const { error: updateError } = await supabase
            .from('matchmaking_queue')
            .update({ status: 'matched', room_id: roomId })
            .eq('id', existingQueue.id);

          if (updateError) {
            console.error('Matchmaking: Error updating opponent queue entry:', updateError.message || updateError);
            if (isSubscribed) setStatus('error');
            return;
          }

          if (isSubscribed) {
            setStatus('found');
            onMatch(roomId);
          }
          return;
        }

        // Create our queue entry
        console.log('Matchmaking: No existing players, creating own queue entry...');
        const { data: queueEntry, error: queueError } = await supabase
          .from('matchmaking_queue')
          .insert({
            player_id: playerId,
            player_name: profile?.name || 'Guest',
            status: 'waiting',
          })
          .select()
          .single();

        if (queueError || !queueEntry) {
          console.error('Matchmaking: Error creating queue entry:', queueError?.message || 'No data returned');
          if (isSubscribed) setStatus('error');
          return;
        }

        // Store the queue entry ID
        queueEntryIdRef.current = queueEntry.id;

        // Subscribe to changes on our queue entry
        channel = supabase
          .channel(`matchmaking:${queueEntry.id}`, {
            config: {
              broadcast: { self: true },
              presence: { key: playerId },
            },
          })
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'matchmaking_queue',
              filter: `id=eq.${queueEntry.id}`,
            },
            (payload) => {
              if (!isSubscribed || cleanupRef.current) return;
              const updated = payload.new as { status: string; room_id: string | null };
              if (updated.status === 'matched' && updated.room_id && isSubscribed) {
                console.log('Matchmaking: Matched by another player!');
                setStatus('found');
                onMatch(updated.room_id);
              }
            }
          )
          .subscribe(async (status) => {
            if (!isSubscribed) return;
            if (status === 'SUBSCRIBED') {
              console.log('Matchmaking: Channel subscribed successfully');
            } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
              console.warn('Matchmaking: Channel state changed:', status);
            }
          });

        // Polling for new players
        matchingCheckInterval = setInterval(async () => {
          if (!isSubscribed || cleanupRef.current || status === 'found') return;

          const { data: newQueue, error } = await supabase
            .from('matchmaking_queue')
            .select('*')
            .eq('status', 'waiting')
            .neq('player_id', playerId)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          if (error && error.code !== 'PGRST116') {
            return; // Ignore polling errors silently to avoid console noise
          }

          if (newQueue && isSubscribed && !cleanupRef.current) {
            const roomId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const initialState = createInitialState();

            const { error: roomError } = await supabase.from('game_rooms').insert({
              id: roomId,
              white_player_id: newQueue.player_id,
              white_player_name: newQueue.player_name,
              black_player_id: playerId,
              black_player_name: profile?.name || 'Guest',
              game_state: initialState,
              status: 'playing',
            });

            if (!roomError && isSubscribed) {
              await supabase
                .from('matchmaking_queue')
                .update({ status: 'matched', room_id: roomId })
                .eq('id', newQueue.id);

              setStatus('found');
              onMatch(roomId);
            }
          }
        }, 3000);

      } catch (err: any) {
        console.error('Matchmaking: Unexpected error:', err.message || err);
        if (isSubscribed) setStatus('error');
      }
    };

    joinMatchmaking();

    return () => {
      console.log('Matchmaking: Cleaning up...');
      isSubscribed = false;
      cleanupRef.current = true;

      if (matchingCheckInterval) {
        clearInterval(matchingCheckInterval);
      }

      if (channel) {
        supabase.removeChannel(channel);
      }

      if (queueEntryIdRef.current) {
        const idToDelete = queueEntryIdRef.current;
        (async () => {
          try {
            await supabase
              .from('matchmaking_queue')
              .delete()
              .eq('id', idToDelete)
              .eq('status', 'waiting');
          } catch (err) {
            console.error('Matchmaking: Cleanup error:', err);
          }
        })();
      }
    };
  }, [playerId, profile?.name, onMatch]);

  const handleCancel = async () => {
    cleanupRef.current = true;

    // Delete using the specific queue entry ID if available
    if (queueEntryIdRef.current) {
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('id', queueEntryIdRef.current);
    } else {
      // Fallback to player_id based deletion
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('player_id', playerId)
        .eq('status', 'waiting');
    }

    onCancel();
  };

  return (
    <div
      className="min-h-screen relative transition-all duration-500 overflow-hidden"
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

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl p-8 text-center max-w-md w-full border backdrop-blur-xl shadow-2xl"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.id === 'peacock' ? 'rgba(255, 215, 0, 0.5)' : theme.boardLineColor + '20',
            boxShadow: theme.id === 'peacock' ? '0 8px 32px 0 rgba(0, 0, 0, 0.6)' : 'none'
          }}
        >
          {status === 'searching' && (
            <>
              <div className="relative w-24 h-24 mx-auto mb-6">
                <motion.div
                  className="absolute inset-0 rounded-full opacity-20"
                  style={{ backgroundColor: theme.accentColor }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full opacity-20"
                  style={{ backgroundColor: theme.accentColor }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      backgroundColor: theme.accentColor,
                      filter: theme.id === 'peacock' ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))' : 'none'
                    }}
                  >
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.headingColor }}>Finding Opponent</h2>
              <p className="mb-4" style={{ color: theme.textColor }}>Searching for a player to match with...</p>

              <div className="rounded-lg px-4 py-4 mb-6 shadow-inner border" style={{ backgroundColor: theme.appBackground, borderColor: theme.boardLineColor + '10' }}>
                <div className="flex items-center justify-center gap-3 text-white">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.id === 'peacock' ? '#00ffcc' : theme.accentColor }} />
                  <span className="font-mono text-xl tracking-widest">{formatTime(searchTime)}</span>
                </div>
              </div>

              <Button
                onClick={handleCancel}
                variant="outline"
                className="transition-all hover:scale-105"
                style={{
                  borderColor: theme.id === 'peacock' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255,255,255,0.2)',
                  color: theme.textColor
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Search
              </Button>
            </>
          )}

          {status === 'found' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                style={{
                  backgroundColor: theme.accentColor,
                  filter: theme.id === 'peacock' ? 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.6))' : 'none'
                }}
              >
                <Zap className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.headingColor }}>Match Found!</h2>
              <p style={{ color: theme.textColor }}>Initializing high-stakes session...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <X className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.headingColor }}>Connection Error</h2>
              <p className="mb-4" style={{ color: theme.textColor }}>Failed to connect to matchmaking service.</p>

              <Button
                onClick={onCancel}
                variant="outline"
                className="transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: theme.textColor
                }}
              >
                Back to Menu
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
