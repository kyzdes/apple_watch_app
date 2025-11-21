import Foundation
import UserNotifications

class NotificationManager: NSObject {
    static let shared = NotificationManager()

    private override init() {
        super.init()
    }

    func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            if granted {
                print("Notification permission granted")
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            } else if let error = error {
                print("Notification permission error: \(error)")
            }
        }
    }

    func registerDeviceToken(_ deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("Device token: \(token)")

        Task {
            do {
                try await AuthService.shared.registerDeviceToken(token, deviceType: "ios")
                print("Device token registered successfully")
            } catch {
                print("Failed to register device token: \(error)")
            }
        }
    }

    func showVibrationNotification(from sender: String, emoji: String?) {
        let content = UNMutableNotificationContent()
        content.title = "Vibration from \(sender)"
        content.body = emoji ?? "Tap to view"
        content.sound = .default
        content.badge = NSNumber(value: UIApplication.shared.applicationIconBadgeNumber + 1)

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Failed to show notification: \(error)")
            }
        }
    }

    func showFriendRequestNotification(from sender: String) {
        let content = UNMutableNotificationContent()
        content.title = "New Friend Request"
        content.body = "\(sender) wants to be your friend"
        content.sound = .default
        content.badge = NSNumber(value: UIApplication.shared.applicationIconBadgeNumber + 1)

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Failed to show notification: \(error)")
            }
        }
    }

    func clearBadge() {
        UIApplication.shared.applicationIconBadgeNumber = 0
    }

    func setBadge(_ count: Int) {
        UIApplication.shared.applicationIconBadgeNumber = count
    }
}

extension NotificationManager: UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        // Handle notification tap
        let userInfo = response.notification.request.content.userInfo
        print("Notification tapped: \(userInfo)")

        completionHandler()
    }
}
