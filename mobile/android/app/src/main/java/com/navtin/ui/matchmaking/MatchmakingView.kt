package com.navtin.ui.matchmaking

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.navtin.engine.GameMode
import com.navtin.engine.GameState
import com.navtin.multiplayer.SupabaseService
import com.navtin.ui.AppTheme
import kotlinx.coroutines.launch

@Composable
fun MatchmakingView(state: GameState, onMatchFound: () -> Unit, onCancel: () -> Unit) {
    var isSearching by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    
    val infiniteTransition = rememberInfiniteTransition()
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        )
    )
    val pulseOpacity by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        )
    )

    LaunchedEffect(Unit) {
        scope.launch {
            SupabaseService.startMatchmaking(state.userId, "AndroidWarrior") { roomId, side ->
                state.roomId = roomId
                state.playerSide = side
                state.mode = GameMode.ONLINE
                isSearching = false
                onMatchFound()
            }
        }
    }

    Box(
        modifier = Modifier.fillMaxSize().background(AppTheme.background),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(40.dp)) {
            Text(
                "MATCHMAKING",
                color = AppTheme.neonCyan,
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                style = androidx.compose.ui.text.TextStyle(shadow = Shadow(color = AppTheme.neonCyan, blurRadius = 20f))
            )

            Box(contentAlignment = Alignment.Center) {
                // Pulse
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .scale(pulseScale)
                        .background(AppTheme.neonCyan.copy(alpha = pulseOpacity * 0.3f), shape = CircleShape)
                )
                // Center
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .background(AppTheme.neonCyan.copy(alpha = 0.1f), shape = CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text("📡", fontSize = 40.sp)
                }
            }

            Text(
                if (isSearching) "Searching for opponent..." else "Match Found!",
                color = Color.White,
                fontSize = 18.sp
            )

            TextButton(onClick = onCancel) {
                Text("CANCEL", color = Color.Red)
            }
        }
    }
}
