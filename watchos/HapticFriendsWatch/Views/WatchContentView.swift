import SwiftUI

struct WatchContentView: View {
    @EnvironmentObject var vibrationManager: WatchVibrationManager
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            // Recent Vibrations
            ReceivedVibrationsView()
                .tag(0)

            // Quick Reply
            QuickReplyView()
                .tag(1)

            // Status
            StatusView()
                .tag(2)
        }
        .tabViewStyle(.page)
    }
}

struct ReceivedVibrationsView: View {
    @EnvironmentObject var vibrationManager: WatchVibrationManager

    var body: some View {
        VStack(spacing: 12) {
            if let current = vibrationManager.currentVibration {
                // Full screen display of current vibration
                VStack(spacing: 16) {
                    if let emoji = current.emoji {
                        Text(emoji)
                            .font(.system(size: 80))
                    } else {
                        Image(systemName: "waveform.path")
                            .font(.system(size: 60))
                            .foregroundColor(.blue)
                    }

                    Text(current.senderUsername)
                        .font(.headline)
                        .fontWeight(.bold)

                    Text(formatTime(current.timestamp))
                        .font(.caption)
                        .foregroundColor(.gray)

                    Button(action: {
                        vibrationManager.clearCurrentVibration()
                    }) {
                        Text("Dismiss")
                            .font(.caption)
                    }
                }
                .padding()
            } else {
                // Recent vibrations list
                ScrollView {
                    VStack(spacing: 8) {
                        if vibrationManager.recentVibrations.isEmpty {
                            VStack(spacing: 8) {
                                Image(systemName: "waveform.path")
                                    .font(.largeTitle)
                                    .foregroundColor(.gray)

                                Text("No vibrations yet")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            .padding()
                        } else {
                            ForEach(vibrationManager.recentVibrations) { vibration in
                                VibrationRow(vibration: vibration)
                            }
                        }
                    }
                }
            }
        }
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct VibrationRow: View {
    let vibration: WatchVibration

    var body: some View {
        HStack(spacing: 8) {
            if let emoji = vibration.emoji {
                Text(emoji)
                    .font(.title2)
            } else {
                Image(systemName: "waveform.path")
                    .foregroundColor(.blue)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(vibration.senderUsername)
                    .font(.caption)
                    .fontWeight(.semibold)

                Text(formatTime(vibration.timestamp))
                    .font(.caption2)
                    .foregroundColor(.gray)
            }

            Spacer()
        }
        .padding(8)
        .background(Color(.darkGray).opacity(0.3))
        .cornerRadius(8)
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct QuickReplyView: View {
    @EnvironmentObject var vibrationManager: WatchVibrationManager
    @State private var selectedPattern: String = "short_tap"

    let patterns = [
        ("short_tap", "❤️", "Quick Tap"),
        ("double_tap", "👋", "Double Tap"),
        ("heartbeat", "💓", "Heartbeat")
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                Text("Quick Reply")
                    .font(.headline)

                ForEach(patterns, id: \.0) { pattern in
                    Button(action: {
                        sendQuickReply(pattern: pattern.0, emoji: pattern.1)
                    }) {
                        HStack {
                            Text(pattern.1)
                                .font(.title2)

                            Text(pattern.2)
                                .font(.caption)

                            Spacer()

                            Image(systemName: "paperplane.fill")
                                .font(.caption)
                        }
                        .padding()
                        .background(Color.blue.opacity(0.2))
                        .cornerRadius(10)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding()
        }
    }

    private func sendQuickReply(pattern: String, emoji: String) {
        // Send via Watch Connectivity
        if let lastSender = vibrationManager.recentVibrations.first?.senderId {
            let message: [String: Any] = [
                "type": "send_vibration",
                "receiverId": lastSender,
                "vibrationType": pattern,
                "emoji": emoji
            ]

            WatchConnectivityManager.shared.sendMessage(message)

            // Play haptic feedback
            WatchHapticManager.shared.playPatternByName(pattern)
        }
    }
}

struct StatusView: View {
    @EnvironmentObject var connectivityManager: WatchConnectivityManager

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Image(systemName: "applewatch")
                    .font(.largeTitle)
                    .foregroundColor(.blue)

                Text("Haptic Friends")
                    .font(.headline)

                // Connection Status
                HStack {
                    Circle()
                        .fill(connectivityManager.isReachable ? Color.green : Color.red)
                        .frame(width: 8, height: 8)

                    Text(connectivityManager.isReachable ? "Connected" : "Disconnected")
                        .font(.caption)
                }

                Divider()

                VStack(alignment: .leading, spacing: 8) {
                    Text("Sync Status")
                        .font(.caption)
                        .foregroundColor(.gray)

                    Text(connectivityManager.isReachable ?
                         "Synced with iPhone" :
                         "Waiting for iPhone...")
                        .font(.caption2)
                }
            }
            .padding()
        }
    }
}

struct WatchContentView_Previews: PreviewProvider {
    static var previews: some View {
        WatchContentView()
            .environmentObject(WatchVibrationManager())
            .environmentObject(WatchConnectivityManager.shared)
    }
}
