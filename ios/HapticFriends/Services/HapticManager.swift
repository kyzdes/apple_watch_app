import UIKit
import CoreHaptics

class HapticManager {
    static let shared = HapticManager()

    private var engine: CHHapticEngine?
    private let impactGenerator = UIImpactFeedbackGenerator(style: .medium)
    private let notificationGenerator = UINotificationFeedbackGenerator()

    private init() {
        setupHapticEngine()
    }

    private func setupHapticEngine() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else {
            print("Device doesn't support haptics")
            return
        }

        do {
            engine = try CHHapticEngine()
            try engine?.start()
        } catch {
            print("Haptic engine creation error: \(error)")
        }
    }

    // MARK: - Simple Haptic Feedback

    func playImpact(style: UIImpactFeedbackGenerator.FeedbackStyle = .medium) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.impactOccurred()
    }

    func playNotification(type: UINotificationFeedbackGenerator.FeedbackType) {
        notificationGenerator.notificationOccurred(type)
    }

    func playSelection() {
        let generator = UISelectionFeedbackGenerator()
        generator.selectionChanged()
    }

    // MARK: - Custom Pattern Playback

    func playPattern(_ pattern: VibrationPattern.Pattern) {
        guard let engine = engine else {
            fallbackVibration()
            return
        }

        do {
            let events = createHapticEvents(from: pattern)
            let hapticPattern = try CHHapticPattern(events: events, parameters: [])
            let player = try engine.makePlayer(with: hapticPattern)
            try player.start(atTime: CHHapticTimeImmediate)
        } catch {
            print("Failed to play haptic pattern: \(error)")
            fallbackVibration()
        }
    }

    func playPatternByName(_ name: String) {
        let pattern: VibrationPattern.Pattern

        switch name {
        case Constants.HapticPatterns.shortTap:
            pattern = VibrationPattern.Pattern(intervals: [0.2], intensities: [1.0])

        case Constants.HapticPatterns.doubleTap:
            pattern = VibrationPattern.Pattern(intervals: [0.2, 0.1, 0.2], intensities: [1.0, 0, 1.0])

        case Constants.HapticPatterns.longVibration:
            pattern = VibrationPattern.Pattern(intervals: [1.0], intensities: [0.8])

        case Constants.HapticPatterns.sos:
            pattern = VibrationPattern.Pattern(
                intervals: [0.2, 0.1, 0.2, 0.1, 0.2, 0.3, 0.5, 0.1, 0.5, 0.1, 0.5, 0.3, 0.2, 0.1, 0.2, 0.1, 0.2],
                intensities: [1.0, 0, 1.0, 0, 1.0, 0, 1.0, 0, 1.0, 0, 1.0, 0, 1.0, 0, 1.0, 0, 1.0]
            )

        case Constants.HapticPatterns.heartbeat:
            pattern = VibrationPattern.Pattern(intervals: [0.15, 0.1, 0.15, 0.6], intensities: [0.8, 0, 0.8, 0])

        default:
            pattern = VibrationPattern.Pattern(intervals: [0.2], intensities: [1.0])
        }

        playPattern(pattern)
    }

    // MARK: - Helper Methods

    private func createHapticEvents(from pattern: VibrationPattern.Pattern) -> [CHHapticEvent] {
        var events: [CHHapticEvent] = []
        var currentTime: TimeInterval = 0

        for (index, interval) in pattern.intervals.enumerated() {
            let intensity = Float(pattern.intensities[safe: index] ?? 0.5)

            if intensity > 0 {
                let intensityParam = CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity)
                let sharpnessParam = CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5)

                let event = CHHapticEvent(
                    eventType: .hapticContinuous,
                    parameters: [intensityParam, sharpnessParam],
                    relativeTime: currentTime,
                    duration: interval
                )

                events.append(event)
            }

            currentTime += interval
        }

        return events
    }

    private func fallbackVibration() {
        // Simple vibration fallback for older devices
        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
    }
}

// Safe array subscript
extension Array {
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}
