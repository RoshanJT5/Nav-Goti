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

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const joinMatchmaking = async () => {
      try {
        const { data: existingQueue } = await supabase
          .from('matchmaking_queue')
          .select('*')
          .eq('status', 'waiting')
          .neq('player_id', playerId)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (existingQueue && !cleanupRef.current) {
          const roomId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          const initialState = createInitialState();

          await supabase.from('game_rooms').insert({
            id: roomId,
            white_player_id: existingQueue.player_id,
            white_player_name: existingQueue.player_name,
            black_player_id: playerId,
            black_player_name: profile?.name || 'Guest',
            game_state: initialState,
            status: 'playing',
          });

          await supabase
            .from('matchmaking_queue')
            .update({ status: 'matched', room_id: roomId })
            .eq('id', existingQueue.id);

          setStatus('found');
          setTimeout(() => onMatch(roomId), 1000);
          return;
        }

        const { data: queueEntry } = await supabase
          .from('matchmaking_queue')
          .insert({
            player_id: playerId,
            player_name: profile?.name || 'Guest',
            status: 'waiting',
          })
          .select()
          .single();

        if (!queueEntry) {
          setStatus('error');
          return;
        }

        channel = supabase
          .channel(`matchmaking:${queueEntry.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'matchmaking_queue',
              filter: `id=eq.${queueEntry.id}`,
            },
            (payload) => {
              const updated = payload.new as { status: string; room_id: string | null };
              if (updated.status === 'matched' && updated.room_id) {
                setStatus('found');
                setTimeout(() => onMatch(updated.room_id!), 1000);
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.error('Matchmaking error:', err);
        setStatus('error');
      }
    };

    joinMatchmaking();

    return () => {
      cleanupRef.current = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
      supabase
        .from('matchmaking_queue')
        .delete()
        .eq('player_id', playerId)
        .eq('status', 'waiting')
        .then(() => {});
    };
  }, [playerId, profile?.name, onMatch]);

  const handleCancel = async () => {
    cleanupRef.current = true;
    await supabase
      .from('matchmaking_queue')
      .delete()
      .eq('player_id', playerId)
      .eq('status', 'waiting');
    onCancel();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500" style={{ backgroundColor: theme.appBackground }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl p-8 text-center max-w-md w-full border-2 shadow-2xl"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.lineColor + '20' }}
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
                <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: theme.accentColor }}>
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.isDark ? '#fff' : theme.headingColor }}>Finding Opponent</h2>
            <p className="mb-4" style={{ color: theme.isDark ? 'rgba(255,255,255,0.7)' : theme.textColor }}>Searching for a player to match with...</p>
            
            <div className="rounded-lg px-4 py-3 mb-6 shadow-inner" style={{ backgroundColor: theme.appBackground }}>
              <div className="flex items-center justify-center gap-2" style={{ color: theme.isDark ? '#fff' : theme.textColor }}>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: theme.accentColor }} />
                <span className="font-mono text-lg">{formatTime(searchTime)}</span>
              </div>
            </div>

            <Button
              onClick={handleCancel}
              variant="outline"
              className="transition-all"
              style={{ borderColor: theme.isDark ? 'rgba(255,255,255,0.2)' : theme.lineColor + '20', color: theme.isDark ? '#fff' : theme.lineColor }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </>
        )}

        {status === 'found' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{ backgroundColor: theme.accentColor }}
            >
              <Zap className="w-10 h-10 text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.isDark ? '#fff' : theme.headingColor }}>Match Found!</h2>
            <p style={{ color: theme.isDark ? 'rgba(255,255,255,0.7)' : theme.textColor }}>Starting game...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <X className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.isDark ? '#fff' : theme.headingColor }}>Connection Error</h2>
            <p className="mb-4" style={{ color: theme.isDark ? 'rgba(255,255,255,0.7)' : theme.textColor }}>Failed to connect to matchmaking service.</p>
            
            <Button
              onClick={onCancel}
              variant="outline"
              className="transition-all"
              style={{ borderColor: theme.isDark ? 'rgba(255,255,255,0.2)' : theme.lineColor + '20', color: theme.isDark ? '#fff' : theme.lineColor }}
            >
              Back to Menu
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
