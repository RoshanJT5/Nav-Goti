import Foundation

class GameEngine {
    static func handleNodeTap(index: Int, state: GameState) {
        HapticManager.shared.playSelection()
        if state.isRemovingPiece {
            removePiece(at: index, state: state)
            return
        }
        
        switch state.phase {
        case .placing:
            placePiece(at: index, state: state)
        case .moving, .flying:
            handleMove(at: index, state: state)
        }
    }
    
    private static func placePiece(at index: Int, state: GameState) {
        guard state.piecePositions[index] == nil else { return }
        
        let type = state.currentPieceType
        state.piecePositions[index] = type
        
        if type == .player1 {
            state.player1PiecesLeftToPlace -= 1
            state.player1PiecesOnBoard += 1
        } else {
            state.player2PiecesLeftToPlace -= 1
            state.player2PiecesOnBoard += 1
        }
        
        if MillDetector.isPartOfMill(nodeIndex: index, positions: state.piecePositions, player: type) {
            state.isRemovingPiece = true
            state.message = "MILL! Remove an opponent's piece"
            HapticManager.shared.playMill()
        } else {
            HapticManager.shared.playMove()
            endTurn(state: state)
        }
    }
    
    private static func handleMove(at index: Int, state: GameState) {
        if let selected = state.selectedNodeIndex {
            // Attempt to move from selected to index
            if state.piecePositions[index] == nil {
                let isAdjacent = Board.adjacencyList[selected]?.contains(index) ?? false
                let canFly = (state.turn == .player1 && state.player1PiecesOnBoard == 3) ||
                             (state.turn == .player2 && state.player2PiecesOnBoard == 3)
                
                if isAdjacent || canFly {
                    let type = state.piecePositions[selected]!
                    state.piecePositions[selected] = nil
                    state.piecePositions[index] = type
                    state.selectedNodeIndex = nil
                    
                    if MillDetector.isPartOfMill(nodeIndex: index, positions: state.piecePositions, player: type) {
                        state.isRemovingPiece = true
                        state.message = "MILL! Remove an opponent's piece"
                        HapticManager.shared.playMill()
                    } else {
                        HapticManager.shared.playMove()
                        endTurn(state: state)
                    }
                } else {
                    state.selectedNodeIndex = nil
                    state.message = "Invalid move"
                }
            } else {
                state.selectedNodeIndex = nil
            }
        } else {
            // Selecting a piece
            if state.piecePositions[index] == state.currentPieceType {
                state.selectedNodeIndex = index
                state.message = "Node \(index) selected"
            }
        }
    }
    
    private static func removePiece(at index: Int, state: GameState) {
        let opponent = state.turn == .player1 ? PieceType.player2 : PieceType.player1
        guard state.piecePositions[index] == opponent else { return }
        
        // Cannot remove piece in a mill unless all are in mills
        let allInMills = state.piecePositions.filter { $0.value == opponent }
            .allSatisfy { MillDetector.isPartOfMill(nodeIndex: $0.key, positions: state.piecePositions, player: opponent) }
        
        if !allInMills && MillDetector.isPartOfMill(nodeIndex: index, positions: state.piecePositions, player: opponent) {
            state.message = "Cannot remove piece in a mill"
            return
        }
        
        state.piecePositions[index] = nil
        if opponent == .player1 { state.player1PiecesOnBoard -= 1 }
        else { state.player2PiecesOnBoard -= 1 }
        
        state.isRemovingPiece = false
        endTurn(state: state)
    }
    
    private static func endTurn(state: GameState) {
        state.turn = state.turn == .player1 ? .player2 : .player1
        
        if state.player1PiecesLeftToPlace == 0 && state.player2PiecesLeftToPlace == 0 {
            if state.phase == .placing { state.phase = .moving }
            // Check for flying
            if state.player1PiecesOnBoard == 3 && state.turn == .player1 { state.phase = .flying }
            if state.player2PiecesOnBoard == 3 && state.turn == .player2 { state.phase = .flying }
        }
        
        if checkGameOver(state: state) {
            // GameOver handled
        } else {
            state.message = "Player \(state.turn == .player1 ? "1" : "2")'s turn"
            
            // Sync move to Supabase if Online
            if state.mode == .online, let room = state.roomId {
                SupabaseService.shared.sendMove(roomId: room, state: state)
            }
            
            // AI Turn
            if state.mode == .vsAI && state.turn == .player2 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    if let move = AIModule.getNextMove(state: state) {
                        if let fromIdx = move.1 {
                            state.selectedNodeIndex = fromIdx
                        }
                        handleNodeTap(index: move.0, state: state)
                    }
                }
            }
        }
    }
    
    private static func checkGameOver(state: GameState) -> Bool {
        // Only check after placement phase
        guard state.player1PiecesLeftToPlace == 0 && state.player2PiecesLeftToPlace == 0 else { return false }
        
        let currentPlayer = state.turn
        let piecesOnBoard = currentPlayer == .player1 ? state.player1PiecesOnBoard : state.player2PiecesOnBoard
        
        // Condition 1: Less than 3 pieces
        if piecesOnBoard < 3 {
            state.message = "Game Over! Player \(currentPlayer == .player1 ? "2" : "1") Wins!"
            HapticManager.shared.playWin()
            AdMobManager.shared.showInterstitial()
            return true
        }
        
        // ... (Condition 2)
        if !hasMoves {
            state.message = "No moves! Player \(currentPlayer == .player1 ? "2" : "1") Wins!"
            HapticManager.shared.playWin()
            AdMobManager.shared.showInterstitial()
            return true
        }
        
        return false
    }
}
