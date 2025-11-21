import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var username = ""
    @State private var showUsernameSheet = false

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [Color.blue.opacity(0.6), Color.purple.opacity(0.6)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 30) {
                Spacer()

                // App Logo and Title
                VStack(spacing: 16) {
                    Image(systemName: "waveform.path")
                        .font(.system(size: 80))
                        .foregroundColor(.white)

                    Text("Haptic Friends")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.white)

                    Text("Send vibrations to your friends' Apple Watch")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.9))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                Spacer()

                // Sign in buttons
                VStack(spacing: 16) {
                    SignInWithAppleButton(
                        onRequest: { request in
                            request.requestedScopes = [.email]
                        },
                        onCompletion: { result in
                            authViewModel.handleAppleSignIn(result: result)
                        }
                    )
                    .signInWithAppleButtonStyle(.white)
                    .frame(height: 50)
                    .cornerRadius(10)

                    // Google Sign In placeholder
                    Button(action: {
                        // Implement Google Sign In
                    }) {
                        HStack {
                            Image(systemName: "g.circle.fill")
                            Text("Sign in with Google")
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color.white)
                        .foregroundColor(.black)
                        .cornerRadius(10)
                    }
                }
                .padding(.horizontal, 32)

                Spacer()
            }

            // Loading indicator
            if authViewModel.isLoading {
                Color.black.opacity(0.4)
                    .ignoresSafeArea()

                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    .scaleEffect(1.5)
            }
        }
        .alert("Error", isPresented: .constant(authViewModel.errorMessage != nil)) {
            Button("OK") {
                authViewModel.errorMessage = nil
            }
        } message: {
            Text(authViewModel.errorMessage ?? "")
        }
        .sheet(isPresented: $showUsernameSheet) {
            UsernameSelectionView(username: $username) { selectedUsername in
                // Retry sign in with username
                showUsernameSheet = false
                // This would need the stored identity token
            }
        }
        .onChange(of: authViewModel.requiresUsername) { requires in
            if requires {
                showUsernameSheet = true
            }
        }
    }
}

struct UsernameSelectionView: View {
    @Binding var username: String
    @State private var isValid = false
    @State private var isChecking = false
    var onComplete: (String) -> Void

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Choose a username")
                    .font(.title)
                    .fontWeight(.bold)

                Text("3-20 characters (letters, numbers, underscore)")
                    .font(.caption)
                    .foregroundColor(.gray)

                TextField("Username", text: $username)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
                    .padding(.horizontal)
                    .onChange(of: username) { _ in
                        checkUsername()
                    }

                if isChecking {
                    ProgressView()
                }

                Button(action: {
                    onComplete(username)
                }) {
                    Text("Continue")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(isValid ? Color.blue : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .disabled(!isValid)
                .padding(.horizontal)

                Spacer()
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func checkUsername() {
        guard username.count >= 3, username.count <= 20 else {
            isValid = false
            return
        }

        let pattern = "^[a-zA-Z0-9_]+$"
        let regex = try? NSRegularExpression(pattern: pattern)
        let range = NSRange(location: 0, length: username.utf16.count)
        let matches = regex?.firstMatch(in: username, range: range) != nil

        isValid = matches

        if isValid {
            isChecking = true
            Task {
                let available = await AuthService.shared.checkUsername(username)
                DispatchQueue.main.async {
                    isValid = available
                    isChecking = false
                }
            }
        }
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView()
            .environmentObject(AuthViewModel())
    }
}
