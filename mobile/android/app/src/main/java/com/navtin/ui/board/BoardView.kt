package com.navtin.ui.board

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.navtin.engine.Board
import com.navtin.engine.GameEngine
import com.navtin.engine.GameState
import com.navtin.engine.PieceType
import com.navtin.engine.PlayerTurn
import com.navtin.ui.AppTheme
import kotlin.math.pow
import kotlin.math.sqrt

@Composable
fun BoardView(state: GameState) {
    val boardSize = 350.dp
    
    // Drag state
    var draggedPieceIndex by remember { mutableStateOf<Int?>(null) }
    var dragOffset by remember { mutableStateOf(Offset.Zero) }
    var isDragging by remember { mutableStateOf(false) }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(AppTheme.background),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(40.dp)
        ) {
            // Header
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "NAV GOTI",
                    color = AppTheme.neonCyan,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    style = androidx.compose.ui.text.TextStyle(
                        shadow = Shadow(color = AppTheme.neonCyan, blurRadius = 20f)
                    )
                )
                
                Text(
                    text = state.message,
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 14.sp
                )
            }
            
            // Game Board with Drag & Drop
            Canvas(
                modifier = Modifier
                    .size(boardSize)
                    .pointerInput(Unit) {
                        detectTapGestures { offset ->
                            // Only handle tap if not dragging
                            if (!isDragging) {
                                handleTap(offset, state, size.width.toFloat())
                            }
                        }
                    }
                    .pointerInput(Unit) {
                        detectDragGestures(
                            onDragStart = { offset ->
                                // Find which piece is being dragged
                                val boardWidth = size.width.toFloat()
                                val threshold = 35f
                                
                                Board.nodes.forEach { (index, coord) ->
                                    val nodeX = coord.x * boardWidth
                                    val nodeY = coord.y * boardWidth
                                    val dist = sqrt((nodeX - offset.x).pow(2) + (nodeY - offset.y).pow(2))
                                    
                                    if (dist < threshold) {
                                        val piece = state.piecePositions[index]
                                        val currentPlayerPiece = when (state.turn) {
                                            PlayerTurn.PLAYER_1 -> PieceType.PLAYER_1
                                            PlayerTurn.PLAYER_2 -> PieceType.PLAYER_2
                                        }
                                        
                                        // Only allow dragging current player's pieces during moving phase
                                        if (piece == currentPlayerPiece && state.phase == com.navtin.engine.GamePhase.MOVING) {
                                            draggedPieceIndex = index
                                            dragOffset = offset
                                            isDragging = true
                                            // Select the piece in game state
                                            GameEngine.handleNodeTap(index, state)
                                        }
                                    }
                                }
                            },
                            onDrag = { change, dragAmount ->
                                change.consume()
                                if (isDragging) {
                                    dragOffset += dragAmount
                                }
                            },
                            onDragEnd = {
                                if (isDragging && draggedPieceIndex != null) {
                                    // Find closest valid target node
                                    val boardWidth = size.width.toFloat()
                                    val threshold = 40f
                                    var closestNode: Int? = null
                                    var closestDist = Float.MAX_VALUE
                                    
                                    Board.nodes.forEach { (index, coord) ->
                                        val nodeX = coord.x * boardWidth
                                        val nodeY = coord.y * boardWidth
                                        val dist = sqrt((nodeX - dragOffset.x).pow(2) + (nodeY - dragOffset.y).pow(2))
                                        
                                        if (dist < threshold && dist < closestDist) {
                                            closestNode = index
                                            closestDist = dist
                                        }
                                    }
                                    
                                    // Attempt to move to closest node
                                    closestNode?.let { targetNode ->
                                        GameEngine.handleNodeTap(targetNode, state)
                                    }
                                    
                                    // Reset drag state
                                    draggedPieceIndex = null
                                    dragOffset = Offset.Zero
                                    isDragging = false
                                }
                            },
                            onDragCancel = {
                                // Reset drag state on cancel
                                draggedPieceIndex = null
                                dragOffset = Offset.Zero
                                isDragging = false
                            }
                        )
                    }
            ) {
                val width = size.width
                val height = size.height
                
                // Draw Board Lines
                Board.adjacencyList.forEach { (startNode, neighbors) ->
                    val startCoord = Board.nodes[startNode] ?: return@forEach
                    val start = Offset(startCoord.x * width, startCoord.y * height)
                    
                    neighbors.forEach { endNode ->
                        if (endNode > startNode) {
                            val endCoord = Board.nodes[endNode] ?: return@forEach
                            val end = Offset(endCoord.x * width, endCoord.y * height)
                            
                            drawLine(
                                color = AppTheme.neonBorder.copy(alpha = 0.5f),
                                start = start,
                                end = end,
                                strokeWidth = 4f
                            )
                            // Glow effect
                            drawLine(
                                color = AppTheme.neonBorder,
                                start = start,
                                end = end,
                                strokeWidth = 2f
                            )
                        }
                    }
                }
                
                // Draw Nodes
                Board.nodes.values.forEach { coord ->
                    drawCircle(
                        color = Color.White.copy(alpha = 0.2f),
                        radius = 8f,
                        center = Offset(coord.x * width, coord.y * height)
                    )
                }
                
                // Draw Valid Move Indicators (if piece is selected or being dragged)
                if (state.selectedNodeIndex != null || isDragging) {
                    val selectedIndex = draggedPieceIndex ?: state.selectedNodeIndex
                    selectedIndex?.let { fromIndex ->
                        // Show valid moves with pulsing circles
                        Board.adjacencyList[fromIndex]?.forEach { toIndex ->
                            if (state.piecePositions[toIndex] == null) {
                                val coord = Board.nodes[toIndex] ?: return@forEach
                                val center = Offset(coord.x * width, coord.y * height)
                                
                                // Valid move indicator
                                drawCircle(
                                    color = Color.Green.copy(alpha = 0.3f),
                                    radius = 20f,
                                    center = center
                                )
                                drawCircle(
                                    color = Color.Green,
                                    radius = 15f,
                                    center = center,
                                    style = Stroke(width = 3f)
                                )
                            }
                        }
                    }
                }
                
                // Draw Pieces (except the one being dragged)
                state.piecePositions.forEach { (index, type) ->
                    if (index != draggedPieceIndex || !isDragging) {
                        val coord = Board.nodes[index] ?: return@forEach
                        val center = Offset(coord.x * width, coord.y * height)
                        val color = if (type == PieceType.PLAYER_1) AppTheme.neonCyan else AppTheme.neonPink
                        
                        // Outer glow
                        drawCircle(
                            color = color.copy(alpha = 0.3f),
                            radius = 35f,
                            center = center
                        )
                        
                        // Core piece
                        drawCircle(
                            color = color,
                            radius = 25f,
                            center = center
                        )
                        
                        // Selection highlight
                        if (state.selectedNodeIndex == index) {
                            drawCircle(
                                color = Color.White,
                                radius = 30f,
                                center = center,
                                style = Stroke(width = 4f)
                            )
                        }
                    }
                }
                
                // Draw the dragged piece at drag position
                if (isDragging && draggedPieceIndex != null) {
                    val type = state.piecePositions[draggedPieceIndex]
                    type?.let {
                        val color = if (it == PieceType.PLAYER_1) AppTheme.neonCyan else AppTheme.neonPink
                        
                        // Larger glow while dragging
                        drawCircle(
                            color = color.copy(alpha = 0.4f),
                            radius = 45f,
                            center = dragOffset
                        )
                        
                        // Dragged piece (slightly larger)
                        drawCircle(
                            color = color,
                            radius = 30f,
                            center = dragOffset
                        )
                        
                        // White outline to show it's being dragged
                        drawCircle(
                            color = Color.White,
                            radius = 35f,
                            center = dragOffset,
                            style = Stroke(width = 3f)
                        )
                    }
                }
            }
            
            // Footer / Stats
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                PlayerStatView("P1", state.player1PiecesOnBoard, AppTheme.neonCyan, state.turn == PlayerTurn.PLAYER_1)
                PlayerStatView("P2", state.player2PiecesOnBoard, AppTheme.neonPink, state.turn == PlayerTurn.PLAYER_2)
            }
        }
    }
}

@Composable
fun PlayerStatView(name: String, count: Int, color: Color, isTurn: Boolean) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(color, shape = androidx.compose.foundation.shape.CircleShape)
                .then(
                    if (isTurn) Modifier.padding(2.dp).background(Color.White, shape = androidx.compose.foundation.shape.CircleShape).padding(2.dp).background(color, shape = androidx.compose.foundation.shape.CircleShape)
                    else Modifier
                ),
            contentAlignment = Alignment.Center
        ) {
            // Shadow effect would go here if needed
        }
        
        Text(text = name, color = Color.White, fontSize = 12.sp)
        Text(text = "$count Pieces", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
    }
}

private fun handleTap(offset: Offset, state: GameState, boardWidth: Float) {
    val threshold = 30f
    Board.nodes.forEach { (index, coord) ->
        val nodeX = coord.x * boardWidth
        val nodeY = coord.y * boardWidth
        val dist = sqrt((nodeX - offset.x).pow(2) + (nodeY - offset.y).pow(2))
        if (dist < threshold) {
            GameEngine.handleNodeTap(index, state)
            return
        }
    }
}
