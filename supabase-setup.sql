-- ==========================================
-- SUPABASE DATABASE SETUP FOR NINE MEN'S MORRIS
-- Run this ENTIRE block in Supabase SQL Editor
-- This script is IDEMPOTENT (safe to run multiple times)
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
-- Note: Using TEXT for id because the app generates random string IDs for guests
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Guest',
  avatar_url TEXT,
  theme_id TEXT DEFAULT 'classic',
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies for profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (true);
  END IF;
END $$;

-- ==========================================
-- 2. MATCHMAKING QUEUE TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  room_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE IF EXISTS public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies for matchmaking_queue
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'matchmaking_queue' AND policyname = 'Anyone can view queue entries') THEN
    CREATE POLICY "Anyone can view queue entries" ON public.matchmaking_queue FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'matchmaking_queue' AND policyname = 'Anyone can insert into queue') THEN
    CREATE POLICY "Anyone can insert into queue" ON public.matchmaking_queue FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'matchmaking_queue' AND policyname = 'Anyone can update queue entries') THEN
    CREATE POLICY "Anyone can update queue entries" ON public.matchmaking_queue FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'matchmaking_queue' AND policyname = 'Anyone can delete their queue entries') THEN
    CREATE POLICY "Anyone can delete their queue entries" ON public.matchmaking_queue FOR DELETE USING (true);
  END IF;
END $$;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_matchmaking_status ON public.matchmaking_queue(status);
CREATE INDEX IF NOT EXISTS idx_matchmaking_created ON public.matchmaking_queue(created_at);

-- ==========================================
-- 3. GAME ROOMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id TEXT PRIMARY KEY,
  white_player_id TEXT,
  white_player_name TEXT,
  black_player_id TEXT,
  black_player_name TEXT,
  game_state JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  white_last_active TIMESTAMP WITH TIME ZONE,
  black_last_active TIMESTAMP WITH TIME ZONE,
  forfeit_winner TEXT
);

-- Add columns if they don't exist (for existing tables)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_rooms' AND column_name = 'white_last_active') THEN
    ALTER TABLE public.game_rooms ADD COLUMN white_last_active TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_rooms' AND column_name = 'black_last_active') THEN
    ALTER TABLE public.game_rooms ADD COLUMN black_last_active TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_rooms' AND column_name = 'forfeit_winner') THEN
    ALTER TABLE public.game_rooms ADD COLUMN forfeit_winner TEXT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE IF EXISTS public.game_rooms ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies for game_rooms
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_rooms' AND policyname = 'Anyone can view game rooms') THEN
    CREATE POLICY "Anyone can view game rooms" ON public.game_rooms FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_rooms' AND policyname = 'Anyone can create game rooms') THEN
    CREATE POLICY "Anyone can create game rooms" ON public.game_rooms FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_rooms' AND policyname = 'Anyone can update game rooms') THEN
    CREATE POLICY "Anyone can update game rooms" ON public.game_rooms FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_rooms' AND policyname = 'Anyone can delete game rooms') THEN
    CREATE POLICY "Anyone can delete game rooms" ON public.game_rooms FOR DELETE USING (true);
  END IF;
END $$;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON public.game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_updated ON public.game_rooms(updated_at);

-- ==========================================
-- 4. GAME CHAT TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.game_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE IF EXISTS public.game_chat ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies for game_chat
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_chat' AND policyname = 'Anyone can view chat messages') THEN
    CREATE POLICY "Anyone can view chat messages" ON public.game_chat FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_chat' AND policyname = 'Anyone can send chat messages') THEN
    CREATE POLICY "Anyone can send chat messages" ON public.game_chat FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_game_chat_room ON public.game_chat(room_id);
CREATE INDEX IF NOT EXISTS idx_game_chat_created ON public.game_chat(created_at);

-- ==========================================
-- 5. ENABLE REALTIME
-- ==========================================
-- Enable realtime for specified tables if not already enabled
DO $$ BEGIN
  -- Check if publication exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Helper to add table to publication safely
-- This may not work in all Supabase hosted environments if they restrict publication management via SQL Editor
-- but it is the standard SQL way to do it.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'matchmaking_queue') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE matchmaking_queue;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'game_rooms') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'game_chat') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_chat;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Some Supabase environments don't allow ALTER PUBLICATION via SQL
  -- In that case, the user must enable it via the UI dashboard (Database -> Replication)
  RAISE NOTICE 'Could not configure publication via SQL. Please enable Realtime via Supabase UI Dashboard.';
END $$;

-- ==========================================
-- 6. AUTOMATIC CLEANUP FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.cleanup_old_queue_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM public.matchmaking_queue
  WHERE created_at < NOW() - INTERVAL '10 minutes'
  AND status = 'waiting';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 7. UPDATED_AT TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (these will error if they exist, so we drop them first or use a block)
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
  CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
  DROP TRIGGER IF EXISTS update_matchmaking_updated_at ON public.matchmaking_queue;
  CREATE TRIGGER update_matchmaking_updated_at BEFORE UPDATE ON public.matchmaking_queue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
  DROP TRIGGER IF EXISTS update_game_rooms_updated_at ON public.game_rooms;
  CREATE TRIGGER update_game_rooms_updated_at BEFORE UPDATE ON public.game_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'matchmaking_queue', 'game_rooms', 'game_chat');
