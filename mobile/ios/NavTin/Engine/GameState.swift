import Foundation

enum GamePhase {
    case placing
    case moving
    case flying
}

enum PlayerTurn {
    case player1
    case player2
}

enum GameMode {
    case vsAI
    case local
    case online
}

enum PlayerSide: String {
    case white
    case black
}

class GameState: ObservableObject {
    @Published var mode: GameMode = .local
    @Published var aiDifficulty: AIDifficulty = .medium
    @Published var phase: GamePhase = .placing
    @Published var turn: PlayerTurn = .player1
    @Published var piecePositions: [Int: PieceType] = [:]
    
    // Online State
    @Published var roomId: String? = nil
    @Published var playerSide: PlayerSide? = nil
    @Published var userId: String = UUID().uuidString
    @Published var opponentName: String = "Opponent"
    @Published var isMyTurn: Bool {
        guard mode == .online else { return true }
        if playerSide == .white && turn == .player1 { return true }
        if playerSide == .black && turn == .player2 { return true }
        return false
    }
    
    @Published var player1PiecesLeftToPlace = 9
    @Published var player2PiecesLeftToPlace = 9
    
    @Published var player1PiecesOnBoard = 0
    @Published var player2PiecesOnBoard = 0
    
    @Published var isRemovingPiece = false
    
    // UI state
    @Published var selectedNodeIndex: Int? = nil
    @Published var message: String = "Player 1: Place a piece"
    
    var currentPlayer: PlayerTurn { turn }
    var currentPieceType: PieceType { turn == .player1 ? .player1 : .player2 }
}
