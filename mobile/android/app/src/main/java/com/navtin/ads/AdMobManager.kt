package com.navtin.ads

import android.content.Context
import java.util.Date

object AdMobManager {
    // Test IDs
    const val BANNER_ID = "ca-app-pub-3940256099942544/6300978111"
    const val INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712"
    
    private var lastInterstitialTime: Long = 0
    private const val FREQUENCY_CAP_MS = 300_000L // 5 minutes

    fun initialize(context: Context) {
        println("AdMob: Initializing SDK")
        // MobileAds.initialize(context)
    }

    fun showInterstitial(context: Context) {
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastInterstitialTime < FREQUENCY_CAP_MS) {
            println("AdMob: Interstitial capped. Skipping.")
            return
        }

        println("AdMob: Showing Interstitial Ad")
        lastInterstitialTime = currentTime
        // In real app: mInterstitialAd?.show(activity)
    }
}
