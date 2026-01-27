package com.navtin.engine

enum class PieceType {
    PLAYER_1, PLAYER_2
}

data class Node(
    val id: Int,
    val connections: List<Int>,
    var piece: PieceType? = null
)

object Board {
    data class Point(val x: Float, val y: Float)
    
    val nodes: Map<Int, Point> = mapOf(
        0 to Point(0.0f, 0.0f),  1 to Point(0.5f, 0.0f),  2 to Point(1.0f, 0.0f),
        3 to Point(0.15f, 0.15f), 4 to Point(0.5f, 0.15f), 5 to Point(0.85f, 0.15f),
        6 to Point(0.3f, 0.3f),  7 to Point(0.5f, 0.3f),  8 to Point(0.7f, 0.3f),
        9 to Point(0.0f, 0.5f),  10 to Point(0.15f, 0.5f),  11 to Point(0.3f, 0.5f),
        12 to Point(0.7f, 0.5f),  13 to Point(0.85f, 0.5f),  14 to Point(1.0f, 0.5f),
        15 to Point(0.3f, 0.7f),  16 to Point(0.5f, 0.7f),  17 to Point(0.7f, 0.7f),
        18 to Point(0.15f, 0.85f), 19 to Point(0.5f, 0.85f), 20 to Point(0.85f, 0.85f),
        21 to Point(0.0f, 1.0f),  22 to Point(0.5f, 1.0f),  23 to Point(1.0f, 1.0f)
    )
    
    // Standard Nine Men's Morris 24-node grid
    val adjacencyList: Map<Int, List<Int>> = mapOf(
        0 to listOf(1, 9), 1 to listOf(0, 2, 4), 2 to listOf(1, 14),
        3 to listOf(4, 10), 4 to listOf(1, 3, 5, 7), 5 to listOf(4, 13),
        6 to listOf(7, 11), 7 to listOf(4, 6, 8), 8 to listOf(7, 12),
        9 to listOf(0, 10, 21), 10 to listOf(3, 9, 11, 18), 11 to listOf(6, 10, 15),
        12 to listOf(8, 13, 17), 13 to listOf(5, 12, 14, 20), 14 to listOf(2, 13, 23),
        15 to listOf(11, 16), 16 to listOf(15, 17, 19), 17 to listOf(12, 16),
        18 to listOf(10, 19), 19 to listOf(16, 18, 20, 22), 20 to listOf(13, 19),
        21 to listOf(9, 22), 22 to listOf(19, 21, 23), 23 to listOf(14, 22)
    )
}
