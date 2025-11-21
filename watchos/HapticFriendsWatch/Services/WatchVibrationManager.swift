import Foundation
import Combine

class WatchVibrationManager: ObservableObject {
    @Published var currentVibration: WatchVibration?
    @Published var recentVibrations: [WatchVibration] = []

    private var cancellables = Set<AnyCancellable>()
    private let maxRecentVibrations = 10

    init() {
        setupNotifications()
        loadRecentVibrations()
    }

    private func setupNotifications() {
        NotificationCenter.default.publisher(for: NSNotification.Name("VibrationReceived"))
            .compactMap { $0.object as? WatchVibration }
            .sink { [weak self] vibration in
                self?.handleVibrationReceived(vibration)
            }
            .store(in: &cancellables)
    }

    private func handleVibrationReceived(_ vibration: WatchVibration) {
        // Set as current vibration
        currentVibration = vibration

        // Add to recent vibrations
        recentVibrations.insert(vibration, at: 0)

        // Keep only last 10
        if recentVibrations.count > maxRecentVibrations {
            recentVibrations.removeLast()
        }

        // Save to storage
        saveRecentVibrations()

        // Play haptic
        WatchHapticManager.shared.playPatternByName(vibration.vibrationType)

        // Auto-dismiss after 5 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
            if self.currentVibration?.id == vibration.id {
                self.currentVibration = nil
            }
        }
    }

    func clearCurrentVibration() {
        currentVibration = nil
    }

    private func saveRecentVibrations() {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(recentVibrations)
            UserDefaults.standard.set(data, forKey: "recentVibrations")
        } catch {
            print("Failed to save recent vibrations: \(error)")
        }
    }

    private func loadRecentVibrations() {
        guard let data = UserDefaults.standard.data(forKey: "recentVibrations") else { return }

        do {
            let decoder = JSONDecoder()
            recentVibrations = try decoder.decode([WatchVibration].self, from: data)
        } catch {
            print("Failed to load recent vibrations: \(error)")
        }
    }
}
