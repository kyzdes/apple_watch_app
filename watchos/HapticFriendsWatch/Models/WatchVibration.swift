import Foundation

struct WatchVibration: Identifiable, Codable {
    let id: String
    let senderId: String
    let senderUsername: String
    let vibrationType: String
    let emoji: String?
    let patternName: String?
    let timestamp: Date

    enum CodingKeys: String, CodingKey {
        case id = "vibrationId"
        case senderId
        case senderUsername
        case vibrationType
        case emoji
        case patternName
        case timestamp
    }
}

struct VibrationPattern {
    let intervals: [TimeInterval]
    let intensities: [Double]
}
