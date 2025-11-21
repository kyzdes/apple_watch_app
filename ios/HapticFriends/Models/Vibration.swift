import Foundation

struct VibrationPattern: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let pattern: Pattern
    let isPreset: Bool
    let description: String?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case pattern
        case isPreset = "is_preset"
        case description
    }

    struct Pattern: Codable, Equatable {
        let intervals: [Double]
        let intensities: [Double]
    }
}

struct CustomPattern: Codable, Identifiable {
    let id: String
    let userId: String
    let name: String
    let pattern: VibrationPattern.Pattern
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name
        case pattern
        case createdAt = "created_at"
    }
}

struct VibrationHistory: Codable, Identifiable {
    let id: String
    let senderId: String
    let receiverId: String
    let vibrationType: String
    let patternId: String?
    let customPatternId: String?
    let emoji: String?
    let sentAt: Date
    let deliveredAt: Date?
    let readAt: Date?
    let senderUsername: String?
    let receiverUsername: String?
    let patternName: String?

    enum CodingKeys: String, CodingKey {
        case id
        case senderId = "sender_id"
        case receiverId = "receiver_id"
        case vibrationType = "vibration_type"
        case patternId = "pattern_id"
        case customPatternId = "custom_pattern_id"
        case emoji
        case sentAt = "sent_at"
        case deliveredAt = "delivered_at"
        case readAt = "read_at"
        case senderUsername = "sender_username"
        case receiverUsername = "receiver_username"
        case patternName = "pattern_name"
    }

    var isRead: Bool {
        readAt != nil
    }

    var isDelivered: Bool {
        deliveredAt != nil
    }
}

struct VibrationRequest: Codable {
    let receiverId: String
    let vibrationType: String
    let patternId: String?
    let customPatternId: String?
    let emoji: String?

    enum CodingKeys: String, CodingKey {
        case receiverId = "receiverId"
        case vibrationType = "vibrationType"
        case patternId = "patternId"
        case customPatternId = "customPatternId"
        case emoji
    }
}

struct IncomingVibration: Codable {
    let vibrationId: String
    let senderId: String
    let senderUsername: String
    let vibrationType: String
    let emoji: String?
    let patternName: String?
    let timestamp: Date

    enum CodingKeys: String, CodingKey {
        case vibrationId = "vibrationId"
        case senderId = "senderId"
        case senderUsername = "senderUsername"
        case vibrationType = "vibrationType"
        case emoji
        case patternName = "patternName"
        case timestamp
    }
}
