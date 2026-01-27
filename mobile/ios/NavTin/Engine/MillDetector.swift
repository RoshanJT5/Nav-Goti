import Foundation

struct MillDetector {
    // All possible 3-in-a-row combinations in Nine Men's Morris
    static let mills: [[Int]] = [
        // Horizontal
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [9, 10, 11], [13, 14, 15], // Middle row split
        [16, 17, 18], [19, 20, 21], [22, 23, 24], // Wait, indexing check...
    ]
}

/* 
Wait, let's re-verify the standard 24-node indexing.
0 -- 1 -- 2
|    |    |
| 3--4--5 |
| |     | |
| | 6-7-8 |
9-10-11   12-13-14
| | 15-16-17 |
| |     |    |
| 18-19-20   |
|     |      |
21---22-----23

Let's use this indexing:
Row 1: 0, 1, 2
Row 2: 3, 4, 5
Row 3: 6, 7, 8
Row 4: 9, 10, 11 | 12, 13, 14
Row 5: 15, 16, 17
Row 6: 18, 19, 20
Row 7: 21, 22, 23

Mills:
H: [0,1,2], [3,4,5], [6,7,8], [9,10,11], [12,13,14], [15,16,17], [18,19,20], [21,22,23]
V: [0,9,21], [3,10,18], [6,11,15], [1,4,7], [16,19,22], [8,12,17], [5,13,20], [2,14,23]
*/

struct StandardMills {
    static let horizontal: [[Int]] = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [9, 10, 11], [12, 13, 14],
        [15, 16, 17], [18, 19, 20], [21, 22, 23]
    ]
    static let vertical: [[Int]] = [
        [0, 9, 21], [3, 10, 18], [6, 11, 15],
        [1, 4, 7], [16, 19, 22],
        [8, 12, 17], [5, 13, 20], [2, 14, 23]
    ]
    static let all = horizontal + vertical
}

struct MillDetector {
    static func isPartOfMill(nodeIndex: Int, positions: [Int: PieceType], player: PieceType) -> Bool {
        for mill in StandardMills.all {
            if mill.contains(nodeIndex) {
                if mill.allSatisfy({ positions[$0] == player }) {
                    return true
                }
            }
        }
        return false
    }
}
