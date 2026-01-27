package com.navtin.multiplayer

import com.navtin.engine.GameState
import com.navtin.engine.PlayerSide
import kotlinx.coroutines.delay

object SupabaseService {
    private const val URL = "https://ofplxtwqnpechpwodqor.supabase.co"
    private const val KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

    suspend fun startMatchmaking(userId: String, name: String, onMatched: (String, PlayerSide) -> Unit) {
        println("Matchmaking started for $name on Android...")
        
        // Logical flow (Supabase-kt):
        // 1. supabase.from("matchmaking_queue").select { ... }
        // 2. Handle room creation or queue entry
        
        delay(2000)
        onMatched("room_android_456", PlayerSide.BLACK)
    }

    fun sendMove(roomId: String, state: GameState) {
        // supabase.from("game_rooms").update(...)
        println("Sending move for $roomId")
    }

    fun subscribeToRoom(roomId: String, onUpdate: () -> Unit) {
        // supabase.realtime.channel("public:game_rooms").subscribe()
    }
}
