package com.navtin.engine

import kotlin.math.max
import kotlin.math.min

object AIModule {
    fun getNextMove(state: GameState): Pair<Int, Int?>? {
        val depth = when (state.aiDifficulty) {
            AIDifficulty.EASY -> 1
            AIDifficulty.MEDIUM -> 3
            AIDifficulty.HARD -> 5
        }
        
        val result = minimax(state, depth, true, -1000000, 1000000)
        return result.second
    }

    private fun evaluate(state: GameState): Int {
        val aiPieces = state.player2PiecesOnBoard
        val humanPieces = state.player1PiecesOnBoard
        var score = (aiPieces - humanPieces) * 100
        
        val aiMills = countMills(PlayerTurn.PLAYER_2, state.piecePositions)
        val humanMills = countMills(PlayerTurn.PLAYER_1, state.piecePositions)
        score += (aiMills - humanMills) * 50
        
        val aiMoves = countPossibleMoves(PlayerTurn.PLAYER_2, state)
        val humanMoves = countPossibleMoves(PlayerTurn.PLAYER_1, state)
        score += (aiMoves - humanMoves) * 10
        
        return score
    }

    private fun minimax(state: GameState, depth: Int, isMaximizing: Boolean, alpha: Int, beta: Int): Pair<Int, Pair<Int, Int?>?> {
        if (depth == 0 || isGameOver(state)) {
            return evaluate(state) to null
        }
        
        var currentAlpha = alpha
        var currentBeta = beta
        
        if (isMaximizing) {
            var maxEval = -1000000
            var bestAction: Pair<Int, Int?>? = null
            
            for (move in getAllMoves(PlayerTurn.PLAYER_2, state)) {
                val nextState = simulateMove(move, state)
                val eval = minimax(nextState, depth - 1, false, currentAlpha, currentBeta).first
                if (eval > maxEval) {
                    maxEval = eval
                    bestAction = move
                }
                currentAlpha = max(currentAlpha, eval)
                if (currentBeta <= currentAlpha) break
            }
            return maxEval to bestAction
        } else {
            var minEval = 1000000
            var bestAction: Pair<Int, Int?>? = null
            
            for (move in getAllMoves(PlayerTurn.PLAYER_1, state)) {
                val nextState = simulateMove(move, state)
                val eval = minimax(nextState, depth - 1, true, currentAlpha, currentBeta).first
                if (eval < minEval) {
                    minEval = eval
                    bestAction = move
                }
                currentBeta = min(currentBeta, eval)
                if (currentBeta <= currentAlpha) break
            }
            return minEval to bestAction
        }
    }

    private fun getAllMoves(player: PlayerTurn, state: GameState): List<Pair<Int, Int?>> {
        val moves = mutableListOf<Pair<Int, Int?>>()
        val type = if (player == PlayerTurn.PLAYER_1) PieceType.PLAYER_1 else PieceType.PLAYER_2
        
        if (state.phase == GamePhase.PLACING) {
            for (i in 0..23) {
                if (!state.piecePositions.containsKey(i)) moves.add(i to null)
            }
        } else {
            val playerIndices = state.piecePositions.filter { it.value == type }.keys
            for (fromIdx in playerIndices) {
                val canFly = (player == PlayerTurn.PLAYER_1 && state.player1PiecesOnBoard == 3) ||
                             (player == PlayerTurn.PLAYER_2 && state.player2PiecesOnBoard == 3)
                
                if (canFly) {
                    for (toIdx in 0..23) {
                        if (!state.piecePositions.containsKey(toIdx)) moves.add(toIdx to fromIdx)
                    }
                } else {
                    Board.adjacencyList[fromIdx]?.forEach { toIdx ->
                        if (!state.piecePositions.containsKey(toIdx)) moves.add(toIdx to fromIdx)
                    }
                }
            }
        }
        return moves
    }

    private fun simulateMove(move: Pair<Int, Int?>, state: GameState): GameState {
        val newState = GameState()
        // Manual deep copy of mapping
        state.piecePositions.forEach { (k, v) -> newState.piecePositions[k] = v }
        newState.player1PiecesOnBoard = state.player1PiecesOnBoard
        newState.player2PiecesOnBoard = state.player2PiecesOnBoard
        newState.player1PiecesLeftToPlace = state.player1PiecesLeftToPlace
        newState.player2PiecesLeftToPlace = state.player2PiecesLeftToPlace
        newState.phase = state.phase
        newState.turn = state.turn
        
        val nodeIndex = move.first
        val fromIndex = move.second
        val type = if (newState.turn == PlayerTurn.PLAYER_1) PieceType.PLAYER_1 else PieceType.PLAYER_2
        
        if (fromIndex != null) {
            newState.piecePositions.remove(fromIndex)
        } else {
            if (newState.turn == PlayerTurn.PLAYER_1) {
                newState.player1PiecesLeftToPlace--
                newState.player1PiecesOnBoard++
            } else {
                newState.player2PiecesLeftToPlace--
                newState.player2PiecesOnBoard++
            }
        }
        newState.piecePositions[nodeIndex] = type
        
        if (MillDetector.isPartOfMill(nodeIndex, newState.piecePositions, type)) {
            val opponent = if (newState.turn == PlayerTurn.PLAYER_1) PieceType.PLAYER_2 else PieceType.PLAYER_1
            val targetIdx = newState.piecePositions.entries.firstOrNull { it.value == opponent }?.key
            if (targetIdx != null) {
                newState.piecePositions.remove(targetIdx)
                if (opponent == PieceType.PLAYER_1) newState.player1PiecesOnBoard--
                else newState.player2PiecesOnBoard--
            }
        }
        
        newState.turn = if (newState.turn == PlayerTurn.PLAYER_1) PlayerTurn.PLAYER_2 else PlayerTurn.PLAYER_1
        if (newState.player1PiecesLeftToPlace == 0 && newState.player2PiecesLeftToPlace == 0) {
            newState.phase = GamePhase.MOVING
        }
        return newState
    }

    private fun countMills(player: PlayerTurn, positions: Map<Int, PieceType>): Int {
        val type = if (player == PlayerTurn.PLAYER_1) PieceType.PLAYER_1 else PieceType.PLAYER_2
        return StandardMills.all.count { mill -> mill.all { positions[it] == type } }
    }

    private fun countPossibleMoves(player: PlayerTurn, state: GameState): Int {
        return getAllMoves(player, state).size
    }

    private fun isGameOver(state: GameState): Boolean {
        if (state.player1PiecesLeftToPlace > 0 || state.player2PiecesLeftToPlace > 0) return false
        if (state.player1PiecesOnBoard < 3 || state.player2PiecesOnBoard < 3) return true
        if (countPossibleMoves(state.turn, state) == 0) return true
        return false
    }
}
