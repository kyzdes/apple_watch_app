-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(20) UNIQUE NOT NULL,
    auth_provider VARCHAR(50) NOT NULL CHECK (auth_provider IN ('apple', 'google')),
    provider_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    biometric_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE,
    UNIQUE(auth_provider, provider_id)
);

-- Device tokens for push notifications
CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('ios', 'watch')),
    token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_type, token)
);

-- Friendships table
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    CHECK (user_id != friend_id),
    UNIQUE(user_id, friend_id)
);

-- Vibration patterns
CREATE TABLE vibration_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    pattern JSONB NOT NULL,
    is_preset BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Custom user patterns
CREATE TABLE custom_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    pattern JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Vibration history
CREATE TABLE vibration_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vibration_type VARCHAR(50) NOT NULL,
    pattern_id UUID REFERENCES vibration_patterns(id),
    custom_pattern_id UUID REFERENCES custom_patterns(id),
    emoji VARCHAR(10),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- User settings
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true,
    dnd_enabled BOOLEAN DEFAULT false,
    dnd_start_time TIME,
    dnd_end_time TIME,
    privacy_mode VARCHAR(20) DEFAULT 'friends' CHECK (privacy_mode IN ('everyone', 'friends', 'nobody')),
    vibration_preview BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_seen ON users(last_seen);
CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);
CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_vibration_history_sender ON vibration_history(sender_id);
CREATE INDEX idx_vibration_history_receiver ON vibration_history(receiver_id);
CREATE INDEX idx_vibration_history_sent_at ON vibration_history(sent_at DESC);

-- Insert preset vibration patterns
INSERT INTO vibration_patterns (name, pattern, is_preset, description) VALUES
('short_tap', '{"intervals": [0.2], "intensities": [1.0]}', true, 'Quick single tap'),
('double_tap', '{"intervals": [0.2, 0.1, 0.2], "intensities": [1.0, 0, 1.0]}', true, 'Two quick taps'),
('long_vibration', '{"intervals": [1.0], "intensities": [0.8]}', true, 'Long continuous vibration'),
('sos', '{"intervals": [0.2, 0.1, 0.2, 0.1, 0.2, 0.3, 0.5, 0.1, 0.5, 0.1, 0.5, 0.3, 0.2, 0.1, 0.2, 0.1, 0.2], "intensities": [1.0, 0, 1.0, 0, 1.0, 0, 1.0, 0, 1.0, 0, 1.0, 0, 1.0, 0, 1.0, 0, 1.0]}', true, 'SOS morse code pattern'),
('heartbeat', '{"intervals": [0.15, 0.1, 0.15, 0.6], "intensities": [0.8, 0, 0.8, 0]}', true, 'Heartbeat rhythm');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_tokens_updated_at BEFORE UPDATE ON device_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_patterns_updated_at BEFORE UPDATE ON custom_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
