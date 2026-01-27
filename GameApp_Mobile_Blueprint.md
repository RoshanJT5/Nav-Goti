# GameApp_Mobile_Blueprint.md

## 1. App Overview
- **App Name**: NAV-TIN
- **One-line Description**: A cyberpunk-infused, competitive Nine Men's Morris adaptation featuring cross-platform multiplayer and intense strategy battles.
- **Genre**: Strategy Board Game / Online Multiplayer
- **Target Audience**: Strategy game enthusiasts, board game lovers, and casual competitive gamers (Ages 12+).
- **Core Value Proposition**: NAV-TIN modernizes the ancient game of Nine Men's Morris with a stunning "Cyber Neon" aesthetic, seamless online matchmaking, and a premium native mobile experience that feels fluid and responsive.

## 2. Feature List (MVP)
The Minimum Viable Product (MVP) will faithfully replicate the web experience while leveraging native capabilities.

- **Game Modes**:
  - **vs Computer (AI)**: Play offline against an adaptive AI (Easy, Medium, Hard).
  - **Local Multiplayer**: Hot-seat mode for two players sharing a single device.
  - **Online Random Match**: Quick matchmaking with players worldwide using Supabase Realtime.
  - **Private Room (Play with Friends)**: Create/Join custom lobbies via 6-digit codes.
- **Customization**:
  - **Themes**: Switch between "Classic Wood" and the signature "Cyber Neon" (Dark Mode).
  - **Game Pieces**: Unlockable skins for pieces (e.g., Neon Orbs vs Classic Chips).
- **Settings**:
  - Haptic Feedback (Vibration on moves/mills).
  - Sound Effects & Background Music controls.
  - Language support.
- **Tutorial**: Interactive "Quick Rules" overlay or walkthrough for new players.

## 3. Screen List (Mobile)
Designed for portrait/landscape adaptability.

1.  **Splash Screen**: Animated NAV-TIN logo with neon glow effects.
2.  **Home Menu**:
    - "Play Online" (Main CTA)
    - "vs Computer"
    - "Local 1v1"
    - "Profile/Settings" icon
3.  **Mode Selection Overlay**: Difficulty slider for AI, or "Create/Join" for Multiplayer.
4.  **Matchmaking Screen**: "Searching for opponent..." pulsing animation with cancel option.
5.  **Room Code Screen**: Input field for joining friends, display Code for hosting.
6.  **Game Board Screen**:
    - **Header**: Player avatars, turn timer, "Mill" indicators.
    - **Center**: The 9-Men's Morris Board (Native Canvas/Shape rendering).
    - **Footer**: Chat bubble (Online only), Surrender button, Emotes.
7.  **Game Result Screen**: "Victory" or "Defeat" animation, Play Again button, Ad placement.
8.  **Settings Screen**: Toggles for Audio, Haptics, Theme selection, Privacy Policy.
9.  **Ads Wrapper**: Native overlays for interstitial/rewarded ads.

## 4. Game Logic
The core "Nine Men's Morris" ruleset must be implemented natively.

- **Phases**:
  1.  **Placing**: Each player places 9 pieces one by one.
  2.  **Moving**: Slide pieces to adjacent empty nodes.
  3.  **Flying**: When reduced to 3 pieces, a player can move to *any* empty node.
- **Mill Mechanic**:
  - If 3 pieces align (horizontal/vertical), a "Mill" is formed.
  - Action: Player removes one opponent piece (cannot remove pieces currently in a Mill unless no other option).
- **Win/Lose**:
  - Win: Opponent has < 3 pieces OR Opponent has 0 valid moves.
- **Draw**:
  - Repetition of position (3-fold).
  - No capture for 50 moves (optional rule).

## 5. Online Multiplayer Architecture
We will leverage the existing **Supabase** backend but implement client-side logic in native code.

- **Connection**:
  - **iOS**: Swift Supabase Client.
  - **Android**: Kotlin Supabase Kt.
- **Room Management**:
  - **Creation**: INSERT row into `rooms` table -> returns `room_code`.
  - **Joining**: SELECT from `rooms` where `code` matches.
  - **State Sync**: Subscriptions via Supabase Realtime (WebSockets) to listen for `INSERT`/`UPDATE` on the `moves` table.
- **Latency Handling**:
  - Optimistic UI updates (piece moves locally immediately, reverts if server rejects).
  - Timestamp validation for turn enforcement.
- **Reconnection**:
  - Local caching of `room_id` and `player_id`.
  - Auto-rejoin logic on app resume.

## 6. Monetization (Ads Only)
Strict adherence to "Fair Play" with monetization.

- **Banner Ads**: Small sticky banner at the bottom of the **Home Menu** and **Settings**. (Never on the Game Board to avoid miss-clicks).
- **Interstitial Ads**:
  - Trigger: After every completed Online or AI match.
  - Frequency Cap: Max 1 every 5 minutes to prevent frustration.
- **Rewarded Ads**:
  - Value Exchange: "Watch to Unlock a Cyber Skin for 24h" or "Watch to Retry vs AI" (if a campaign mode is added).
- **Policy**: No pay-to-win elements. All gameplay is skill-based.

## 7. Mobile Conversion Strategy: FULL NATIVE
**Choice**: **Full Native (SwiftUI for iOS + Jetpack Compose for Android)**

**Justification**:
1.  **Performance & Fluidity**: Native rendering ensures 120Hz animations for piece sliding and "Cyber Neon" glow effects, which can feel sluggish in WebViews/Hybrid wrappers.
2.  **Haptic Integration**: Precise control over the Taptic Engine (iOS) and Vibration API (Android) when a "Mill" is formed creates a tactile satisfaction web apps cannot match.
3.  **App Store Quality**: Apple and Google prioritize apps that use native UI paradigms. "NAV-TIN" aims for a premium feel (glassmorphism/neon visuals), which is best achieved with SwiftUI/Compose.
4.  **Gesture Control**: Native touch handling for dragging pieces is smoother and less prone to "browser ghost touches" or scroll interference.

## 8. App Store Compliance
- **Privacy Policy**: Must disclose data collection (Supabase Auth/Ads).
- **Age Rating**: Rated 4+ or 12+ (depending on "Mild Fantasy Violence" tag for neon explosions).
- **Permissions**:
  - `Internet` (Required).
  - `Tracking` (iOS ATT - strictly for AdMob).
- **Account Deletion**: App must provide a way to delete user data (Supabase auth deletion) mandated by Apple.

## 9. Tech Stack Recommendation

### iOS (Apple App Store)
- **Language**: Swift 5+
- **UI Framework**: SwiftUI (Modern, declarative UI matching React mental model).
- **Native Modules**: CoreHaptics (Vibration), SpriteKit (Optional for advanced particle effects), AdMob SDK.

### Android (Google Play Store)
- **Language**: Kotlin
- **UI Framework**: Jetpack Compose (Modern Material 3 implementation).
- **Native Modules**: VibratorManager, AdMob SDK.

### Backend (Shared)
- **Database/Realtime**: **Supabase** (PostgreSQL + Realtime Channels).
- **Auth**: Supabase Auth (Anonymous login or Google Sign-In).

### Ad Network (Mediation)
- **Google AdMob**: Primary source.
- **Mediation**: Optional (AppLovin/Unity Ads) if AdMob fill rates drop.

## 10. Final Deliverable
This blueprint serves as the master Product Requirement Document (PRD).

**Next Steps for Execution**:
1.  **Repo Setup**: Create two native Git repos (one for iOS, one for Android) or a monorepo if using KMP (Kotlin Multiplatform) sharing business logic.
2.  **Asset Export**: Export SVGs (Board, Pieces) and Colors from the web project.
3.  **Backend Config**: Ensure Supabase RLS (Row Level Security) policies allow mobile client access.
4.  **Development Sprint**:
    - Week 1: Core Board Logic (Native).
    - Week 2: Animations & Theming.
    - Week 3: Supabase Integration.
    - Week 4: Polish & Publish.

**End of Blueprint**
NAV-TIN ShipMobileApp Blueprint
Full Native Mobile Game (iOS + Android)
Based on ShipMobileApp Method + Your Game PRD
1. App Overview

App Name: NAV-TIN
Genre: Strategy Board Game / Online Multiplayer
Platforms: iOS (SwiftUI), Android (Jetpack Compose)
Monetization: Ads Only (AdMob)
Backend: Supabase (Realtime, Anonymous Auth)
Rendering: Native Canvas (SwiftUI Shapes + Compose Canvas)

Description:
NAV-TIN is a cyberpunk-styled Nine Men’s Morris game featuring AI, local multiplayer, and real-time online play with friends or random opponents. Built as a premium native mobile experience with smooth animations, haptics, and competitive gameplay.

2. Game Modes

Play vs Computer

Offline

AI Levels: Easy, Medium, Hard

Local Multiplayer

Two players on same device (Hot-seat)

Online Random Match

Supabase Realtime matchmaking

Turn-based sync

Private Room

6-digit room code

Invite friends

Reconnect on disconnect

3. Screen Flow

Splash Screen (Animated Neon Logo)

Home Screen

Play Online

Play vs AI

Local Multiplayer

Settings

Matchmaking Screen

Room Code Screen

Game Board Screen

Game Result Screen

Settings Screen

Ads Overlay Layer

4. Core Game Engine (Shared Logic Spec)
Board Model

24 Nodes

16 Lines

Adjacency Matrix

Game State
Phase: PLACING | MOVING | FLYING
Turn: Player1 | Player2
Pieces: positions[]
Mills: detected[]

Mill Detection

Horizontal and vertical triplets

Removal rules enforced

Win Conditions

Opponent < 3 pieces

Opponent has no legal moves

AI Engine

Minimax (Depth varies by difficulty)

Heuristic scoring:

Mills formed

Mobility

Piece count

Center control

5. Supabase Multiplayer Architecture
Tables
rooms
id (uuid)
code (text)
status (waiting, playing, finished)
created_at

players
id
room_id
user_id
side (white/black)

moves
id
room_id
player_id
from_node
to_node
phase
timestamp

Realtime Channels

room:{room_id}

Broadcast move updates

Presence tracking

RLS

Players can only access their own room

Moves insertable only by current turn

6. Ads (AdMob)
Banner Ads

Home Screen bottom

Settings Screen bottom

Interstitial Ads

After every completed match

Frequency cap: 1 per 5 minutes

Rewarded Ads

Unlock temporary skins

Retry match

iOS ATT

Tracking permission dialog before loading ads

7. iOS Project Structure (SwiftUI)
NavTin/
├── NavTinApp.swift
├── Engine/
│   ├── BoardModel.swift
│   ├── GameState.swift
│   ├── MillDetector.swift
│   ├── AIModule.swift
├── Views/
│   ├── SplashView.swift
│   ├── HomeView.swift
│   ├── MatchmakingView.swift
│   ├── BoardView.swift
│   ├── ResultView.swift
│   └── SettingsView.swift
├── Multiplayer/
│   ├── SupabaseClient.swift
│   ├── RealtimeService.swift
│   └── RoomManager.swift
├── Ads/
│   └── AdMobManager.swift
└── Assets.xcassets

8. Android Project Structure (Jetpack Compose)
navtin/
├── MainActivity.kt
├── engine/
│   ├── BoardModel.kt
│   ├── GameState.kt
│   ├── MillDetector.kt
│   ├── AIModule.kt
├── ui/
│   ├── splash/
│   ├── home/
│   ├── matchmaking/
│   ├── board/
│   ├── result/
│   └── settings/
├── multiplayer/
│   ├── SupabaseClient.kt
│   ├── RealtimeService.kt
│   └── RoomManager.kt
├── ads/
│   └── AdMobManager.kt
└── res/

9. Security

Anonymous Supabase Auth

Device ID binding

RLS on all tables

No API keys in repo

Secure key storage (Keychain / EncryptedSharedPrefs)

10. Build Phases
Phase 1 – Game Engine

Board model

Rule enforcement

AI

Phase 2 – Native UI

Canvas board rendering

Drag & tap input

Animations

Phase 3 – Multiplayer

Supabase schema

Realtime sync

Matchmaking

Phase 4 – Ads

AdMob integration

ATT flow

Frequency control

Phase 5 – Polish

Haptics

Sound

Themes

Store assets

11. Store Compliance

Privacy Policy

Anonymous auth disclosure

Ads & tracking disclosure

Age rating: 12+

Data deletion option