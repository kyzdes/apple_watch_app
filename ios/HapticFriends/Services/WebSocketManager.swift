import Foundation
import Combine

class WebSocketManager: NSObject, ObservableObject {
    static let shared = WebSocketManager()

    @Published var isConnected = false
    private var webSocketTask: URLSessionWebSocketTask?
    private var cancellables = Set<AnyCancellable>()

    private override init() {
        super.init()
    }

    func connect() {
        guard let token = KeychainHelper.shared.get(Constants.Keychain.accessToken) else {
            print("No access token found")
            return
        }

        guard let url = URL(string: Constants.wsURL) else {
            print("Invalid WebSocket URL")
            return
        }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)
        webSocketTask = session.webSocketTask(with: request)
        webSocketTask?.resume()

        isConnected = true
        receiveMessage()

        print("WebSocket connected")
    }

    func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        isConnected = false
        print("WebSocket disconnected")
    }

    func send<T: Codable>(event: String, data: T) {
        struct SocketMessage<T: Codable>: Codable {
            let event: String
            let data: T
        }

        let message = SocketMessage(event: event, data: data)

        do {
            let encoder = JSONEncoder()
            encoder.keyEncodingStrategy = .convertToSnakeCase
            let jsonData = try encoder.encode(message)

            if let jsonString = String(data: jsonData, encoding: .utf8) {
                let message = URLSessionWebSocketTask.Message.string(jsonString)
                webSocketTask?.send(message) { error in
                    if let error = error {
                        print("WebSocket send error: \(error)")
                    }
                }
            }
        } catch {
            print("Failed to encode message: \(error)")
        }
    }

    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }

            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self.handleMessage(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self.handleMessage(text)
                    }
                @unknown default:
                    break
                }

                // Continue receiving
                self.receiveMessage()

            case .failure(let error):
                print("WebSocket receive error: \(error)")
                self.isConnected = false

                // Attempt to reconnect after 5 seconds
                DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                    if !self.isConnected {
                        self.connect()
                    }
                }
            }
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }

        do {
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            decoder.dateDecodingStrategy = .iso8601

            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let event = json["event"] as? String {

                switch event {
                case "vibration_received":
                    if let vibration = try? decoder.decode(IncomingVibration.self, from: data) {
                        handleVibrationReceived(vibration)
                    }

                case "friend_online":
                    NotificationCenter.default.post(name: Constants.Notifications.friendOnline, object: json)

                case "friend_offline":
                    NotificationCenter.default.post(name: Constants.Notifications.friendOffline, object: json)

                case "friend_request":
                    NotificationCenter.default.post(name: Constants.Notifications.friendRequestReceived, object: json)

                default:
                    print("Unhandled WebSocket event: \(event)")
                }
            }
        } catch {
            print("Failed to parse WebSocket message: \(error)")
        }
    }

    private func handleVibrationReceived(_ vibration: IncomingVibration) {
        // Play haptic feedback
        HapticManager.shared.playPatternByName(vibration.vibrationType)

        // Post notification
        NotificationCenter.default.post(
            name: Constants.Notifications.vibrationReceived,
            object: vibration
        )

        // Show local notification if app is in background
        NotificationManager.shared.showVibrationNotification(
            from: vibration.senderUsername,
            emoji: vibration.emoji
        )
    }
}

extension WebSocketManager: URLSessionWebSocketDelegate {
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        print("WebSocket connected")
        DispatchQueue.main.async {
            self.isConnected = true
        }
    }

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        print("WebSocket closed")
        DispatchQueue.main.async {
            self.isConnected = false
        }
    }
}
