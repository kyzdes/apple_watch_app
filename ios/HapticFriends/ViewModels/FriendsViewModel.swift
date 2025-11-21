import Foundation
import Combine

class FriendsViewModel: ObservableObject {
    @Published var friends: [Friend] = []
    @Published var pendingRequests: [FriendRequest] = []
    @Published var sentRequests: [FriendRequest] = []
    @Published var searchResults: [User] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?

    private let api = APIClient.shared
    private var cancellables = Set<AnyCancellable>()

    init() {
        setupNotifications()
    }

    private func setupNotifications() {
        NotificationCenter.default.publisher(for: Constants.Notifications.friendOnline)
            .sink { [weak self] _ in
                Task { await self?.loadFriends() }
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: Constants.Notifications.friendOffline)
            .sink { [weak self] _ in
                Task { await self?.loadFriends() }
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: Constants.Notifications.friendRequestReceived)
            .sink { [weak self] _ in
                Task { await self?.loadPendingRequests() }
            }
            .store(in: &cancellables)
    }

    // MARK: - Load Data

    func loadFriends() async {
        isLoading = true

        do {
            let response: [Friend] = try await api.request(endpoint: "/friends", method: "GET")

            DispatchQueue.main.async {
                self.friends = response
                self.isLoading = false
            }
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    func loadPendingRequests() async {
        do {
            let response: [FriendRequest] = try await api.request(endpoint: "/friends/requests/pending", method: "GET")

            DispatchQueue.main.async {
                self.pendingRequests = response
            }
        } catch {
            print("Failed to load pending requests: \(error)")
        }
    }

    func loadSentRequests() async {
        do {
            let response: [FriendRequest] = try await api.request(endpoint: "/friends/requests/sent", method: "GET")

            DispatchQueue.main.async {
                self.sentRequests = response
            }
        } catch {
            print("Failed to load sent requests: \(error)")
        }
    }

    // MARK: - Search Users

    func searchUsers(query: String) async {
        guard !query.isEmpty else {
            DispatchQueue.main.async {
                self.searchResults = []
            }
            return
        }

        do {
            let response: [User] = try await api.request(endpoint: "/users/search?q=\(query)", method: "GET")

            DispatchQueue.main.async {
                self.searchResults = response
            }
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
            }
        }
    }

    // MARK: - Friend Actions

    func sendFriendRequest(to userId: String) async {
        struct RequestBody: Codable {
            let friendId: String
        }

        isLoading = true

        do {
            struct EmptyResponse: Codable {}
            let body = RequestBody(friendId: userId)
            let _: EmptyResponse = try await api.request(
                endpoint: "/friends/request",
                method: "POST",
                body: body
            )

            DispatchQueue.main.async {
                self.successMessage = "Friend request sent"
                self.isLoading = false
            }

            // Reload sent requests
            await loadSentRequests()
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    func acceptFriendRequest(requestId: String) async {
        isLoading = true

        do {
            struct EmptyResponse: Codable {}
            let _: EmptyResponse = try await api.request(
                endpoint: "/friends/request/\(requestId)/accept",
                method: "PUT"
            )

            DispatchQueue.main.async {
                self.successMessage = "Friend request accepted"
                self.isLoading = false
            }

            // Reload data
            await loadFriends()
            await loadPendingRequests()
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    func declineFriendRequest(requestId: String) async {
        isLoading = true

        do {
            struct EmptyResponse: Codable {}
            let _: EmptyResponse = try await api.request(
                endpoint: "/friends/request/\(requestId)/decline",
                method: "PUT"
            )

            DispatchQueue.main.async {
                self.successMessage = "Friend request declined"
                self.isLoading = false
            }

            // Reload data
            await loadPendingRequests()
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    func removeFriend(friendId: String) async {
        isLoading = true

        do {
            struct EmptyResponse: Codable {}
            let _: EmptyResponse = try await api.request(
                endpoint: "/friends/\(friendId)",
                method: "DELETE"
            )

            DispatchQueue.main.async {
                self.successMessage = "Friend removed"
                self.isLoading = false
            }

            // Reload friends
            await loadFriends()
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
}
