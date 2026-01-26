import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface GameRoom {
  id: string;
  white_player_id: string | null;
  black_player_id: string | null;
  game_state: GameStateJSON;
  status: 'waiting' | 'playing' | 'finished';
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
}
