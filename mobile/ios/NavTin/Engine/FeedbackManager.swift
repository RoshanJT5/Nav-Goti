import UIKit
import AVFoundation

class AudioManager: NSObject {
    static let shared = AudioManager()
    private var players: [String: AVAudioPlayer] = [:]
    
    func playSound(_ name: String) {
        // Logic for playing sound from bundle
        print("Audio: Playing SFX \(name)")
    }
}

class HapticManager {
    static let shared = HapticManager()
    
    private let light = UIImpactFeedbackGenerator(style: .light)
    private let medium = UIImpactFeedbackGenerator(style: .medium)
    private let heavy = UIImpactFeedbackGenerator(style: .heavy)
    private let success = UINotificationFeedbackGenerator()
    
    func playSelection() {
        light.impactOccurred()
    }
    
    func playMove() {
        medium.impactOccurred()
    }
    
    func playMill() {
        heavy.impactOccurred()
    }
    
    func playWin() {
        success.notificationOccurred(.success)
    }
}
