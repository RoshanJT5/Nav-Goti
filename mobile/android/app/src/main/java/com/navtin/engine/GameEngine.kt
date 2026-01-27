package com.navtin.engine

object GameEngine {
    fun handleNodeTap(index: Int, state: GameState) {
        FeedbackManager.get()?.playSelection()
        if (state.isRemovingPiece) {
            removePiece(index, state)
            return
        }
        
        when (state.phase) {
            GamePhase.PLACING -> placePiece(index, state)
            GamePhase.MOVING, GamePhase.FLYING -> handleMove(index, state)
        }
    }
    
    private fun placePiece(index: Int, state: GameState) {
        if (state.piecePositions.containsKey(index)) return
        
        val type = state.currentPieceType
        state.piecePositions[index] = type
        
        if (type == PieceType.PLAYER_1) {
            state.player1PiecesLeftToPlace -= 1
            state.player1PiecesOnBoard += 1
        } else {
            state.player2PiecesLeftToPlace -= 1
            state.player2PiecesOnBoard += 1
        }
        
        if (MillDetector.isPartOfMill(index, state.piecePositions, type)) {
            state.isRemovingPiece = true
            state.message = "MILL! Remove an opponent's piece"
            FeedbackManager.get()?.playMill()
        } else {
            FeedbackManager.get()?.playMove()
            endTurn(state)
        }
    }
    
    private fun handleMove(index: Int, state: GameState) {
        val selected = state.selectedNodeIndex
        if (selected != null) {
            // Attempt to move from selected to index
            if (!state.piecePositions.containsKey(index)) {
                val isAdjacent = Board.adjacencyList[selected]?.contains(index) == true
                val canFly = (state.turn == PlayerTurn.PLAYER_1 && state.player1PiecesOnBoard == 3) ||
                             (state.turn == PlayerTurn.PLAYER_2 && state.player2PiecesOnBoard == 3)
                
                if (isAdjacent || canFly) {
                    val type = state.piecePositions[selected]!!
                    state.piecePositions.remove(selected)
                    state.piecePositions[index] = type
                    state.selectedNodeIndex = null
                    
                    if (MillDetector.isPartOfMill(index, state.piecePositions, type)) {
                        state.isRemovingPiece = true
                        state.message = "MILL! Remove an opponent's piece"
                        FeedbackManager.get()?.playMill()
                    } else {
                        FeedbackManager.get()?.playMove()
                        endTurn(state)
                    }
                } else {
                    state.selectedNodeIndex = null
                    state.message = "Invalid move"
                }
            } else {
                state.selectedNodeIndex = null
            }
        } else {
            // Selecting a piece
            if (state.piecePositions[index] == state.currentPieceType) {
                state.selectedNodeIndex = index
                state.message = "Node $index selected"
            }
        }
    }
    
    private fun removePiece(index: Int, state: GameState) {
        val opponent = if (state.turn == PlayerTurn.PLAYER_1) PieceType.PLAYER_2 else PieceType.PLAYER_1
        if (state.piecePositions[index] != opponent) return
        
        // Cannot remove piece in a mill unless all are in mills
        val opponentPieces = state.piecePositions.filter { it.value == opponent }
        val allInMills = opponentPieces.all { MillDetector.isPartOfMill(it.key, state.piecePositions, opponent) }
        
        if (!allInMills && MillDetector.isPartOfMill(index, state.piecePositions, opponent)) {
            state.message = "Cannot remove piece in a mill"
            return
        }
        
        state.piecePositions.remove(index)
        if (opponent == PieceType.PLAYER_1) state.player1PiecesOnBoard -= 1
        else state.player2PiecesOnBoard -= 1
        
        state.isRemovingPiece = false
        endTurn(state)
    }
    
    private fun endTurn(state: GameState) {
        state.turn = if (state.turn == PlayerTurn.PLAYER_1) PlayerTurn.PLAYER_2 else PlayerTurn.PLAYER_1
        
        if (state.player1PiecesLeftToPlace == 0 && state.player2PiecesLeftToPlace == 0) {
            state.phase = if (state.phase == GamePhase.PLACING) GamePhase.MOVING else state.phase
            
            // Re-check flying phase for current player
            if (state.player1PiecesOnBoard == 3 && state.turn == PlayerTurn.PLAYER_1) state.phase = GamePhase.FLYING
            if (state.player2PiecesOnBoard == 3 && state.turn == PlayerTurn.PLAYER_2) state.phase = GamePhase.FLYING
        }
        
        if (!checkGameOver(state)) {
            state.message = "Player ${if (state.turn == PlayerTurn.PLAYER_1) "1" else "2"}'s turn"
            
            // Sync to Supabase
            if (state.mode == GameMode.ONLINE && state.roomId != null) {
                SupabaseService.sendMove(state.roomId!!, state)
            }
            
            // AI Turn
            if (state.mode == GameMode.VS_AI && state.turn == PlayerTurn.PLAYER_2) {
                // In a real Android app you'd use a Coroutine or Handler
                // Simple call for logic demonstration
                val move = AIModule.getNextMove(state)
                if (move != null) {
                    if (move.second != null) state.selectedNodeIndex = move.second
                    handleNodeTap(move.first, state)
                }
            }
        }
    }
    
    private fun checkGameOver(state: GameState): Boolean {
        // Only check after placement phase
        if (state.player1PiecesLeftToPlace > 0 || state.player2PiecesLeftToPlace > 0) return false
        
        val currentPlayer = state.turn
        val piecesOnBoard = if (currentPlayer == PlayerTurn.PLAYER_1) state.player1PiecesOnBoard else state.player2PiecesOnBoard
        
        if (piecesOnBoard < 3) {
            state.message = "Game Over! Player ${if (currentPlayer == PlayerTurn.PLAYER_1) "2" else "1"} Wins!"
            FeedbackManager.get()?.playWin()
            // In real app, passes activity context
            // AdMobManager.showInterstitial(activity)
            println("AdMob: Triggering post-match Interstitial")
            return true
        }
        
        // ... (Condition 2)
        if (!hasMoves) {
            state.message = "No moves! Player ${if (currentPlayer == PlayerTurn.PLAYER_1) "2" else "1"} Wins!"
            FeedbackManager.get()?.playWin()
            println("AdMob: Triggering post-match Interstitial")
            return true
        }
        
        return false
    }
}
