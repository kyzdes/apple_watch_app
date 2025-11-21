import Foundation
import AuthenticationServices

class AuthService {
    static let shared = AuthService()
    private let api = APIClient.shared

    private init() {}

    // MARK: - Apple Sign In

    func signInWithApple(identityToken: String, username: String? = nil) async throws -> AuthData {
        struct AppleSignInBody: Codable {
            let identityToken: String
            let username: String?
        }

        let body = AppleSignInBody(identityToken: identityToken, username: username)
        let response: AuthResponse = try await api.request(
            endpoint: "/auth/apple",
            method: "POST",
            body: body,
            requiresAuth: false
        )

        guard response.success, let data = response.data else {
            if let requiresUsername = response.requiresUsername, requiresUsername {
                throw AuthError.usernameRequired
            }
            throw APIError.serverError(response.message ?? "Authentication failed")
        }

        // Save tokens
        saveAuthData(data)

        return data
    }

    // MARK: - Google Sign In

    func signInWithGoogle(idToken: String, username: String? = nil) async throws -> AuthData {
        struct GoogleSignInBody: Codable {
            let idToken: String
            let username: String?
        }

        let body = GoogleSignInBody(idToken: idToken, username: username)
        let response: AuthResponse = try await api.request(
            endpoint: "/auth/google",
            method: "POST",
            body: body,
            requiresAuth: false
        )

        guard response.success, let data = response.data else {
            if let requiresUsername = response.requiresUsername, requiresUsername {
                throw AuthError.usernameRequired
            }
            throw APIError.serverError(response.message ?? "Authentication failed")
        }

        // Save tokens
        saveAuthData(data)

        return data
    }

    // MARK: - Username Check

    func checkUsername(_ username: String) async throws -> Bool {
        struct UsernameCheckResponse: Codable {
            let available: Bool
        }

        let response: UsernameCheckResponse = try await api.request(
            endpoint: "/auth/username/\(username)",
            method: "GET",
            requiresAuth: false
        )

        return response.available
    }

    // MARK: - Logout

    func logout() async throws {
        struct EmptyResponse: Codable {}

        do {
            let _: EmptyResponse = try await api.request(
                endpoint: "/auth/logout",
                method: "POST"
            )
        } catch {
            // Continue with local logout even if API call fails
            print("Logout API call failed: \(error)")
        }

        // Clear local data
        clearAuthData()
    }

    // MARK: - Register Device Token

    func registerDeviceToken(_ token: String, deviceType: String) async throws {
        struct DeviceTokenBody: Codable {
            let token: String
            let deviceType: String
        }

        struct EmptyResponse: Codable {}

        let body = DeviceTokenBody(token: token, deviceType: deviceType)
        let _: EmptyResponse = try await api.request(
            endpoint: "/users/device-token",
            method: "POST",
            body: body
        )
    }

    // MARK: - Helper Methods

    private func saveAuthData(_ data: AuthData) {
        _ = KeychainHelper.shared.save(data.accessToken, forKey: Constants.Keychain.accessToken)
        _ = KeychainHelper.shared.save(data.refreshToken, forKey: Constants.Keychain.refreshToken)
        _ = KeychainHelper.shared.save(data.user.id, forKey: Constants.Keychain.userId)
        _ = KeychainHelper.shared.save(data.user.username, forKey: Constants.Keychain.username)
        UserDefaults.standard.set(true, forKey: Constants.UserDefaults.isAuthenticated)
    }

    private func clearAuthData() {
        _ = KeychainHelper.shared.delete(Constants.Keychain.accessToken)
        _ = KeychainHelper.shared.delete(Constants.Keychain.refreshToken)
        _ = KeychainHelper.shared.delete(Constants.Keychain.userId)
        _ = KeychainHelper.shared.delete(Constants.Keychain.username)
        UserDefaults.standard.set(false, forKey: Constants.UserDefaults.isAuthenticated)
    }

    func isAuthenticated() -> Bool {
        return KeychainHelper.shared.get(Constants.Keychain.accessToken) != nil
    }

    func getCurrentUserId() -> String? {
        return KeychainHelper.shared.get(Constants.Keychain.userId)
    }

    func getCurrentUsername() -> String? {
        return KeychainHelper.shared.get(Constants.Keychain.username)
    }
}

enum AuthError: Error, LocalizedError {
    case usernameRequired
    case invalidCredentials
    case networkError

    var errorDescription: String? {
        switch self {
        case .usernameRequired:
            return "Please choose a username"
        case .invalidCredentials:
            return "Invalid credentials"
        case .networkError:
            return "Network error occurred"
        }
    }
}
