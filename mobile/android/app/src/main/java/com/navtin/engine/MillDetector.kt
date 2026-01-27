package com.navtin.engine

object StandardMills {
    val horizontal = listOf(
        listOf(0, 1, 2), listOf(3, 4, 5), listOf(6, 7, 8),
        listOf(9, 10, 11), listOf(12, 13, 14),
        listOf(15, 16, 17), listOf(18, 19, 20), listOf(21, 22, 23)
    )
    val vertical = listOf(
        listOf(0, 9, 21), listOf(3, 10, 18), listOf(6, 11, 15),
        listOf(1, 4, 7), listOf(16, 19, 22),
        listOf(8, 12, 17), listOf(5, 13, 20), listOf(2, 14, 23)
    )
    val all = horizontal + vertical
}

object MillDetector {
    fun isPartOfMill(nodeIndex: Int, positions: Map<Int, PieceType>, player: PieceType): Boolean {
        for (mill in StandardMills.all) {
            if (nodeIndex in mill) {
                if (mill.all { positions[it] == player }) {
                    return true
                }
            }
        }
        return false
    }
}
