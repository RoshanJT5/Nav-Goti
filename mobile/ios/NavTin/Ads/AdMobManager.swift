import Foundation
import AppTrackingTransparency
import AdSupport

class AdMobManager: NSObject, ObservableObject {
    static let shared = AdMobManager()
    
    @Published var isATTAuthorized = false
    
    // Test IDs (Replace with real ones in production)
    let bannerId = "ca-app-pub-3940256099942544/2934735716"
    let interstitialId = "ca-app-pub-3940256099942544/4411468910"
    
    private var lastInterstitialTime: Date?
    private let frequencyCap: TimeInterval = 300 // 5 minutes
    
    func requestATT() {
        ATTrackingManager.requestTrackingAuthorization { status in
            DispatchQueue.main.async {
                self.isATTAuthorized = (status == .authorized)
                print("ATT Status: \(status)")
                // Load ads after tracking decision
                self.loadInterstitial()
            }
        }
    }
    
    func loadInterstitial() {
        print("AdMob: Loading Interstitial...")
        // In real app: GADInterstitialAd.load(...)
    }
    
    func showInterstitial() {
        if let lastTime = lastInterstitialTime, Date().timeIntervalSince(lastTime) < frequencyCap {
            print("AdMob: Interstitial capped. Skipping.")
            return
        }
        
        print("AdMob: Showing Interstitial Ad")
        lastInterstitialTime = Date()
        // In real app: interstitial?.present(fromRootViewController: ...)
    }
}
