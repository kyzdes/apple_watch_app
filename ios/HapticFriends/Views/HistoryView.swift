import SwiftUI

struct HistoryView: View {
    @StateObject private var viewModel = VibrationViewModel()
    @State private var selectedTab = 0

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Selector
                Picker("History Type", selection: $selectedTab) {
                    Text("Received").tag(0)
                    Text("Sent").tag(1)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()

                // Content
                if selectedTab == 0 {
                    ReceivedHistoryView(viewModel: viewModel)
                } else {
                    SentHistoryView(viewModel: viewModel)
                }
            }
            .navigationTitle("History")
            .task {
                await viewModel.loadReceivedHistory()
                await viewModel.loadSentHistory()
                await viewModel.loadUnreadCount()
            }
            .refreshable {
                await viewModel.loadReceivedHistory()
                await viewModel.loadSentHistory()
            }
        }
    }
}

struct ReceivedHistoryView: View {
    @ObservedObject var viewModel: VibrationViewModel

    var body: some View {
        Group {
            if viewModel.receivedHistory.isEmpty {
                EmptyHistoryView(message: "No received vibrations yet")
            } else {
                List(viewModel.receivedHistory) { vibration in
                    VibrationHistoryRow(
                        vibration: vibration,
                        showSender: true,
                        viewModel: viewModel
                    )
                }
                .listStyle(PlainListStyle())
            }
        }
    }
}

struct SentHistoryView: View {
    @ObservedObject var viewModel: VibrationViewModel

    var body: some View {
        Group {
            if viewModel.sentHistory.isEmpty {
                EmptyHistoryView(message: "No sent vibrations yet")
            } else {
                List(viewModel.sentHistory) { vibration in
                    VibrationHistoryRow(
                        vibration: vibration,
                        showSender: false,
                        viewModel: viewModel
                    )
                }
                .listStyle(PlainListStyle())
            }
        }
    }
}

struct VibrationHistoryRow: View {
    let vibration: VibrationHistory
    let showSender: Bool
    @ObservedObject var viewModel: VibrationViewModel

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Emoji or Icon
            if let emoji = vibration.emoji {
                Text(emoji)
                    .font(.largeTitle)
            } else {
                Image(systemName: "waveform.path")
                    .font(.title2)
                    .foregroundColor(.blue)
                    .frame(width: 40, height: 40)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(8)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(showSender ?
                     (vibration.senderUsername ?? "Unknown") :
                     (vibration.receiverUsername ?? "Unknown")
                )
                .font(.headline)

                Text(vibration.patternName ?? vibration.vibrationType)
                    .font(.subheadline)
                    .foregroundColor(.gray)

                HStack {
                    Text(formatDate(vibration.sentAt))
                        .font(.caption)
                        .foregroundColor(.gray)

                    if showSender && !vibration.isRead {
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 8, height: 8)
                    }

                    if vibration.isDelivered {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)
                    }
                }
            }

            Spacer()
        }
        .padding(.vertical, 8)
        .contentShape(Rectangle())
        .onTapGesture {
            if showSender && !vibration.isRead {
                Task {
                    await viewModel.markAsRead(vibrationId: vibration.id)
                }
            }
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

struct EmptyHistoryView: View {
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "clock")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text(message)
                .font(.headline)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct HistoryView_Previews: PreviewProvider {
    static var previews: some View {
        HistoryView()
    }
}
