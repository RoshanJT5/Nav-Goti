import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    // Keep connection alive even when tab is inactive (prevents game ending on tab switch)
    // @ts-ignore - worker option exists but may not be in types
    worker: typeof window !== 'undefined',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Connection health monitor for realtime
if (typeof window !== 'undefined') {
  // Auto-reconnect on visibility change (when user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Attempt to reconnect when tab becomes visible again
      supabase.realtime.connect();
    }
  });
}

export interface GameRoom {
  id: string;
  white_player_id: string | null;
  white_player_name: string | null;
  black_player_id: string | null;
  black_player_name: string | null;
  game_state: GameStateJSON;
  status: 'waiting' | 'playing' | 'finished' | 'forfeited';
  created_at: string;
  updated_at: string;
  white_last_active: string | null;
  black_last_active: string | null;
  forfeit_winner: 'white' | 'black' | null;
}

export interface MatchmakingQueue {
  id: string;
  player_id: string;
  player_name: string;
  status: 'waiting' | 'matched' | 'cancelled';
  room_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameStateJSON {
  board: (string | null)[];
  currentPlayer: 'white' | 'black';
  phase: string;
  whitePiecesPlaced: number;
  blackPiecesPlaced: number;
  whitePiecesOnBoard: number;
  blackPiecesOnBoard: number;
  selectedPiece: number | null;
  mustRemove: boolean;
  winner: string | null;
  moveHistory: string[];
  historyStates?: any[];
}
