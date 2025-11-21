import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var wsManager = WebSocketManager.shared
    @State private var notificationsEnabled = true
    @State private var vibrationPreviewEnabled = true
    @State private var showingLogoutAlert = false

    var body: some View {
        NavigationView {
            Form {
                // Profile Section
                Section(header: Text("Profile")) {
                    if let user = authViewModel.currentUser {
                        HStack {
                            Text("Username")
                            Spacer()
                            Text(user.username)
                                .foregroundColor(.gray)
                        }

                        HStack {
                            Text("Email")
                            Spacer()
                            Text(user.email)
                                .foregroundColor(.gray)
                        }
                    }
                }

                // Connection Status
                Section(header: Text("Connection")) {
                    HStack {
                        Circle()
                            .fill(wsManager.isConnected ? Color.green : Color.red)
                            .frame(width: 10, height: 10)

                        Text("WebSocket")

                        Spacer()

                        Text(wsManager.isConnected ? "Connected" : "Disconnected")
                            .foregroundColor(.gray)
                    }
                }

                // Preferences
                Section(header: Text("Preferences")) {
                    Toggle("Notifications", isOn: $notificationsEnabled)
                        .onChange(of: notificationsEnabled) { _ in
                            savePreferences()
                        }

                    Toggle("Vibration Preview", isOn: $vibrationPreviewEnabled)
                        .onChange(of: vibrationPreviewEnabled) { _ in
                            savePreferences()
                        }
                }

                // About
                Section(header: Text("About")) {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.gray)
                    }

                    Link(destination: URL(string: "https://hapticfriends.app/privacy")!) {
                        Text("Privacy Policy")
                    }

                    Link(destination: URL(string: "https://hapticfriends.app/terms")!) {
                        Text("Terms of Service")
                    }
                }

                // Danger Zone
                Section(header: Text("Account")) {
                    Button(action: {
                        showingLogoutAlert = true
                    }) {
                        Text("Log Out")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Settings")
            .alert("Log Out", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Log Out", role: .destructive) {
                    authViewModel.logout()
                }
            } message: {
                Text("Are you sure you want to log out?")
            }
            .onAppear {
                loadPreferences()
            }
        }
    }

    private func loadPreferences() {
        notificationsEnabled = UserDefaults.standard.bool(forKey: Constants.UserDefaults.notificationsEnabled)
        vibrationPreviewEnabled = UserDefaults.standard.bool(forKey: Constants.UserDefaults.vibrationPreviewEnabled)
    }

    private func savePreferences() {
        UserDefaults.standard.set(notificationsEnabled, forKey: Constants.UserDefaults.notificationsEnabled)
        UserDefaults.standard.set(vibrationPreviewEnabled, forKey: Constants.UserDefaults.vibrationPreviewEnabled)
    }
}

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
            .environmentObject(AuthViewModel())
    }
}
