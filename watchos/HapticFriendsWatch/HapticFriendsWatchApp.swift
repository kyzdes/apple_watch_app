import SwiftUI
import WatchKit

@main
struct HapticFriendsWatchApp: App {
    @StateObject private var connectivityManager = WatchConnectivityManager.shared
    @StateObject private var vibrationManager = WatchVibrationManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(connectivityManager)
                .environmentObject(vibrationManager)
                .onAppear {
                    connectivityManager.activate()
                }
        }
    }
}
