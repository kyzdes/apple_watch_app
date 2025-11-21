import WatchKit

class WatchHapticManager {
    static let shared = WatchHapticManager()

    private init() {}

    func playPatternByName(_ name: String) {
        let device = WKInterfaceDevice.current()

        switch name {
        case "short_tap":
            device.play(.click)

        case "double_tap":
            device.play(.click)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                device.play(.click)
            }

        case "long_vibration":
            device.play(.notification)

        case "sos":
            playSOS()

        case "heartbeat":
            playHeartbeat()

        default:
            device.play(.click)
        }
    }

    func playPattern(_ pattern: VibrationPattern) {
        let device = WKInterfaceDevice.current()

        for (index, interval) in pattern.intervals.enumerated() {
            let intensity = pattern.intensities[index]

            if intensity > 0 {
                DispatchQueue.main.asyncAfter(deadline: .now() + interval) {
                    // Use different haptic types based on intensity
                    if intensity > 0.7 {
                        device.play(.directionUp)
                    } else if intensity > 0.4 {
                        device.play(.click)
                    } else {
                        device.play(.directionDown)
                    }
                }
            }
        }
    }

    private func playSOS() {
        let device = WKInterfaceDevice.current()

        // S (...)
        for i in 0..<3 {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.2) {
                device.play(.click)
            }
        }

        // O (---)
        for i in 0..<3 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8 + Double(i) * 0.4) {
                device.play(.directionUp)
            }
        }

        // S (...)
        for i in 0..<3 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0 + Double(i) * 0.2) {
                device.play(.click)
            }
        }
    }

    private func playHeartbeat() {
        let device = WKInterfaceDevice.current()

        device.play(.directionUp)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            device.play(.directionUp)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) {
            device.play(.directionUp)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.85) {
            device.play(.directionUp)
        }
    }

    func playSuccess() {
        WKInterfaceDevice.current().play(.success)
    }

    func playFailure() {
        WKInterfaceDevice.current().play(.failure)
    }
}
