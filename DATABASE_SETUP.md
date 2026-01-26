# Nine Men's Morris - Database Setup Instructions

## Step 1: Setup Supabase Database

Before running the app in online mode, you **MUST** set up the database tables in Supabase.

### A. Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### B. Run the SQL Setup Script
1. Open the file `supabase-setup.sql` in this directory
2. **Copy ALL the SQL code** from that file
3. **Paste it into the Supabase SQL Editor**
4. Click **"Run"** button (or press Ctrl/Cmd + Enter)
5. Wait for the query to complete

### C. Verify Setup
After running the SQL script, verify that all tables were created:

Run this verification query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'matchmaking_queue', 'game_rooms', 'game_chat');
```

You should see 4 tables listed:
- `profiles`
- `matchmaking_queue`
- `game_rooms`
- `game_chat`

### D. Enable Realtime (Important!)
Go to "Database" > "Replication" in Supabase and ensure the following tables have realtime enabled:
- ✅ matchmaking_queue
- ✅ game_rooms  
- ✅ game_chat
- ✅ profiles

## Step 2: Configure Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: Run the Application

After database setup is complete:

```bash
npm run dev
```

Now you can:
- ✅ Create/join online games
- ✅ Use matchmaking to find random opponents
- ✅ Play with real-time synchronization
- ✅ Use in-game chat

## Troubleshooting

### Issue: "Error creating queue entry"
**Solution:** Run the SQL setup script in Supabase. The tables don't exist yet.

### Issue: "Connection breaks after 2 seconds"
**Solution:** 
1. Check that realtime is enabled for all tables in Supabase
2. Verify your Supabase URL and ANON_KEY are correct
3. Check browser console for specific errors

### Issue: "Game state not updating in real-time"
**Solution:**
1. Ensure realtime is enabled for `game_rooms` table
2. Check that both players are connected (presence indicator should show 2 users)
3. Open browser console on both clients to see sync logs

### Issue: "Player names showing as 'Guest'"
**Solution:** This is normal for anonymous users. Players can set their name in the profile settings.

## Database Maintenance

### Clean up old matchmaking queues
Run this periodically to clean up abandoned queue entries:

```sql
DELETE FROM matchmaking_queue
WHERE created_at < NOW() - INTERVAL '10 minutes'
AND status = 'waiting';
```

### Clean up finished games
```sql
DELETE FROM game_rooms
WHERE status = 'finished'
AND updated_at < NOW() - INTERVAL '1 day';
```

### Clean up old chat messages
```sql
DELETE FROM game_chat
WHERE created_at < NOW() - INTERVAL '7 days';
```

## Security Notes

The database is configured with Row Level Security (RLS) policies that allow:
- Anyone to read data (for spectator mode in future)
- Anyone to insert/update their own data
- Automatic cleanup of stale data

For production, you may want to tighten these policies to only allow authenticated users.
