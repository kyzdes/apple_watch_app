import Foundation
import Combine

class VibrationViewModel: ObservableObject {
    @Published var presetPatterns: [VibrationPattern] = []
    @Published var customPatterns: [CustomPattern] = []
    @Published var sentHistory: [VibrationHistory] = []
    @Published var receivedHistory: [VibrationHistory] = []
    @Published var unreadCount = 0
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?

    private let api = APIClient.shared
    private var cancellables = Set<AnyCancellable>()

    init() {
        setupNotifications()
    }

    private func setupNotifications() {
        NotificationCenter.default.publisher(for: Constants.Notifications.vibrationReceived)
            .sink { [weak self] notification in
                if let vibration = notification.object as? IncomingVibration {
                    self?.handleIncomingVibration(vibration)
                }
            }
            .store(in: &cancellables)
    }

    private func handleIncomingVibration(_ vibration: IncomingVibration) {
        // Reload received history
        Task {
            await loadReceivedHistory()
        }

        unreadCount += 1
    }

    // MARK: - Load Patterns

    func loadPresetPatterns() async {
        do {
            let response: [VibrationPattern] = try await api.request(
                endpoint: "/vibrations/patterns/presets",
                method: "GET"
            )

            DispatchQueue.main.async {
                self.presetPatterns = response
            }
        } catch {
            print("Failed to load preset patterns: \(error)")
        }
    }

    func loadCustomPatterns() async {
        do {
            let response: [CustomPattern] = try await api.request(
                endpoint: "/vibrations/patterns/custom",
                method: "GET"
            )

            DispatchQueue.main.async {
                self.customPatterns = response
            }
        } catch {
            print("Failed to load custom patterns: \(error)")
        }
    }

    // MARK: - Send Vibration

    func sendVibration(
        to receiverId: String,
        vibrationType: String,
        patternId: String? = nil,
        customPatternId: String? = nil,
        emoji: String? = nil
    ) async {
        isLoading = true

        do {
            let request = VibrationRequest(
                receiverId: receiverId,
                vibrationType: vibrationType,
                patternId: patternId,
                customPatternId: customPatternId,
                emoji: emoji
            )

            struct VibrationResponse: Codable {
                let id: String
            }

            let response: VibrationResponse = try await api.request(
                endpoint: "/vibrations/send",
                method: "POST",
                body: request
            )

            // Notify via WebSocket
            struct WebSocketData: Codable {
                let vibrationId: String
                let receiverId: String
                let vibrationType: String
                let emoji: String?
                let patternName: String?
            }

            let wsData = WebSocketData(
                vibrationId: response.id,
                receiverId: receiverId,
                vibrationType: vibrationType,
                emoji: emoji,
                patternName: vibrationType
            )

            WebSocketManager.shared.send(event: "vibration_sent", data: wsData)

            DispatchQueue.main.async {
                self.successMessage = "Vibration sent!"
                self.isLoading = false
            }

            // Reload history
            await loadSentHistory()

            // Play haptic preview
            HapticManager.shared.playPatternByName(vibrationType)

        } catch {
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    // MARK: - History

    func loadSentHistory() async {
        do {
            let response: [VibrationHistory] = try await api.request(
                endpoint: "/vibrations/history/sent",
                method: "GET"
            )

            DispatchQueue.main.async {
                self.sentHistory = response
            }
        } catch {
            print("Failed to load sent history: \(error)")
        }
    }

    func loadReceivedHistory() async {
        do {
            let response: [VibrationHistory] = try await api.request(
                endpoint: "/vibrations/history/received",
                method: "GET"
            )

            DispatchQueue.main.async {
                self.receivedHistory = response
            }
        } catch {
            print("Failed to load received history: \(error)")
        }
    }

    func markAsRead(vibrationId: String) async {
        do {
            struct EmptyResponse: Codable {}
            let _: EmptyResponse = try await api.request(
                endpoint: "/vibrations/\(vibrationId)/read",
                method: "PUT"
            )

            if unreadCount > 0 {
                unreadCount -= 1
            }
        } catch {
            print("Failed to mark as read: \(error)")
        }
    }

    func loadUnreadCount() async {
        do {
            struct CountResponse: Codable {
                let count: Int
            }

            let response: CountResponse = try await api.request(
                endpoint: "/vibrations/unread-count",
                method: "GET"
            )

            DispatchQueue.main.async {
                self.unreadCount = response.count
            }
        } catch {
            print("Failed to load unread count: \(error)")
        }
    }

    // MARK: - Custom Patterns

    func createCustomPattern(name: String, pattern: VibrationPattern.Pattern) async {
        isLoading = true

        do {
            struct PatternBody: Codable {
                let name: String
                let pattern: VibrationPattern.Pattern
            }

            struct EmptyResponse: Codable {}
            let body = PatternBody(name: name, pattern: pattern)
            let _: EmptyResponse = try await api.request(
                endpoint: "/vibrations/patterns/custom",
                method: "POST",
                body: body
            )

            DispatchQueue.main.async {
                self.successMessage = "Custom pattern created"
                self.isLoading = false
            }

            // Reload custom patterns
            await loadCustomPatterns()
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    func deleteCustomPattern(patternId: String) async {
        do {
            struct EmptyResponse: Codable {}
            let _: EmptyResponse = try await api.request(
                endpoint: "/vibrations/patterns/custom/\(patternId)",
                method: "DELETE"
            )

            DispatchQueue.main.async {
                self.successMessage = "Pattern deleted"
            }

            // Reload custom patterns
            await loadCustomPatterns()
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
            }
        }
    }
}
