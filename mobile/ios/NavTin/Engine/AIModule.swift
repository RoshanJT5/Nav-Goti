import Foundation

class AIModule {
    struct MoveAction {
        let fromType: GamePhase
        let nodeIndex: Int
        let fromIndex: Int?
    }

    static func getNextMove(state: GameState) -> (Int, Int?)? {
        let difficulty = state.aiDifficulty
        let depth: Int
        
        switch difficulty {
        case .easy: depth = 1
        case .medium: depth = 3
        case .hard: depth = 5
        }
        
        let bestMove = minimax(state: state, depth: depth, isMaximizing: true, alpha: -1000000, beta: 1000000)
        return bestMove.action
    }
    
    // Simplified heuristic function
    private static func evaluate(state: GameState) -> Int {
        let aiPieces = state.player2PiecesOnBoard
        let humanPieces = state.player1PiecesOnBoard
        
        var score = (aiPieces - humanPieces) * 100
        
        // Bonus for mills
        let aiMills = countMills(for: .player2, positions: state.piecePositions)
        let humanMills = countMills(for: .player1, positions: state.piecePositions)
        score += (aiMills - humanMills) * 50
        
        // Mobility bonus
        let aiMoves = countPossibleMoves(for: .player2, state: state)
        let humanMoves = countPossibleMoves(for: .player1, state: state)
        score += (aiMoves - humanMoves) * 10
        
        return score
    }
    
    private static func minimax(state: GameState, depth: Int, isMaximizing: Bool, alpha: Int, beta: Int) -> (score: Int, action: (Int, Int?)?) {
        if depth == 0 || isGameOver(state) {
            return (evaluate(state: state), nil)
        }
        
        var currentAlpha = alpha
        var currentBeta = beta
        
        if isMaximizing {
            var maxEval = -1000000
            var bestAction: (Int, Int?)? = nil
            
            let possibleMoves = getAllMoves(for: .player2, state: state)
            for move in possibleMoves {
                let nextState = simulateMove(move, state: state)
                let eval = minimax(state: nextState, depth: depth - 1, isMaximizing: false, alpha: currentAlpha, beta: currentBeta).score
                if eval > maxEval {
                    maxEval = eval
                    bestAction = move
                }
                currentAlpha = max(currentAlpha, eval)
                if currentBeta <= currentAlpha { break }
            }
            return (maxEval, bestAction)
        } else {
            var minEval = 1000000
            var bestAction: (Int, Int?)? = nil
            
            let possibleMoves = getAllMoves(for: .player1, state: state)
            for move in possibleMoves {
                let nextState = simulateMove(move, state: state)
                let eval = minimax(state: nextState, depth: depth - 1, isMaximizing: true, alpha: currentAlpha, beta: currentBeta).score
                if eval < minEval {
                    minEval = eval
                    bestAction = move
                }
                currentBeta = min(currentBeta, eval)
                if currentBeta <= currentAlpha { break }
            }
            return (minEval, bestAction)
        }
    }
    
    // Helpers (Internal simulation logic)
    private static func getAllMoves(for player: PlayerTurn, state: GameState) -> [(Int, Int?)] {
        var moves: [(Int, Int?)] = []
        let type = player == .player1 ? PieceType.player1 : PieceType.player2
        
        if state.phase == .placing {
            for i in 0...23 {
                if state.piecePositions[i] == nil { moves.append((i, nil)) }
            }
        } else {
            let playerIndices = state.piecePositions.filter { $0.value == type }.map { $0.key }
            for fromIdx in playerIndices {
                if state.phase == .flying || (player == .player1 ? state.player1PiecesOnBoard == 3 : state.player2PiecesOnBoard == 3) {
                    for toIdx in 0...23 {
                        if state.piecePositions[toIdx] == nil { moves.append((toIdx, fromIdx)) }
                    }
                } else {
                    for toIdx in Board.adjacencyList[fromIdx] ?? [] {
                        if state.piecePositions[toIdx] == nil { moves.append((toIdx, fromIdx)) }
                    }
                }
            }
        }
        return moves
    }
    
    private static func simulateMove(_ move: (Int, Int?), state: GameState) -> GameState {
        // Deep copy of state for simulation
        let newState = GameState()
        newState.piecePositions = state.piecePositions
        newState.player1PiecesOnBoard = state.player1PiecesOnBoard
        newState.player2PiecesOnBoard = state.player2PiecesOnBoard
        newState.player1PiecesLeftToPlace = state.player1PiecesLeftToPlace
        newState.player2PiecesLeftToPlace = state.player2PiecesLeftToPlace
        newState.phase = state.phase
        newState.turn = state.turn
        
        let nodeIndex = move.0
        let fromIndex = move.1
        let type = newState.turn == .player1 ? PieceType.player1 : PieceType.player2
        
        if let from = fromIndex {
            newState.piecePositions[from] = nil
        } else {
            if newState.turn == .player1 { newState.player1PiecesLeftToPlace -= 1; newState.player1PiecesOnBoard += 1 }
            else { newState.player2PiecesLeftToPlace -= 1; newState.player2PiecesOnBoard += 1 }
        }
        newState.piecePositions[nodeIndex] = type
        
        // Handle mill removal in simulation (very simple: remove closest opponent piece)
        if MillDetector.isPartOfMill(nodeIndex: nodeIndex, positions: newState.piecePositions, player: type) {
            let opponent = newState.turn == .player1 ? PieceType.player2 : PieceType.player1
            if let targetIdx = newState.piecePositions.first(where: { $0.value == opponent })?.key {
                newState.piecePositions[targetIdx] = nil
                if opponent == .player1 { newState.player1PiecesOnBoard -= 1 }
                else { newState.player2PiecesOnBoard -= 1 }
            }
        }
        
        newState.turn = newState.turn == .player1 ? .player2 : .player1
        if newState.player1PiecesLeftToPlace == 0 && newState.player2PiecesLeftToPlace == 0 {
            newState.phase = .moving
        }
        return newState
    }
    
    private static func countMills(for player: PlayerTurn, positions: [Int: PieceType]) -> Int {
        let type = player == .player1 ? PieceType.player1 : PieceType.player2
        var count = 0
        for mill in StandardMills.all {
            if mill.allSatisfy({ positions[$0] == type }) { count += 1 }
        }
        return count
    }
    
    private static func countPossibleMoves(for player: PlayerTurn, state: GameState) -> Int {
        return getAllMoves(for: player, state: state).count
    }
    
    private static func isGameOver(_ state: GameState) -> Bool {
        if state.player1PiecesLeftToPlace > 0 || state.player2PiecesLeftToPlace > 0 { return false }
        return state.player1PiecesOnBoard < 3 || state.player2PiecesOnBoard < 3
    }
}
