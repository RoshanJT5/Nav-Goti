import SwiftUI

struct BoardView: View {
    @ObservedObject var state: GameState
    let boardSize: CGFloat = 350
    
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
                    drawPieces(context: context, size: size)
                }
                .frame(width: boardSize, height: boardSize)
                .gesture(
                    SpatialTapGesture()
                        .onEnded { value in
                            handleTap(at: value.location)
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
                // To avoid double drawing, only draw if endNode > startNode
                if endNode > startNode {
                    guard let endCoord = Board.nodes[endNode] else { continue }
                    let end = CGPoint(x: endCoord.x * size.width, y: endCoord.y * size.height)
                    
                    var path = Path()
                    path.move(to: start)
                    path.addLine(to: end)
                    
                    context.stroke(path, with: .color(AppTheme.neonBorder.opacity(0.5)), lineWidth: 2)
                    // Glow effect
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
    
    private func drawPieces(context: GraphicsContext, size: CGSize) {
        for (index, type) in state.piecePositions {
            guard let coord = Board.nodes[index] else { continue }
            let point = CGPoint(x: coord.x * size.width, y: coord.y * size.height)
            let color = type == .player1 ? AppTheme.neonCyan : AppTheme.neonPink
            
            // Outer glow
            let glowRect = CGRect(x: point.x - 15, y: point.y - 15, width: 30, height: 30)
            context.addFilter(.shadow(color: color, radius: 8))
            context.fill(Path(ellipseIn: glowRect), with: .color(color.opacity(0.4)))
            
            // Core piece
            let pieceRect = CGRect(x: point.x - 10, y: point.y - 10, width: 20, height: 20)
            context.fill(Path(ellipseIn: pieceRect), with: .color(color))
            
            // Selected highlight
            if state.selectedNodeIndex == index {
                var selectionPath = Path()
                selectionPath.addEllipse(in: pieceRect.insetBy(dx: -4, dy: -4))
                context.stroke(selectionPath, with: .color(.white), lineWidth: 2)
            }
        }
    }
    
    private func handleTap(at location: CGPoint) {
        let threshold: CGFloat = 20
        for (index, coord) in Board.nodes {
            let point = CGPoint(x: coord.x * boardSize, y: coord.y * boardSize)
            let dist = sqrt(pow(point.x - location.x, 2) + pow(point.y - location.y, 2))
            if dist < threshold {
                GameEngine.handleNodeTap(index: index, state: state)
                break
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
