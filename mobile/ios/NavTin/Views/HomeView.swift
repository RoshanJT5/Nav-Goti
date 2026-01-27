import SwiftUI

struct HomeView: View {
    @StateObject var state = GameState()
    @State var showGame = false
    @State var showMatchmaking = false
    
    var body: some View {
        NavigationView {
            ZStack {
                AppTheme.background.ignoresSafeArea()
                
                VStack(spacing: 30) {
                    // Logo Section
                    VStack {
                        Text("NAV-TIN")
                            .font(.custom("Inter-Bold", size: 64))
                            .foregroundColor(AppTheme.neonCyan)
                            .shadow(color: AppTheme.neonCyan, radius: 20)
                        
                        Text("Cyber Strategy")
                            .font(.headline)
                            .foregroundColor(.white.opacity(0.6))
                            .tracking(5)
                    }
                    .padding(.top, 50)
                    
                    Spacer()
                    
                    // Buttons
                    VStack(spacing: 20) {
                        MenuButton(title: "PLAY VS AI", color: AppTheme.neonCyan) {
                            state.mode = .vsAI
                            startGame()
                        }
                        
                        MenuButton(title: "LOCAL 1V1", color: AppTheme.neonPink) {
                            state.mode = .local
                            startGame()
                        }
                        
                        MenuButton(title: "ONLINE MATCH", color: AppTheme.neonBorder) {
                            showMatchmaking = true
                        }
                        
                        MenuButton(title: "SETTINGS", color: .gray) {
                            // Settings
                        }
                    }
                    .padding(.horizontal, 40)
                    
                    Spacer()
                    
                    // Footer
                    Text("VER 1.0.0")
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.3))
                        .padding(.bottom, 20)
                }
                
                // Banner Ad Placeholder
                VStack {
                    Text("AD BANNER")
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.3))
                        .frame(maxWidth: .infinity, maxHeight: 50)
                        .background(Color.white.opacity(0.05))
                    
                    Text("VER 1.0.0")
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.3))
                        .padding(.bottom, 20)
                }
            }
            .onAppear {
                AdMobManager.shared.requestATT()
            }
            .fullScreenCover(isPresented: $showGame) {
                BoardView(state: state)
            }
            .fullScreenCover(isPresented: $showMatchmaking) {
                MatchmakingView(state: state)
            }
        }
    }
    
    private func startGame() {
        // Reset state
        state.piecePositions = [:]
        state.player1PiecesOnBoard = 0
        state.player2PiecesOnBoard = 0
        state.player1PiecesLeftToPlace = 9
        state.player2PiecesLeftToPlace = 9
        state.phase = .placing
        state.turn = .player1
        state.isRemovingPiece = false
        state.message = "Player 1: Place a piece"
        
        showGame = true
    }
}

struct MenuButton: View {
    let title: String
    let color: Color
    var isDisabled: Bool = false
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline.bold())
                .foregroundColor(isDisabled ? .gray : .white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isDisabled ? Color.gray : color, lineWidth: 2)
                        .background(isDisabled ? Color.clear : color.opacity(0.1))
                )
                .shadow(color: isDisabled ? .clear : color, radius: 5)
        }
        .disabled(isDisabled)
    }
}
