import Foundation

struct User: Codable, Identifiable, Equatable {
    let id: String
    let email: String
    let username: String
    let createdAt: Date?
    let lastSeen: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case username
        case createdAt = "created_at"
        case lastSeen = "last_seen"
    }
}

struct Friend: Codable, Identifiable, Equatable {
    let id: String
    let username: String
    let email: String?
    let lastSeen: Date?
    let isActive: Bool
    let friendshipStatus: String
    let hasWatch: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case username
        case email
        case lastSeen = "last_seen"
        case isActive = "is_active"
        case friendshipStatus = "friendship_status"
        case hasWatch = "has_watch"
    }

    var isOnline: Bool {
        guard let lastSeen = lastSeen else { return false }
        let fiveMinutesAgo = Date().addingTimeInterval(-5 * 60)
        return lastSeen > fiveMinutesAgo
    }
}

struct FriendRequest: Codable, Identifiable {
    let id: String
    let username: String
    let email: String?
    let requestedAt: Date
    let requestId: String

    enum CodingKeys: String, CodingKey {
        case id
        case username
        case email
        case requestedAt = "requested_at"
        case requestId = "request_id"
    }
}

struct AuthResponse: Codable {
    let success: Bool
    let message: String
    let data: AuthData?
    let requiresUsername: Bool?
}

struct AuthData: Codable {
    let user: User
    let accessToken: String
    let refreshToken: String

    enum CodingKeys: String, CodingKey {
        case user
        case accessToken = "accessToken"
        case refreshToken = "refreshToken"
    }
}
