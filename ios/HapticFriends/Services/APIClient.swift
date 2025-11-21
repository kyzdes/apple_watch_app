import Foundation

enum APIError: Error, LocalizedError {
    case invalidURL
    case networkError(Error)
    case invalidResponse
    case serverError(String)
    case decodingError(Error)
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .invalidResponse:
            return "Invalid response from server"
        case .serverError(let message):
            return message
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .unauthorized:
            return "Unauthorized. Please login again."
        }
    }
}

struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let message: String?
    let data: T?
}

class APIClient {
    static let shared = APIClient()
    private let baseURL = Constants.baseURL
    private let session: URLSession

    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: configuration)
    }

    // MARK: - Generic Request Method

    func request<T: Codable>(
        endpoint: String,
        method: String = "GET",
        body: Codable? = nil,
        requiresAuth: Bool = true
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Add authorization header if required
        if requiresAuth {
            if let token = KeychainHelper.shared.get(Constants.Keychain.accessToken) {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
        }

        // Encode body if provided
        if let body = body {
            do {
                let encoder = JSONEncoder()
                encoder.keyEncodingStrategy = .convertToSnakeCase
                request.httpBody = try encoder.encode(body)
            } catch {
                throw APIError.decodingError(error)
            }
        }

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }

            // Handle unauthorized
            if httpResponse.statusCode == 401 {
                // Try to refresh token
                if requiresAuth {
                    try await refreshToken()
                    // Retry the request
                    return try await self.request(endpoint: endpoint, method: method, body: body, requiresAuth: requiresAuth)
                } else {
                    throw APIError.unauthorized
                }
            }

            // Handle other error status codes
            if !(200...299).contains(httpResponse.statusCode) {
                if let errorResponse = try? JSONDecoder().decode(APIResponse<String>.self, from: data) {
                    throw APIError.serverError(errorResponse.message ?? "Server error")
                }
                throw APIError.invalidResponse
            }

            // Decode response
            do {
                let decoder = JSONDecoder()
                decoder.keyDecodingStrategy = .convertFromSnakeCase
                decoder.dateDecodingStrategy = .iso8601

                // Try to decode as APIResponse first
                if let apiResponse = try? decoder.decode(APIResponse<T>.self, from: data) {
                    guard let data = apiResponse.data else {
                        throw APIError.serverError(apiResponse.message ?? "No data")
                    }
                    return data
                }

                // If that fails, try to decode T directly
                return try decoder.decode(T.self, from: data)
            } catch {
                throw APIError.decodingError(error)
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }

    // MARK: - Token Refresh

    private func refreshToken() async throws {
        guard let refreshToken = KeychainHelper.shared.get(Constants.Keychain.refreshToken) else {
            throw APIError.unauthorized
        }

        let body = ["refreshToken": refreshToken]

        struct RefreshResponse: Codable {
            let accessToken: String
            let refreshToken: String
        }

        let response: RefreshResponse = try await request(
            endpoint: "/auth/refresh",
            method: "POST",
            body: body,
            requiresAuth: false
        )

        // Save new tokens
        _ = KeychainHelper.shared.save(response.accessToken, forKey: Constants.Keychain.accessToken)
        _ = KeychainHelper.shared.save(response.refreshToken, forKey: Constants.Keychain.refreshToken)
    }
}
