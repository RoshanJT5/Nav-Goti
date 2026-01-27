import SwiftUI

struct MatchmakingView: View {
    @ObservedObject var state: GameState
    @Environment(\.dismiss) var dismiss
    @State private var isSearching = true
    @State private var pulseScale: CGFloat = 1.0
    
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            
            VStack(spacing: 40) {
                Text("MATCHMAKING")
                    .font(.custom("Inter-Bold", size: 32))
                    .foregroundColor(AppTheme.neonCyan)
                    .shadow(color: AppTheme.neonCyan, radius: 10)
                
                ZStack {
                    Circle()
                        .stroke(AppTheme.neonCyan.opacity(0.3), lineWidth: 2)
                        .frame(width: 200, height: 200)
                        .scaleEffect(pulseScale)
                        .opacity(2.0 - pulseScale)
                    
                    Circle()
                        .fill(AppTheme.neonCyan.opacity(0.1))
                        .frame(width: 100, height: 100)
                        .overlay(
                            Image(systemName: "antenna.radiowaves.left.and.right")
                                .font(.system(size: 40))
                                .foregroundColor(AppTheme.neonCyan)
                        )
                }
                .onAppear {
                    withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: false)) {
                        pulseScale = 2.0
                    }
                }
                
                Text(isSearching ? "Searching for opponent..." : "Match Found!")
                    .font(.headline)
                    .foregroundColor(.white)
                
                Button("CANCEL") {
                    dismiss()
                }
                .foregroundColor(.red)
                .padding(.top, 20)
            }
        }
        .onAppear {
            SupabaseService.shared.startMatchmaking(userId: state.userId, name: "NeonPlayer") { roomId, side in
                state.roomId = roomId
                state.playerSide = side
                state.mode = .online
                isSearching = false
                
                // Transition to game after short delay
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    // Logic to trigger navigation back or to board
                }
            }
        }
    }
}
