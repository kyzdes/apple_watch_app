import SwiftUI

struct FriendsView: View {
    @StateObject private var viewModel = FriendsViewModel()
    @State private var showingAddFriend = false
    @State private var showingRequests = false

    var body: some View {
        NavigationView {
            ZStack {
                List {
                    // Pending requests section
                    if !viewModel.pendingRequests.isEmpty {
                        Section(header: Text("Friend Requests")) {
                            ForEach(viewModel.pendingRequests) { request in
                                FriendRequestRow(request: request, viewModel: viewModel)
                            }
                        }
                    }

                    // Friends list
                    Section(header: Text("Friends")) {
                        if viewModel.friends.isEmpty {
                            Text("No friends yet. Add some!")
                                .foregroundColor(.gray)
                                .italic()
                        } else {
                            ForEach(viewModel.friends) { friend in
                                FriendRow(friend: friend)
                            }
                        }
                    }
                }
                .listStyle(InsetGroupedListStyle())

                if viewModel.isLoading {
                    ProgressView()
                }
            }
            .navigationTitle("Friends")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddFriend = true }) {
                        Image(systemName: "person.badge.plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddFriend) {
                AddFriendView(viewModel: viewModel)
            }
            .task {
                await viewModel.loadFriends()
                await viewModel.loadPendingRequests()
            }
            .refreshable {
                await viewModel.loadFriends()
                await viewModel.loadPendingRequests()
            }
        }
    }
}

struct FriendRow: View {
    let friend: Friend

    var body: some View {
        HStack {
            // Avatar
            Circle()
                .fill(friend.isOnline ? Color.green : Color.gray)
                .frame(width: 12, height: 12)

            VStack(alignment: .leading) {
                Text(friend.username)
                    .font(.headline)

                if friend.hasWatch {
                    HStack(spacing: 4) {
                        Image(systemName: "applewatch")
                        Text("Watch Connected")
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                }
            }

            Spacer()

            if friend.isOnline {
                Text("Online")
                    .font(.caption)
                    .foregroundColor(.green)
            }
        }
        .padding(.vertical, 4)
    }
}

struct FriendRequestRow: View {
    let request: FriendRequest
    @ObservedObject var viewModel: FriendsViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(request.username)
                .font(.headline)

            HStack {
                Button("Accept") {
                    Task {
                        await viewModel.acceptFriendRequest(requestId: request.requestId)
                    }
                }
                .buttonStyle(.borderedProminent)

                Button("Decline") {
                    Task {
                        await viewModel.declineFriendRequest(requestId: request.requestId)
                    }
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(.vertical, 4)
    }
}

struct AddFriendView: View {
    @ObservedObject var viewModel: FriendsViewModel
    @Environment(\.dismiss) var dismiss
    @State private var searchText = ""

    var body: some View {
        NavigationView {
            VStack {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)

                    TextField("Search username...", text: $searchText)
                        .textFieldStyle(PlainTextFieldStyle())
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .onChange(of: searchText) { newValue in
                            Task {
                                await viewModel.searchUsers(query: newValue)
                            }
                        }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .padding()

                // Search results
                List(viewModel.searchResults) { user in
                    HStack {
                        Text(user.username)
                            .font(.headline)

                        Spacer()

                        Button("Add") {
                            Task {
                                await viewModel.sendFriendRequest(to: user.id)
                                dismiss()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                }
            }
            .navigationTitle("Add Friend")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct FriendsView_Previews: PreviewProvider {
    static var previews: some View {
        FriendsView()
    }
}
