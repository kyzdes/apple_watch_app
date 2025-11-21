import SwiftUI

struct VibrationSendView: View {
    @StateObject private var viewModel = VibrationViewModel()
    @StateObject private var friendsViewModel = FriendsViewModel()
    @State private var selectedFriend: Friend?
    @State private var selectedPattern: VibrationPattern?
    @State private var selectedEmoji: String = ""
    @State private var showEmojiPicker = false

    let emojis = ["❤️", "👋", "👍", "😄", "🔥", "⭐", "🎉", "💯", "✨", "🌟"]

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Friend Selection
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Send To")
                            .font(.headline)

                        if friendsViewModel.friends.isEmpty {
                            Text("No friends available")
                                .foregroundColor(.gray)
                                .italic()
                        } else {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(friendsViewModel.friends) { friend in
                                        FriendButton(
                                            friend: friend,
                                            isSelected: selectedFriend?.id == friend.id
                                        ) {
                                            selectedFriend = friend
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding()

                    Divider()

                    // Pattern Selection
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Vibration Pattern")
                            .font(.headline)

                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 12) {
                            ForEach(viewModel.presetPatterns) { pattern in
                                PatternButton(
                                    pattern: pattern,
                                    isSelected: selectedPattern?.id == pattern.id
                                ) {
                                    selectedPattern = pattern
                                    // Preview the pattern
                                    HapticManager.shared.playPattern(pattern.pattern)
                                }
                            }
                        }
                    }
                    .padding()

                    Divider()

                    // Emoji Selection
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Add Emoji (Optional)")
                            .font(.headline)

                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 5), spacing: 12) {
                            ForEach(emojis, id: \.self) { emoji in
                                Button(action: {
                                    selectedEmoji = emoji
                                }) {
                                    Text(emoji)
                                        .font(.largeTitle)
                                        .frame(width: 50, height: 50)
                                        .background(
                                            selectedEmoji == emoji ?
                                                Color.blue.opacity(0.2) : Color(.systemGray6)
                                        )
                                        .cornerRadius(10)
                                }
                            }
                        }
                    }
                    .padding()

                    // Send Button
                    Button(action: sendVibration) {
                        HStack {
                            Image(systemName: "paperplane.fill")
                            Text("Send Vibration")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            (selectedFriend != nil && selectedPattern != nil) ?
                                Color.blue : Color.gray
                        )
                        .cornerRadius(12)
                    }
                    .disabled(selectedFriend == nil || selectedPattern == nil)
                    .padding()
                }
            }
            .navigationTitle("Send Vibration")
            .task {
                await viewModel.loadPresetPatterns()
                await friendsViewModel.loadFriends()
            }
            .alert("Success", isPresented: .constant(viewModel.successMessage != nil)) {
                Button("OK") {
                    viewModel.successMessage = nil
                }
            } message: {
                Text(viewModel.successMessage ?? "")
            }
            .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
                Button("OK") {
                    viewModel.errorMessage = nil
                }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
    }

    private func sendVibration() {
        guard let friend = selectedFriend,
              let pattern = selectedPattern else { return }

        Task {
            await viewModel.sendVibration(
                to: friend.id,
                vibrationType: pattern.name,
                patternId: pattern.id,
                emoji: selectedEmoji.isEmpty ? nil : selectedEmoji
            )

            // Reset selection after sending
            selectedEmoji = ""
        }
    }
}

struct FriendButton: View {
    let friend: Friend
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                ZStack(alignment: .topTrailing) {
                    Circle()
                        .fill(Color.blue.opacity(0.2))
                        .frame(width: 60, height: 60)
                        .overlay(
                            Text(String(friend.username.prefix(1)).uppercased())
                                .font(.title2)
                                .fontWeight(.semibold)
                        )

                    if friend.isOnline {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 16, height: 16)
                            .overlay(
                                Circle()
                                    .stroke(Color.white, lineWidth: 2)
                            )
                    }
                }

                Text(friend.username)
                    .font(.caption)
                    .lineLimit(1)
            }
            .padding(8)
            .background(
                isSelected ? Color.blue.opacity(0.1) : Color.clear
            )
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct PatternButton: View {
    let pattern: VibrationPattern
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: "waveform.path")
                    .font(.largeTitle)
                    .foregroundColor(isSelected ? .blue : .primary)

                Text(pattern.name.replacingOccurrences(of: "_", with: " ").capitalized)
                    .font(.subheadline)
                    .multilineTextAlignment(.center)

                if let description = pattern.description {
                    Text(description)
                        .font(.caption2)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                isSelected ? Color.blue.opacity(0.1) : Color(.systemGray6)
            )
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct VibrationSendView_Previews: PreviewProvider {
    static var previews: some View {
        VibrationSendView()
    }
}
