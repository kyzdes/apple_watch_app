import Foundation

enum Constants {
    // API Configuration
    static let baseURL = "http://localhost:3000/api/v1"
    static let wsURL = "ws://localhost:3000"

    // Change these for production:
    // static let baseURL = "https://api.hapticfriends.app/api/v1"
    // static let wsURL = "wss://api.hapticfriends.app"

    // Keychain Keys
    enum Keychain {
        static let accessToken = "access_token"
        static let refreshToken = "refresh_token"
        static let userId = "user_id"
        static let username = "username"
    }

    // UserDefaults Keys
    enum UserDefaults {
        static let isAuthenticated = "is_authenticated"
        static let notificationsEnabled = "notifications_enabled"
        static let vibrationPreviewEnabled = "vibration_preview_enabled"
    }

    // Notification Names
    enum Notifications {
        static let vibrationReceived = Notification.Name("vibrationReceived")
        static let friendRequestReceived = Notification.Name("friendRequestReceived")
        static let friendOnline = Notification.Name("friendOnline")
        static let friendOffline = Notification.Name("friendOffline")
    }

    // Haptic Patterns
    enum HapticPatterns {
        static let shortTap = "short_tap"
        static let doubleTap = "double_tap"
        static let longVibration = "long_vibration"
        static let sos = "sos"
        static let heartbeat = "heartbeat"
    }
}
