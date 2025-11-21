import Foundation
import AuthenticationServices
import Combine

class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var requiresUsername = false
    @Published var currentUser: User?

    private let authService = AuthService.shared
    private var cancellables = Set<AnyCancellable>()

    init() {
        checkAuthStatus()
    }

    func checkAuthStatus() {
        isAuthenticated = authService.isAuthenticated()

        if isAuthenticated {
            // Load user profile
            Task {
                await loadUserProfile()
            }
        }
    }

    // MARK: - Apple Sign In

    func handleAppleSignIn(result: Result<ASAuthorization, Error>, username: String? = nil) {
        switch result {
        case .success(let authorization):
            guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let identityTokenData = appleIDCredential.identityToken,
                  let identityToken = String(data: identityTokenData, encoding: .utf8) else {
                errorMessage = "Failed to get Apple ID credentials"
                return
            }

            Task {
                await signInWithApple(identityToken: identityToken, username: username)
            }

        case .failure(let error):
            errorMessage = error.localizedDescription
        }
    }

    private func signInWithApple(identityToken: String, username: String?) async {
        isLoading = true
        errorMessage = nil

        do {
            let authData = try await authService.signInWithApple(
                identityToken: identityToken,
                username: username
            )

            DispatchQueue.main.async {
                self.currentUser = authData.user
                self.isAuthenticated = true
                self.isLoading = false
                self.requiresUsername = false

                // Connect to WebSocket
                WebSocketManager.shared.connect()
            }
        } catch AuthError.usernameRequired {
            DispatchQueue.main.async {
                self.requiresUsername = true
                self.isLoading = false
            }
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    // MARK: - Google Sign In (placeholder)

    func signInWithGoogle(idToken: String, username: String? = nil) async {
        isLoading = true
        errorMessage = nil

        do {
            let authData = try await authService.signInWithGoogle(
                idToken: idToken,
                username: username
            )

            DispatchQueue.main.async {
                self.currentUser = authData.user
                self.isAuthenticated = true
                self.isLoading = false
                self.requiresUsername = false

                // Connect to WebSocket
                WebSocketManager.shared.connect()
            }
        } catch AuthError.usernameRequired {
            DispatchQueue.main.async {
                self.requiresUsername = true
                self.isLoading = false
            }
        } catch {
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    // MARK: - Username Check

    func checkUsername(_ username: String) async -> Bool {
        do {
            return try await authService.checkUsername(username)
        } catch {
            return false
        }
    }

    // MARK: - Logout

    func logout() {
        Task {
            do {
                try await authService.logout()

                DispatchQueue.main.async {
                    self.isAuthenticated = false
                    self.currentUser = nil

                    // Disconnect WebSocket
                    WebSocketManager.shared.disconnect()
                }
            } catch {
                print("Logout error: \(error)")
                // Still logout locally
                DispatchQueue.main.async {
                    self.isAuthenticated = false
                    self.currentUser = nil
                    WebSocketManager.shared.disconnect()
                }
            }
        }
    }

    // MARK: - Load Profile

    private func loadUserProfile() async {
        do {
            let api = APIClient.shared
            let user: User = try await api.request(endpoint: "/users/profile", method: "GET")

            DispatchQueue.main.async {
                self.currentUser = user
            }
        } catch {
            print("Failed to load user profile: \(error)")
        }
    }
}
