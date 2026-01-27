import Foundation

enum PieceType: String, Codable {
    case player1 // e.g. Neon Cyan
    case player2 // e.g. Neon Pink
}

struct Node: Identifiable, Hashable {
    let id: Int
    let connections: [Int]
    var piece: PieceType?
}

struct Board {
    static let nodes: [Int: CGPoint] = [
        0:  CGPoint(x: 0.0,  y: 0.0),  1:  CGPoint(x: 0.5,  y: 0.0),  2:  CGPoint(x: 1.0,  y: 0.0),
        3:  CGPoint(x: 0.15, y: 0.15), 4:  CGPoint(x: 0.5,  y: 0.15), 5:  CGPoint(x: 0.85, y: 0.15),
        6:  CGPoint(x: 0.3,  y: 0.3),  7:  CGPoint(x: 0.5,  y: 0.3),  8:  CGPoint(x: 0.7,  y: 0.3),
        9:  CGPoint(x: 0.0,  y: 0.5),  10: CGPoint(x: 0.15, y: 0.5),  11: CGPoint(x: 0.3,  y: 0.5),
        12: CGPoint(x: 0.7,  y: 0.5),  13: CGPoint(x: 0.85, y: 0.5),  14: CGPoint(x: 1.0,  y: 0.5),
        15: CGPoint(x: 0.3,  y: 0.7),  16: CGPoint(x: 0.5,  y: 0.7),  17: CGPoint(x: 0.7,  y: 0.7),
        18: CGPoint(x: 0.15, y: 0.85), 19: CGPoint(x: 0.5,  y: 0.85), 20: CGPoint(x: 0.85, y: 0.85),
        21: CGPoint(x: 0.0,  y: 1.0),  22: CGPoint(x: 0.5,  y: 1.0),  23: CGPoint(x: 1.0,  y: 1.0)
    ]
    
    // Standard Nine Men's Morris 24-node grid
    static let adjacencyList: [Int: [Int]] = [
        0: [1, 9], 1: [0, 2, 4], 2: [1, 14],
        3: [4, 10], 4: [1, 3, 5, 7], 5: [4, 13],
        6: [7, 11], 7: [4, 6, 8], 8: [7, 12],
        9: [0, 10, 21], 10: [3, 9, 11, 18], 11: [6, 10, 15],
        12: [8, 13, 17], 13: [5, 12, 14, 20], 14: [2, 13, 23],
        15: [11, 16], 16: [15, 17, 19], 17: [12, 16],
        18: [10, 19], 19: [16, 18, 20, 22], 20: [13, 19],
        21: [9, 22], 22: [19, 21, 23], 23: [14, 22]
    ]
}
