package com.navtin.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedRectangleCornerSize
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.navtin.engine.GameMode
import com.navtin.engine.GameState
import com.navtin.engine.GamePhase
import com.navtin.engine.PlayerTurn
import com.navtin.ui.AppTheme
import com.navtin.ui.board.BoardView

@Composable
fun HomeView() {
    val state = remember { GameState() }
    var showGame by remember { mutableStateOf(false) }
    var showMatchmaking by remember { mutableStateOf(false) }
    
    if (showGame) {
        BoardView(state = state)
    } else if (showMatchmaking) {
        com.navtin.ui.matchmaking.MatchmakingView(
            state = state,
            onMatchFound = { showMatchmaking = false; showGame = true },
            onCancel = { showMatchmaking = false }
        )
    } else {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(AppTheme.background),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxHeight().padding(vertical = 60.dp)
            ) {
                // Logo Section
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "NAV-TIN",
                        color = AppTheme.neonCyan,
                        fontSize = 64.sp,
                        fontWeight = FontWeight.Bold,
                        style = androidx.compose.ui.text.TextStyle(
                            shadow = Shadow(color = AppTheme.neonCyan, blurRadius = 40f)
                        )
                    )
                    Text(
                        text = "Cyber Strategy",
                        color = Color.White.copy(alpha = 0.6f),
                        fontSize = 16.sp,
                        letterSpacing = 5.sp
                    )
                }
                
                // Buttons
                Column(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 40.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    MenuButton("PLAY VS AI", AppTheme.neonCyan) {
                        state.mode = GameMode.VS_AI
                        startGame(state)
                        showGame = true
                    }
                    MenuButton("LOCAL 1V1", AppTheme.neonPink) {
                        state.mode = GameMode.LOCAL
                        startGame(state)
                        showGame = true
                    }
                    MenuButton("ONLINE MATCH", AppTheme.neonBorder) {
                        showMatchmaking = true
                    }
                    MenuButton("SETTINGS", Color.Gray) {}
                }
                
                // Ads Section
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .background(Color.White.copy(alpha = 0.05f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("AD BANNER", color = Color.White.copy(alpha = 0.3f), fontSize = 10.sp)
                    }

                    Text(
                        text = "VER 1.0.0",
                        color = Color.White.copy(alpha = 0.3f),
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 10.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun MenuButton(title: String, color: Color, isDisabled: Boolean = false, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(60.dp)
            .background(if (isDisabled) Color.Transparent else color.copy(alpha = 0.1f), shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp))
            .border(2.dp, if (isDisabled) Color.Gray else color, shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp))
            .clickable(enabled = !isDisabled) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = title,
            color = if (isDisabled) Color.Gray else Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 18.sp
        )
    }
}

private fun startGame(state: GameState) {
    state.piecePositions.clear()
    state.player1PiecesOnBoard = 0
    state.player2PiecesOnBoard = 0
    state.player1PiecesLeftToPlace = 9
    state.player2PiecesLeftToPlace = 9
    state.phase = GamePhase.PLACING
    state.turn = PlayerTurn.PLAYER_1
    state.isRemovingPiece = false
    state.message = "Player 1: Place a piece"
}
