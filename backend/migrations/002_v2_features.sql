-- Haptic Friends v2.0 Database Migration
-- This migration adds all the tables needed for v2.0 features

-- =============================================
-- USER PROFILES & AVATARS
-- =============================================

-- Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_message VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_theme VARCHAR(20) DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_vibrations_sent INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_vibrations_received INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_streak_date DATE;

-- =============================================
-- FRIEND GROUPS
-- =============================================

CREATE TABLE IF NOT EXISTS friend_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friend_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES friend_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_friend_groups_user ON friend_groups(user_id);
CREATE INDEX idx_friend_group_members_group ON friend_group_members(group_id);

-- =============================================
-- GROUP VIBRATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS group_vibrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES friend_groups(id) ON DELETE SET NULL,
    vibration_type VARCHAR(50) NOT NULL,
    pattern_id UUID REFERENCES vibration_patterns(id),
    custom_pattern_id UUID REFERENCES custom_patterns(id),
    emoji VARCHAR(10),
    message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS group_vibration_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_vibration_id UUID NOT NULL REFERENCES group_vibrations(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(group_vibration_id, recipient_id)
);

CREATE INDEX idx_group_vibrations_sender ON group_vibrations(sender_id);
CREATE INDEX idx_group_vibrations_sent_at ON group_vibrations(sent_at DESC);
CREATE INDEX idx_group_vibration_recipients_vibration ON group_vibration_recipients(group_vibration_id);
CREATE INDEX idx_group_vibration_recipients_recipient ON group_vibration_recipients(recipient_id);

-- =============================================
-- HAPTIC STORIES
-- =============================================

CREATE TABLE IF NOT EXISTS haptic_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS story_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES haptic_stories(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    vibration_type VARCHAR(50),
    pattern_id UUID REFERENCES vibration_patterns(id),
    custom_pattern_id UUID REFERENCES custom_patterns(id),
    emoji VARCHAR(10),
    text_content VARCHAR(200),
    duration_ms INTEGER DEFAULT 2000,
    UNIQUE(story_id, sequence_order)
);

CREATE TABLE IF NOT EXISTS story_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES haptic_stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, viewer_id)
);

CREATE INDEX idx_haptic_stories_user ON haptic_stories(user_id);
CREATE INDEX idx_haptic_stories_public ON haptic_stories(is_public) WHERE is_public = true;
CREATE INDEX idx_haptic_stories_expires ON haptic_stories(expires_at);
CREATE INDEX idx_story_sequences_story ON story_sequences(story_id, sequence_order);

-- =============================================
-- SCHEDULED VIBRATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS scheduled_vibrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES friend_groups(id) ON DELETE CASCADE,
    vibration_type VARCHAR(50) NOT NULL,
    pattern_id UUID REFERENCES vibration_patterns(id),
    custom_pattern_id UUID REFERENCES custom_patterns(id),
    emoji VARCHAR(10),
    message TEXT,
    scheduled_time TIME NOT NULL,
    scheduled_date DATE,
    recurrence VARCHAR(20) CHECK (recurrence IN ('once', 'daily', 'weekly', 'monthly')),
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    next_send_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK ((recipient_id IS NOT NULL AND group_id IS NULL) OR (recipient_id IS NULL AND group_id IS NOT NULL))
);

CREATE INDEX idx_scheduled_vibrations_user ON scheduled_vibrations(user_id);
CREATE INDEX idx_scheduled_vibrations_next_send ON scheduled_vibrations(next_send_at) WHERE is_active = true;

-- =============================================
-- ACHIEVEMENTS & BADGES
-- =============================================

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50),
    category VARCHAR(50) NOT NULL,
    tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    points INTEGER DEFAULT 10,
    requirement_type VARCHAR(50) NOT NULL,
    requirement_value INTEGER NOT NULL,
    is_secret BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(user_id, is_unlocked);

-- =============================================
-- DAILY CHALLENGES
-- =============================================

CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    challenge_type VARCHAR(50) NOT NULL,
    requirement JSONB NOT NULL,
    reward_points INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_challenge_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_daily_challenges_date ON daily_challenges(date DESC);
CREATE INDEX idx_user_challenge_progress_user ON user_challenge_progress(user_id);
CREATE INDEX idx_user_challenge_progress_challenge ON user_challenge_progress(challenge_id);

-- =============================================
-- LEADERBOARDS
-- =============================================

CREATE TABLE IF NOT EXISTS leaderboard_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leaderboard_type VARCHAR(50) NOT NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    score INTEGER DEFAULT 0,
    rank INTEGER,
    period_start DATE NOT NULL,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, leaderboard_type, period, period_start)
);

CREATE INDEX idx_leaderboard_scores_type_period ON leaderboard_scores(leaderboard_type, period, period_start);
CREATE INDEX idx_leaderboard_scores_rank ON leaderboard_scores(leaderboard_type, period, rank);

-- =============================================
-- SOCIAL FEED
-- =============================================

CREATE TABLE IF NOT EXISTS feed_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_type VARCHAR(50) NOT NULL CHECK (post_type IN ('shared_pattern', 'achievement', 'story', 'challenge_completed')),
    pattern_id UUID REFERENCES vibration_patterns(id),
    custom_pattern_id UUID REFERENCES custom_patterns(id),
    achievement_id UUID REFERENCES achievements(id),
    story_id UUID REFERENCES haptic_stories(id),
    caption TEXT,
    is_public BOOLEAN DEFAULT true,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feed_posts_user ON feed_posts(user_id);
CREATE INDEX idx_feed_posts_created ON feed_posts(created_at DESC) WHERE is_public = true;
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_comments_post ON post_comments(post_id);

-- =============================================
-- ANALYTICS
-- =============================================

CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    vibrations_sent INTEGER DEFAULT 0,
    vibrations_received INTEGER DEFAULT 0,
    patterns_created INTEGER DEFAULT 0,
    friends_added INTEGER DEFAULT 0,
    stories_created INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    total_session_duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

CREATE INDEX idx_user_analytics_user_date ON user_analytics(user_id, date DESC);

-- =============================================
-- PATTERN MARKETPLACE
-- =============================================

CREATE TABLE IF NOT EXISTS marketplace_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_id UUID REFERENCES custom_patterns(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    tags TEXT[],
    price_cents INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pattern_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_id UUID NOT NULL REFERENCES marketplace_patterns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pattern_id, user_id)
);

CREATE INDEX idx_marketplace_patterns_creator ON marketplace_patterns(creator_id);
CREATE INDEX idx_marketplace_patterns_category ON marketplace_patterns(category);
CREATE INDEX idx_marketplace_patterns_featured ON marketplace_patterns(is_featured) WHERE is_featured = true;
CREATE INDEX idx_pattern_ratings_pattern ON pattern_ratings(pattern_id);

-- =============================================
-- OFFLINE SYNC
-- =============================================

CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sync_queue_user_status ON sync_queue(user_id, status);
CREATE INDEX idx_sync_queue_created ON sync_queue(created_at);

-- =============================================
-- ENCRYPTION KEYS (for E2E encryption)
-- =============================================

CREATE TABLE IF NOT EXISTS user_encryption_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    key_version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_user_encryption_keys_user ON user_encryption_keys(user_id, is_active);

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- =============================================
-- TRIGGERS FOR V2.0
-- =============================================

CREATE TRIGGER update_friend_groups_updated_at BEFORE UPDATE ON friend_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at BEFORE UPDATE ON user_achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_challenge_progress_updated_at BEFORE UPDATE ON user_challenge_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_scores_updated_at BEFORE UPDATE ON leaderboard_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_patterns_updated_at BEFORE UPDATE ON marketplace_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED ACHIEVEMENTS
-- =============================================

INSERT INTO achievements (code, name, description, icon, category, tier, points, requirement_type, requirement_value) VALUES
-- Vibration Achievements
('first_vibration', 'First Touch', 'Send your first vibration', 'touch', 'vibrations', 'bronze', 5, 'vibrations_sent', 1),
('vibration_10', 'Getting Started', 'Send 10 vibrations', 'sparkles', 'vibrations', 'bronze', 10, 'vibrations_sent', 10),
('vibration_100', 'Century Club', 'Send 100 vibrations', 'fire', 'vibrations', 'silver', 25, 'vibrations_sent', 100),
('vibration_1000', 'Haptic Master', 'Send 1,000 vibrations', 'crown', 'vibrations', 'gold', 50, 'vibrations_sent', 1000),
('vibration_10000', 'Legendary', 'Send 10,000 vibrations', 'diamond', 'vibrations', 'diamond', 200, 'vibrations_sent', 10000),

-- Streak Achievements
('streak_3', 'Committed', '3-day streak', 'calendar', 'streaks', 'bronze', 10, 'streak_days', 3),
('streak_7', 'Streak Master', '7-day streak', 'fire', 'streaks', 'silver', 20, 'streak_days', 7),
('streak_30', 'Dedicated', '30-day streak', 'medal', 'streaks', 'gold', 50, 'streak_days', 30),
('streak_100', 'Unstoppable', '100-day streak', 'trophy', 'streaks', 'platinum', 100, 'streak_days', 100),
('streak_365', 'Year Round', '365-day streak', 'star', 'streaks', 'diamond', 365, 'streak_days', 365),

-- Social Achievements
('friend_1', 'First Friend', 'Add your first friend', 'person', 'social', 'bronze', 5, 'friends_count', 1),
('friend_10', 'Social Butterfly', 'Have 10 friends', 'people', 'social', 'silver', 15, 'friends_count', 10),
('friend_50', 'Popular', 'Have 50 friends', 'star', 'social', 'gold', 40, 'friends_count', 50),
('friend_100', 'Influencer', 'Have 100 friends', 'crown', 'social', 'platinum', 80, 'friends_count', 100),

-- Creative Achievements
('pattern_1', 'Creator', 'Create your first custom pattern', 'paintbrush', 'creative', 'bronze', 5, 'patterns_created', 1),
('pattern_10', 'Creative Genius', 'Create 10 custom patterns', 'palette', 'creative', 'silver', 20, 'patterns_created', 10),
('pattern_50', 'Pattern Master', 'Create 50 custom patterns', 'sparkles', 'creative', 'gold', 50, 'patterns_created', 50),

-- Story Achievements
('story_1', 'Storyteller', 'Create your first haptic story', 'book', 'stories', 'bronze', 5, 'stories_created', 1),
('story_10', 'Author', 'Create 10 haptic stories', 'books', 'stories', 'silver', 20, 'stories_created', 10),
('story_views_100', 'Popular Creator', 'Get 100 story views', 'eye', 'stories', 'gold', 30, 'story_views', 100),

-- Challenge Achievements
('challenge_1', 'Challenger', 'Complete your first daily challenge', 'target', 'challenges', 'bronze', 5, 'challenges_completed', 1),
('challenge_7', 'Week Warrior', 'Complete 7 daily challenges', 'shield', 'challenges', 'silver', 15, 'challenges_completed', 7),
('challenge_30', 'Challenge Master', 'Complete 30 daily challenges', 'trophy', 'challenges', 'gold', 50, 'challenges_completed', 30),

-- Speed Achievements
('speed_demon', 'Speed Demon', 'Send 50 vibrations in one day', 'lightning', 'special', 'gold', 40, 'vibrations_one_day', 50),
('night_owl', 'Night Owl', 'Send a vibration between 2-4 AM', 'moon', 'special', 'silver', 15, 'time_range', 1),
('early_bird', 'Early Bird', 'Send a vibration before 6 AM', 'sunrise', 'special', 'silver', 15, 'time_range', 1)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- FUNCTIONS FOR ANALYTICS & STATS
-- =============================================

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_last_streak_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
BEGIN
    SELECT last_streak_date, current_streak, longest_streak
    INTO v_last_streak_date, v_current_streak, v_longest_streak
    FROM users
    WHERE id = p_user_id;

    IF v_last_streak_date = CURRENT_DATE THEN
        -- Already updated today, do nothing
        RETURN;
    ELSIF v_last_streak_date = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Consecutive day, increment streak
        v_current_streak := v_current_streak + 1;
    ELSE
        -- Streak broken, reset to 1
        v_current_streak := 1;
    END IF;

    -- Update longest streak if current is higher
    IF v_current_streak > v_longest_streak THEN
        v_longest_streak := v_current_streak;
    END IF;

    UPDATE users
    SET current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_streak_date = CURRENT_DATE
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update user vibration counts
CREATE OR REPLACE FUNCTION increment_vibration_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update sender count
    UPDATE users
    SET total_vibrations_sent = total_vibrations_sent + 1
    WHERE id = NEW.sender_id;

    -- Update receiver count
    UPDATE users
    SET total_vibrations_received = total_vibrations_received + 1
    WHERE id = NEW.receiver_id;

    -- Update sender streak
    PERFORM update_user_streak(NEW.sender_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vibration counts
CREATE TRIGGER update_vibration_counts AFTER INSERT ON vibration_history
    FOR EACH ROW EXECUTE FUNCTION increment_vibration_count();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for user profile with stats
CREATE OR REPLACE VIEW user_profiles AS
SELECT
    u.id,
    u.email,
    u.username,
    u.avatar_url,
    u.bio,
    u.status_message,
    u.is_verified,
    u.total_vibrations_sent,
    u.total_vibrations_received,
    u.current_streak,
    u.longest_streak,
    u.created_at,
    u.last_seen,
    COUNT(DISTINCT f.friend_id) FILTER (WHERE f.status = 'accepted') as friends_count,
    COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.is_unlocked = true) as achievements_unlocked,
    COALESCE(SUM(ua_points.points), 0) as total_points
FROM users u
LEFT JOIN friendships f ON u.id = f.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
LEFT JOIN (
    SELECT ua.user_id, ua.achievement_id, a.points
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.is_unlocked = true
) ua_points ON u.id = ua_points.user_id
GROUP BY u.id;

-- View for social feed
CREATE OR REPLACE VIEW social_feed AS
SELECT
    fp.id,
    fp.user_id,
    u.username,
    u.avatar_url,
    fp.post_type,
    fp.caption,
    fp.like_count,
    fp.comment_count,
    fp.created_at,
    cp.name as pattern_name,
    cp.pattern as pattern_data,
    a.name as achievement_name,
    a.icon as achievement_icon
FROM feed_posts fp
JOIN users u ON fp.user_id = u.id
LEFT JOIN custom_patterns cp ON fp.custom_pattern_id = cp.id
LEFT JOIN achievements a ON fp.achievement_id = a.id
WHERE fp.is_public = true
ORDER BY fp.created_at DESC;

-- Migration complete
