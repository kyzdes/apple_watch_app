import Foundation
import WatchConnectivity
import Combine

class WatchConnectivityManager: NSObject, ObservableObject {
    static let shared = WatchConnectivityManager()

    @Published var isReachable = false
    @Published var receivedMessages: [[String: Any]] = []

    private let session: WCSession? = WCSession.isSupported() ? WCSession.default : nil

    private override init() {
        super.init()
    }

    func activate() {
        session?.delegate = self
        session?.activate()
    }

    func sendMessage(_ message: [String: Any], replyHandler: (([String: Any]) -> Void)? = nil, errorHandler: ((Error) -> Void)? = nil) {
        guard let session = session, session.isReachable else {
            print("Watch Connectivity not reachable")
            errorHandler?(NSError(domain: "WatchConnectivity", code: -1, userInfo: [NSLocalizedDescriptionKey: "Session not reachable"]))
            return
        }

        session.sendMessage(message, replyHandler: replyHandler, errorHandler: errorHandler)
    }

    func updateApplicationContext(_ context: [String: Any]) {
        guard let session = session else { return }

        do {
            try session.updateApplicationContext(context)
        } catch {
            print("Failed to update application context: \(error)")
        }
    }

    func transferUserInfo(_ userInfo: [String: Any]) {
        session?.transferUserInfo(userInfo)
    }
}

extension WatchConnectivityManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable

            if let error = error {
                print("Watch Connectivity activation failed: \(error)")
            } else {
                print("Watch Connectivity activated: \(activationState.rawValue)")
            }
        }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
            print("Watch Connectivity reachability changed: \(session.isReachable)")
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        DispatchQueue.main.async {
            self.handleReceivedMessage(message)
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        DispatchQueue.main.async {
            self.handleReceivedMessage(message)
            replyHandler(["status": "received"])
        }
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        DispatchQueue.main.async {
            print("Received application context: \(applicationContext)")
        }
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        DispatchQueue.main.async {
            print("Received user info: \(userInfo)")
        }
    }

    private func handleReceivedMessage(_ message: [String: Any]) {
        receivedMessages.append(message)

        guard let type = message["type"] as? String else { return }

        switch type {
        case "vibration":
            if let vibrationData = try? JSONSerialization.data(withJSONObject: message),
               let vibration = try? JSONDecoder().decode(WatchVibration.self, from: vibrationData) {
                NotificationCenter.default.post(
                    name: NSNotification.Name("VibrationReceived"),
                    object: vibration
                )
            }

        case "auth_status":
            // Handle authentication status
            break

        default:
            print("Unknown message type: \(type)")
        }
    }
}
