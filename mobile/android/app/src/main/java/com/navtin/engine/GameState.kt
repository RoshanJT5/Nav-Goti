package com.navtin.engine

import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue

enum class GamePhase {
    PLACING, MOVING, FLYING
}

enum class PlayerTurn {
    PLAYER_1, PLAYER_2
}

enum class GameMode {
    VS_AI, LOCAL, ONLINE
}

enum class PlayerSide {
    WHITE, BLACK
}

class GameState {
    var mode by mutableStateOf(GameMode.LOCAL)
    var aiDifficulty by mutableStateOf(AIDifficulty.MEDIUM)
    var phase by mutableStateOf(GamePhase.PLACING)
    var turn by mutableStateOf(PlayerTurn.PLAYER_1)
    var piecePositions = mutableMapOf<Int, PieceType>()
    
    // Online State
    var roomId by mutableStateOf<String?>(null)
    var playerSide by mutableStateOf<PlayerSide?>(null)
    var userId by mutableStateOf(java.util.UUID.randomUUID().toString())
    var opponentName by mutableStateOf("Opponent")
    
    val isMyTurn: Boolean get() {
        if (mode != GameMode.ONLINE) return true
        if (playerSide == PlayerSide.WHITE && turn == PlayerTurn.PLAYER_1) return true
        if (playerSide == PlayerSide.BLACK && turn == PlayerTurn.PLAYER_2) return true
        return false
    }
    
    var player1PiecesLeftToPlace by mutableStateOf(9)
    var player2PiecesLeftToPlace by mutableStateOf(9)
    
    var player1PiecesOnBoard by mutableStateOf(0)
    var player2PiecesOnBoard by mutableStateOf(0)
    
    var isRemovingPiece by mutableStateOf(false)
    
    // UI state
    var selectedNodeIndex by mutableStateOf<Int?>(null)
    var message by mutableStateOf("Player 1: Place a piece")
    
    val currentPlayer: PlayerTurn get() = turn
    val currentPieceType: PieceType get() = if (turn == PlayerTurn.PLAYER_1) PieceType.PLAYER_1 else PieceType.PLAYER_2
}
