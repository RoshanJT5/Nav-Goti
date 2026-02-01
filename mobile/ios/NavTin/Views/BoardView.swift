import SwiftUI

struct BoardView: View {
    @ObservedObject var state: GameState
    let boardSize: CGFloat = 350
    
    @State private var dragOffset: CGPoint = .zero
    @State private var draggedNodeIndex: Int? = nil
    @State private var isDragging: Bool = false
    
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            
            VStack(spacing: 40) {
                // Header
                VStack {
                    Text("NAV-TIN")
                        .font(.custom("Inter-Bold", size: 32))
                        .foregroundColor(AppTheme.neonCyan)
                        .shadow(color: AppTheme.neonCyan, radius: 10)
                    
                    Text(state.message)
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.8))
                }
                
                // Game Board
                Canvas { context, size in
                    drawBoardLines(context: context, size: size)
                    drawNodes(context: context, size: size)
                    drawMoveIndicators(context: context, size: size)
                    drawPieces(context: context, size: size)
                    
                    if isDragging, let draggedIdx = draggedNodeIndex {
                        drawDraggedPiece(context: context, index: draggedIdx)
                    }
                }
                .frame(width: boardSize, height: boardSize)
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { value in
                            handleDragChange(value)
                        }
                        .onEnded { value in
                            handleDragEnd(value)
                        }
                )
                
                // Footer / Stats
                HStack(spacing: 50) {
                    PlayerStatView(name: "P1", count: state.player1PiecesOnBoard, color: AppTheme.neonCyan, isTurn: state.turn == .player1)
                    PlayerStatView(name: "P2", count: state.player2PiecesOnBoard, color: AppTheme.neonPink, isTurn: state.turn == .player2)
                }
            }
        }
    }
    
    private func drawBoardLines(context: GraphicsContext, size: CGSize) {
        for (startNode, neighbors) in Board.adjacencyList {
            guard let startCoord = Board.nodes[startNode] else { continue }
            let start = CGPoint(x: startCoord.x * size.width, y: startCoord.y * size.height)
            
            for endNode in neighbors {
                if endNode > startNode {
                    guard let endCoord = Board.nodes[endNode] else { continue }
                    let end = CGPoint(x: endCoord.x * size.width, y: endCoord.y * size.height)
                    
                    var path = Path()
                    path.move(to: start)
                    path.addLine(to: end)
                    
                    context.stroke(path, with: .color(AppTheme.neonBorder.opacity(0.5)), lineWidth: 2)
                    context.addFilter(.shadow(color: AppTheme.neonBorder, radius: 3))
                    context.stroke(path, with: .color(AppTheme.neonBorder), lineWidth: 1)
                }
            }
        }
    }
    
    private func drawNodes(context: GraphicsContext, size: CGSize) {
        for (_, coord) in Board.nodes {
            let point = CGPoint(x: coord.x * size.width, y: coord.y * size.height)
            let rect = CGRect(x: point.x - 4, y: point.y - 4, width: 8, height: 8)
            context.fill(Path(ellipseIn: rect), with: .color(.white.opacity(0.2)))
        }
    }
    
    private func drawMoveIndicators(context: GraphicsContext, size: CGSize) {
        guard let selectedIdx = draggedNodeIndex ?? state.selectedNodeIndex else { return }
        
        let canFly = (state.turn == .player1 && state.player1PiecesOnBoard == 3) ||
                     (state.turn == .player2 && state.player2PiecesOnBoard == 3)
        
        if canFly {
            // Show all empty nodes for flying
            for (idx, coord) in Board.nodes {
                if state.piecePositions[idx] == nil {
                    drawIndicator(at: coord, context: context, size: size)
                }
            }
        } else if let neighbors = Board.adjacencyList[selectedIdx] {
            for neighbor in neighbors {
                if state.piecePositions[neighbor] == nil {
                    guard let coord = Board.nodes[neighbor] else { continue }
                    drawIndicator(at: coord, context: context, size: size)
                }
            }
        }
    }
    
    private func drawIndicator(at coord: NodeCoord, context: GraphicsContext, size: CGSize) {
        let point = CGPoint(x: coord.x * size.width, y: coord.y * size.height)
        let rect = CGRect(x: point.x - 15, y: point.y - 15, width: 30, height: 30)
        context.stroke(Path(ellipseIn: rect), with: .color(.green.opacity(0.6)), lineWidth: 2)
        context.fill(Path(ellipseIn: rect.insetBy(dx: 10, dy: 10)), with: .color(.green.opacity(0.3)))
    }
    
    private func drawPieces(context: GraphicsContext, size: CGSize) {
        for (index, type) in state.piecePositions {
            if isDragging && index == draggedNodeIndex { continue }
            
            guard let coord = Board.nodes[index] else { continue }
            let point = CGPoint(x: coord.x * size.width, y: coord.y * size.height)
            let color = type == .player1 ? AppTheme.neonCyan : AppTheme.neonPink
            
            drawPieceAt(point: point, color: color, isSelected: state.selectedNodeIndex == index, context: context)
        }
    }
    
    private func drawDraggedPiece(context: GraphicsContext, index: Int) {
        let type = state.piecePositions[index]!
        let color = type == .player1 ? AppTheme.neonCyan : AppTheme.neonPink
        drawPieceAt(point: dragOffset, color: color, isSelected: true, context: context, isDragging: true)
    }
    
    private func drawPieceAt(point: CGPoint, color: Color, isSelected: Bool, context: GraphicsContext, isDragging: Bool = false) {
        let size: CGFloat = isDragging ? 30 : 20
        let glowSize: CGFloat = size + 10
        
        let glowRect = CGRect(x: point.x - glowSize/2, y: point.y - glowSize/2, width: glowSize, height: glowSize)
        context.addFilter(.shadow(color: color, radius: isDragging ? 12 : 8))
        context.fill(Path(ellipseIn: glowRect), with: .color(color.opacity(0.4)))
        
        let pieceRect = CGRect(x: point.x - size/2, y: point.y - size/2, width: size, height: size)
        context.fill(Path(ellipseIn: pieceRect), with: .color(color))
        
        if isSelected {
            var selectionPath = Path()
            selectionPath.addEllipse(in: pieceRect.insetBy(dx: -4, dy: -4))
            context.stroke(selectionPath, with: .color(.white), lineWidth: 2)
        }
    }
    
    private func handleDragChange(_ value: DragGesture.Value) {
        if !isDragging {
            let threshold: CGFloat = 30
            for (index, coord) in Board.nodes {
                let point = CGPoint(x: coord.x * boardSize, y: coord.y * boardSize)
                let dist = sqrt(pow(point.x - value.startLocation.x, 2) + pow(point.y - value.startLocation.y, 2))
                if dist < threshold {
                    if state.piecePositions[index] == (state.turn == .player1 ? .player1 : .player2) {
                        if state.phase == .moving || state.phase == .flying {
                            draggedNodeIndex = index
                            isDragging = true
                            state.selectedNodeIndex = index // Select for indicators
                            HapticManager.shared.playSelection()
                        }
                    }
                    break
                }
            }
        }
        
        if isDragging {
            dragOffset = value.location
        }
    }
    
    private func handleDragEnd(_ value: DragGesture.Value) {
        if isDragging {
            let threshold: CGFloat = 30
            var closestIdx: Int? = nil
            var minDist: CGFloat = .infinity
            
            for (index, coord) in Board.nodes {
                let point = CGPoint(x: coord.x * boardSize, y: coord.y * boardSize)
                let dist = sqrt(pow(point.x - value.location.x, 2) + pow(point.y - value.location.y, 2))
                if dist < threshold && dist < minDist {
                    closestIdx = index
                    minDist = dist
                }
            }
            
            if let targetIdx = closestIdx {
                GameEngine.handleNodeTap(index: targetIdx, state: state)
            }
            
            isDragging = false
            draggedNodeIndex = nil
        } else {
            // Handle as simple tap
            let threshold: CGFloat = 30
            for (index, coord) in Board.nodes {
                let point = CGPoint(x: coord.x * boardSize, y: coord.y * boardSize)
                let dist = sqrt(pow(point.x - value.location.x, 2) + pow(point.y - value.location.y, 2))
                if dist < threshold {
                    GameEngine.handleNodeTap(index: index, state: state)
                    break
                }
            }
        }
    }
}

struct PlayerStatView: View {
    let name: String
    let count: Int
    let color: Color
    let isTurn: Bool
    
    var body: some View {
        VStack {
            Circle()
                .fill(color)
                .frame(width: 40, height: 40)
                .overlay(Circle().stroke(Color.white, lineWidth: isTurn ? 3 : 0))
                .shadow(color: color, radius: isTurn ? 10 : 0)
            
            Text(name)
                .font(.caption)
                .foregroundColor(.white)
            
            Text("\(count) Pieces")
                .font(.title3.bold())
                .foregroundColor(.white)
        }
    }
}
