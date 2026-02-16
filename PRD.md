# Haptic Friends — Product Requirements Document

**Version:** 2.0.0 ("Touch Revolution")
**Last Updated:** 2026-02-16
**Status:** Released (2025-11-22)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Audience](#3-target-audience)
4. [Product Vision & Goals](#4-product-vision--goals)
5. [User Personas](#5-user-personas)
6. [User Stories & Journeys](#6-user-stories--journeys)
7. [Feature Specification](#7-feature-specification)
   - 7.1 [Authentication & Onboarding](#71-authentication--onboarding)
   - 7.2 [Friend Management](#72-friend-management)
   - 7.3 [Core Haptic Messaging](#73-core-haptic-messaging)
   - 7.4 [Custom Pattern Creation](#74-custom-pattern-creation)
   - 7.5 [Haptic Drawing Canvas](#75-haptic-drawing-canvas)
   - 7.6 [Group Vibrations](#76-group-vibrations)
   - 7.7 [Haptic Stories](#77-haptic-stories)
   - 7.8 [Scheduled Vibrations](#78-scheduled-vibrations)
   - 7.9 [Achievement System & Gamification](#79-achievement-system--gamification)
   - 7.10 [Daily Challenges & Leaderboards](#710-daily-challenges--leaderboards)
   - 7.11 [Social Feed](#711-social-feed)
   - 7.12 [User Profiles & Analytics](#712-user-profiles--analytics)
   - 7.13 [Pattern Marketplace](#713-pattern-marketplace)
   - 7.14 [Notifications](#714-notifications)
   - 7.15 [Offline Mode & Sync](#715-offline-mode--sync)
8. [System Architecture](#8-system-architecture)
   - 8.1 [High-Level Architecture](#81-high-level-architecture)
   - 8.2 [Technology Stack](#82-technology-stack)
   - 8.3 [Data Model](#83-data-model)
   - 8.4 [API Design](#84-api-design)
   - 8.5 [Real-Time Communication](#85-real-time-communication)
9. [Platform Support](#9-platform-support)
10. [Security & Privacy](#10-security--privacy)
11. [Performance Requirements](#11-performance-requirements)
12. [Monetization Strategy](#12-monetization-strategy)
13. [Success Metrics & KPIs](#13-success-metrics--kpis)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Future Roadmap (v3.0+)](#15-future-roadmap-v30)
16. [Glossary](#16-glossary)

---

## 1. Executive Summary

**Haptic Friends** is a cross-platform social haptic communication application that enables users to send vibrations, tactile patterns, and emojis to close friends and romantic partners in real time. It reimagines digital intimacy by translating emotion into physical touch across any distance.

The product spans four client platforms — **iOS**, **watchOS**, **Web (PWA)**, and a **Node.js backend** — connected through WebSockets for sub-second delivery. Version 2.0 evolved the app from a simple vibration-sharing utility into a full social haptic platform with group messaging, stories, gamification, a drawing canvas, scheduled sends, a social feed, and a pattern marketplace.

**Key differentiator:** There is no direct competitor in the social haptic communication space. Haptic Friends is first-to-market in building a social network around the sense of touch.

---

## 2. Problem Statement

### The Gap in Digital Communication

Modern messaging apps (iMessage, WhatsApp, Telegram) transmit text, images, audio, and video — but they completely ignore **touch**, the most fundamental human sense for conveying emotion and intimacy.

| Channel | Emotion Bandwidth | Intimacy Level |
|---------|-------------------|----------------|
| Text | Low | Low |
| Emoji/GIF | Medium | Low |
| Voice | High | Medium |
| Video | High | Medium |
| **Physical touch** | **Very High** | **Very High** |

For couples in long-distance relationships, close friends separated by geography, or anyone who wants to express affection beyond words, there is no digital tool that recreates the feeling of a gentle tap, a heartbeat, or a squeeze of the hand.

### Core Problems Solved

1. **Emotional distance** — Couples and close friends lack a way to feel physically connected when apart.
2. **Expressiveness ceiling** — Text and emoji cannot convey the nuance of a touch, a rhythm, or a heartbeat.
3. **Habitual engagement** — Existing messaging platforms offer no tactile feedback loop that creates a daily ritual of connection.
4. **Creative limitation** — Users cannot compose their own tactile language; they are limited to predefined emoji.

---

## 3. Target Audience

### Primary: Couples & Close Relationships

| Attribute | Detail |
|-----------|--------|
| **Relationship** | Romantic partners, best friends, close family members |
| **Key use case** | Sending "thinking of you" touches, good-morning heartbeats, goodnight taps |
| **Demographics** | 18–35, smartphone-native, emotionally expressive |
| **Geography** | Global, with emphasis on long-distance relationships |
| **Devices** | iPhone + Apple Watch (primary), Web (secondary) |

### Secondary: Social & Entertainment Users

- Users drawn to gamification (achievements, leaderboards, challenges)
- Creators who enjoy designing and sharing custom haptic patterns
- Communities forming around the social feed and marketplace

### Anti-Personas (Not Targeted)

- Enterprise / business communication users
- Users seeking text-based group chat functionality
- Users without haptic-capable devices

---

## 4. Product Vision & Goals

### Vision Statement

> Transform digital communication by making touch a first-class medium — creating the world's first social haptic platform where emotion is felt, not just read.

### Strategic Goals (v2.0)

| # | Goal | Measure |
|---|------|---------|
| G1 | Make haptic messaging a daily habit for couples | DAU/MAU ratio ≥ 40% |
| G2 | Enable rich creative expression through custom patterns | ≥ 30% of users create custom patterns |
| G3 | Build social network effects through feed, stories, marketplace | Viral coefficient ≥ 1.5 |
| G4 | Deepen engagement through gamification | Day-7 retention ≥ 50% |
| G5 | Establish multi-platform presence | Feature parity across iOS, watchOS, Web |

---

## 5. User Personas

### Persona 1: "Long-Distance Lover" — Maya, 24

- **Situation:** In a long-distance relationship for 8 months. Uses FaceTime daily but misses physical affection.
- **Behavior:** Sends 5–10 messages/day to partner. Wants quick, emotional micro-interactions.
- **Goal:** Feel physically connected to partner despite 2,000 km distance.
- **Key features:** Heartbeat pattern, scheduled good-morning vibrations, haptic stories, drawing canvas.
- **Frustration:** Text feels cold. Emoji are generic. Video calls require scheduling.
- **Quote:** *"I just want them to feel me thinking about them, without having to type a single word."*

### Persona 2: "Ritual Builder" — James, 29

- **Situation:** Married, works long hours. Wants small daily rituals to stay connected.
- **Behavior:** Routine-oriented. Values consistency. Sends the same good-morning pattern every day.
- **Goal:** Maintain an effortless daily connection habit with minimal friction.
- **Key features:** Scheduled vibrations, streak tracking, achievements, notification settings.
- **Frustration:** Forgetting to send a morning text feels like failing.
- **Quote:** *"I set it up once, and now every morning at 7 AM she gets a heartbeat from me. She loves it."*

### Persona 3: "Creative Expresser" — Aiko, 21

- **Situation:** College student, uses Haptic Friends with a group of 4 close friends. Loves creating patterns.
- **Behavior:** Spends time on the drawing canvas and marketplace. Shares patterns on social feed.
- **Goal:** Express creativity and connect with friends through unique haptic art.
- **Key features:** Drawing canvas, custom patterns, social feed, marketplace, achievements.
- **Frustration:** Limited preset patterns don't capture the feelings she wants to convey.
- **Quote:** *"I made a pattern that feels like rain. My friends say they actually feel the drops."*

---

## 6. User Stories & Journeys

### Epic 1: First-Time User Onboarding

| ID | Story | Priority |
|----|-------|----------|
| US-1.1 | As a new user, I want to sign in with my Apple ID so I don't need to create a new account | P0 |
| US-1.2 | As a new user, I want to sign in with Google so I can use my existing account | P0 |
| US-1.3 | As a new user, I want to choose a unique username so my friends can find me | P0 |
| US-1.4 | As a new user, I want to search for friends by username so I can connect with people I know | P0 |

### Epic 2: Core Haptic Messaging

| ID | Story | Priority |
|----|-------|----------|
| US-2.1 | As a user, I want to send a vibration pattern to a friend so they feel my touch | P0 |
| US-2.2 | As a user, I want to choose from preset patterns (tap, double-tap, heartbeat, etc.) so I can quickly express common feelings | P0 |
| US-2.3 | As a user, I want to attach an emoji to my vibration so my friend understands the emotion | P0 |
| US-2.4 | As a user, I want to receive real-time vibrations on my phone/watch so I feel the touch instantly | P0 |
| US-2.5 | As a user, I want to see when my vibration was delivered and read so I know my friend received it | P1 |
| US-2.6 | As a user, I want to view my sent and received history so I can reflect on our interactions | P1 |

### Epic 3: Creative Tools

| ID | Story | Priority |
|----|-------|----------|
| US-3.1 | As a user, I want to create custom vibration patterns with specific timing and intensity | P1 |
| US-3.2 | As a user, I want to draw patterns on a canvas and convert them to haptic sequences | P1 |
| US-3.3 | As a user, I want to preview a pattern's vibration before sending it | P1 |
| US-3.4 | As a user, I want to save and reuse my custom patterns | P1 |

### Epic 4: Social & Community

| ID | Story | Priority |
|----|-------|----------|
| US-4.1 | As a user, I want to send vibrations to a group of friends simultaneously | P1 |
| US-4.2 | As a user, I want to create multi-step haptic stories that my friends can view | P1 |
| US-4.3 | As a user, I want to share my patterns and achievements in a social feed | P2 |
| US-4.4 | As a user, I want to like and comment on my friends' shared patterns | P2 |
| US-4.5 | As a user, I want to browse and download trending community patterns | P2 |

### Epic 5: Engagement & Retention

| ID | Story | Priority |
|----|-------|----------|
| US-5.1 | As a user, I want to schedule recurring vibrations so my partner gets them automatically | P1 |
| US-5.2 | As a user, I want to earn achievements for milestones (streaks, sends, creativity) | P2 |
| US-5.3 | As a user, I want daily challenges that give me fresh reasons to use the app | P2 |
| US-5.4 | As a user, I want to see my rank on leaderboards so I can compete with friends | P2 |

### User Journey: Maya Sends a Goodnight Touch

```
1. Maya opens the app at 11 PM
2. Sees partner "Alex" online (green dot)
3. Taps Alex → pattern picker appears
4. Selects "heartbeat" pattern + 💜 emoji
5. Taps "Send"
6. Alex's iPhone vibrates with the heartbeat pattern
7. Alex's Apple Watch taps the heartbeat on their wrist
8. Push notification: "Maya sent you a 💜 heartbeat"
9. Alex opens app → vibration replays → marks as read
10. Maya sees "Read ✓" status
11. Alex sends back a custom "hug" pattern
12. Both feel connected. Total time: ~15 seconds each.
```

---

## 7. Feature Specification

### 7.1 Authentication & Onboarding

**Description:** Passwordless authentication via OAuth providers (Apple Sign In, Google OAuth 2.0). New users select a unique username during onboarding.

**Functional Requirements:**

| ID | Requirement | Status |
|----|-------------|--------|
| AUTH-1 | Sign in / register via Apple Sign In | ✅ Implemented |
| AUTH-2 | Sign in / register via Google OAuth 2.0 | ✅ Implemented |
| AUTH-3 | JWT access token (15-min expiry) + refresh token (7-day expiry) | ✅ Implemented |
| AUTH-4 | Automatic token refresh on 401 response | ✅ Implemented |
| AUTH-5 | Username availability check during onboarding | ✅ Implemented |
| AUTH-6 | Username constraints: 3–20 chars, alphanumeric + underscores | ✅ Implemented |
| AUTH-7 | Secure token storage: Keychain (iOS), localStorage (Web) | ✅ Implemented |
| AUTH-8 | Logout invalidates refresh token in Redis | ✅ Implemented |

**Token Flow:**

```
Client → OAuth Provider (Apple/Google) → ID Token
Client → POST /api/v1/auth/{apple|google} → { accessToken, refreshToken, user }
Client → Authorization: Bearer {accessToken} → API calls
Client → POST /api/v1/auth/refresh → { accessToken } (when expired)
```

---

### 7.2 Friend Management

**Description:** Users discover, add, and manage friends. Friendships are bidirectional and require mutual consent (request → accept).

**Functional Requirements:**

| ID | Requirement | Status |
|----|-------------|--------|
| FRD-1 | Search users by username (partial match) | ✅ Implemented |
| FRD-2 | Send friend request | ✅ Implemented |
| FRD-3 | Accept / decline friend request | ✅ Implemented |
| FRD-4 | View pending requests (incoming) | ✅ Implemented |
| FRD-5 | Remove a friend | ✅ Implemented |
| FRD-6 | Real-time online/offline status via WebSocket | ✅ Implemented |
| FRD-7 | Block a user (prevents further interaction) | ✅ Implemented |
| FRD-8 | Create friend groups (Family, Close Friends, etc.) | ✅ Implemented |

**Friendship States:**
```
pending → accepted
pending → declined
accepted → removed (soft delete)
any → blocked
```

---

### 7.3 Core Haptic Messaging

**Description:** The primary feature — sending vibration patterns with optional emojis to friends in real time.

**Functional Requirements:**

| ID | Requirement | Status |
|----|-------------|--------|
| VIB-1 | Send a vibration to a single friend | ✅ Implemented |
| VIB-2 | 5 preset patterns: short_tap, double_tap, long_vibration, sos, heartbeat | ✅ Implemented |
| VIB-3 | Attach one of 12+ emojis to a vibration | ✅ Implemented |
| VIB-4 | Real-time delivery via WebSocket (< 500ms latency target) | ✅ Implemented |
| VIB-5 | Push notification via APNS for offline recipients | ✅ Implemented |
| VIB-6 | Delivery status tracking (sent → delivered → read) | ✅ Implemented |
| VIB-7 | Unread vibration count badge | ✅ Implemented |
| VIB-8 | History: last 50 sent + last 50 received | ✅ Implemented |

**Vibration Pattern Schema:**
```json
{
  "intervals": [0.15, 0.1, 0.15, 0.6],
  "intensities": [0.8, 0, 0.8, 0]
}
```

- `intervals`: Array of durations in seconds. Each entry represents how long a segment lasts.
- `intensities`: Array of intensity values (0.0–1.0). `0` = pause, `1.0` = max vibration.
- Arrays must be equal length. Patterns are played sequentially.

**Emoji Support:**
❤️ 😊 😂 🥰 😘 🤗 👋 🎉 🔥 💜 ⭐ 🌙 (expandable)

---

### 7.4 Custom Pattern Creation

**Description:** Users can create their own vibration patterns with custom timing and intensity arrays.

| ID | Requirement | Status |
|----|-------------|--------|
| PAT-1 | Create custom pattern with name, intervals, intensities | ✅ Implemented |
| PAT-2 | Pattern name unique per user (max 50 chars) | ✅ Implemented |
| PAT-3 | List user's custom patterns | ✅ Implemented |
| PAT-4 | Delete a custom pattern | ✅ Implemented |
| PAT-5 | Pattern data stored as JSONB | ✅ Implemented |

---

### 7.5 Haptic Drawing Canvas

**Description:** An interactive visual canvas where users draw vibration patterns by touch or mouse. The drawing is automatically converted into a haptic sequence based on the position and pressure of the strokes.

| ID | Requirement | Status |
|----|-------------|--------|
| DRW-1 | Interactive canvas with mouse/touch drawing | ✅ Implemented |
| DRW-2 | X-axis = time, Y-axis = intensity mapping | ✅ Implemented |
| DRW-3 | Real-time haptic preview during drawing (on supported devices) | ✅ Implemented |
| DRW-4 | Intensity control slider | ✅ Implemented |
| DRW-5 | Pattern simplification algorithm (smooth noisy input) | ✅ Implemented |
| DRW-6 | Save drawing as reusable custom pattern | ✅ Implemented |
| DRW-7 | Clear canvas / undo support | ✅ Implemented |

**Web route:** `/draw`

---

### 7.6 Group Vibrations

**Description:** Send a single vibration to multiple friends simultaneously via friend groups.

| ID | Requirement | Status |
|----|-------------|--------|
| GRP-1 | Create named friend group with emoji and description | ✅ Implemented |
| GRP-2 | Add/remove members from a group | ✅ Implemented |
| GRP-3 | Send a vibration to all members of a group in one action | ✅ Implemented |
| GRP-4 | Per-recipient delivery and read tracking | ✅ Implemented |
| GRP-5 | Group vibration history | ✅ Implemented |
| GRP-6 | List, update, delete groups | ✅ Implemented |

---

### 7.7 Haptic Stories

**Description:** Multi-step haptic experiences — a sequence of vibrations, emojis, and text that friends can view. Stories expire after 24 hours (similar to Instagram Stories).

| ID | Requirement | Status |
|----|-------------|--------|
| STR-1 | Create a story with title + ordered sequence of steps | ✅ Implemented |
| STR-2 | Each step: vibration pattern + emoji + text (up to 200 chars) + duration | ✅ Implemented |
| STR-3 | 24-hour expiration (configurable via `expires_at`) | ✅ Implemented |
| STR-4 | Friends-only story feed | ✅ Implemented |
| STR-5 | View count tracking (unique viewers) | ✅ Implemented |
| STR-6 | Template stories (Good morning, Goodnight, Love you) | ✅ Implemented |
| STR-7 | Public/private visibility toggle | ✅ Implemented |
| STR-8 | Delete own stories | ✅ Implemented |

---

### 7.8 Scheduled Vibrations

**Description:** Schedule vibrations to be sent automatically at specific times, with optional recurrence. Time-zone aware.

| ID | Requirement | Status |
|----|-------------|--------|
| SCH-1 | Schedule a vibration for a specific date and time | ✅ Implemented |
| SCH-2 | Recurrence options: once, daily, weekly, monthly | ✅ Implemented |
| SCH-3 | Target: individual friend or group | ✅ Implemented |
| SCH-4 | Timezone-aware delivery (stored per schedule) | ✅ Implemented |
| SCH-5 | Activate/deactivate a schedule | ✅ Implemented |
| SCH-6 | Track last_sent_at and next_send_at | ✅ Implemented |
| SCH-7 | CRUD for scheduled vibrations | ✅ Implemented |

**Constraint:** A schedule targets either a `recipient_id` (individual) XOR a `group_id` (group), never both.

---

### 7.9 Achievement System & Gamification

**Description:** A comprehensive achievement system that rewards milestones across multiple categories. 25+ achievements with 5 tiers (Bronze → Diamond).

**Achievement Categories:**

| Category | Examples | Tier Range |
|----------|----------|------------|
| **Vibrations** | First Touch (1 sent), Century Club (100), Legendary (10K) | Bronze → Diamond |
| **Streaks** | Committed (3d), Streak Master (7d), Year Round (365d) | Bronze → Diamond |
| **Social** | First Friend (1), Social Butterfly (10), Influencer (100) | Bronze → Platinum |
| **Creative** | Creator (1 pattern), Creative Genius (10), Pattern Master (50) | Bronze → Gold |
| **Stories** | Storyteller (1), Author (10), Popular Creator (100 views) | Bronze → Gold |
| **Challenges** | Challenger (1), Week Warrior (7), Challenge Master (30) | Bronze → Gold |
| **Special** | Speed Demon (50/day), Night Owl (2–4 AM), Early Bird (before 6 AM) | Silver → Gold |

**Points system:** Each achievement awards points (5–365). Total points determine leaderboard ranking.

**Progress tracking:** `user_achievements` table tracks incremental progress toward each achievement with `progress` and `is_unlocked` fields.

---

### 7.10 Daily Challenges & Leaderboards

**Description:** Fresh daily tasks that encourage varied app usage. Leaderboards rank users by score across multiple time periods.

**Daily Challenges:**

| ID | Requirement | Status |
|----|-------------|--------|
| CHL-1 | One new challenge per day (generated or curated) | ✅ Implemented |
| CHL-2 | Challenge types: send-based, create-based, time-based, social | ✅ Implemented |
| CHL-3 | Progress tracking with completion flag | ✅ Implemented |
| CHL-4 | Reward points on completion | ✅ Implemented |

**Leaderboards:**

| ID | Requirement | Status |
|----|-------------|--------|
| LDB-1 | Leaderboard types: vibrations sent, streaks, achievements, creative | ✅ Implemented |
| LDB-2 | Time periods: daily, weekly, monthly, all-time | ✅ Implemented |
| LDB-3 | Rank calculation and display | ✅ Implemented |

---

### 7.11 Social Feed

**Description:** A public or friends-only feed where users share patterns, achievements, stories, and challenge completions.

| ID | Requirement | Status |
|----|-------------|--------|
| FED-1 | Create posts (types: shared_pattern, achievement, story, challenge_completed) | ✅ Implemented |
| FED-2 | Like / unlike posts (with like_count denormalization) | ✅ Implemented |
| FED-3 | Comment on posts | ✅ Implemented |
| FED-4 | Trending patterns endpoint (public, no auth required) | ✅ Implemented |
| FED-5 | Chronological feed with pagination | ✅ Implemented |
| FED-6 | Public/private post visibility | ✅ Implemented |
| FED-7 | Delete own posts | ✅ Implemented |

**Web route:** `/feed`

---

### 7.12 User Profiles & Analytics

**Description:** Rich user profiles with avatars, bios, achievement badges, and an analytics dashboard.

**Profile Fields:**

| Field | Type | Constraint |
|-------|------|-----------|
| `avatar_url` | TEXT | URL to avatar image |
| `bio` | TEXT | Free-text bio |
| `status_message` | VARCHAR(100) | Short status |
| `profile_theme` | VARCHAR(20) | Visual theme (default: "default") |
| `is_verified` | BOOLEAN | Verified badge |
| `total_vibrations_sent` | INTEGER | Auto-incremented via trigger |
| `total_vibrations_received` | INTEGER | Auto-incremented via trigger |
| `current_streak` | INTEGER | Calculated daily |
| `longest_streak` | INTEGER | High-water mark |

**Analytics (user_analytics table):** Daily aggregates per user — vibrations sent/received, patterns created, friends added, stories created, challenges completed, session count, session duration.

**Database view:** `user_profiles` — joins user data with friend count, achievements unlocked, and total points.

---

### 7.13 Pattern Marketplace

**Description:** A community marketplace where users can publish, browse, rate, and download haptic patterns.

| ID | Requirement | Status |
|----|-------------|--------|
| MKT-1 | Publish a custom pattern to the marketplace with title, description, category, tags | ✅ Implemented |
| MKT-2 | Free and priced patterns (price_cents field, defaults to free) | ✅ Implemented |
| MKT-3 | Browse by category, featured, trending | ✅ Implemented |
| MKT-4 | Rate patterns (1–5 stars) with optional review text | ✅ Implemented |
| MKT-5 | Download count tracking | ✅ Implemented |
| MKT-6 | Approval workflow (is_approved flag) | ✅ Implemented |
| MKT-7 | Featured pattern curation (is_featured flag) | ✅ Implemented |

---

### 7.14 Notifications

**Description:** In-app notification system and APNS push notifications for iOS/watchOS.

| ID | Requirement | Status |
|----|-------------|--------|
| NTF-1 | In-app notifications stored in `notifications` table | ✅ Implemented |
| NTF-2 | Notification types: vibration, friend_request, achievement, challenge, story, social | ✅ Implemented |
| NTF-3 | Read/unread status tracking | ✅ Implemented |
| NTF-4 | APNS push for iOS/watchOS when user is offline | ✅ Implemented |
| NTF-5 | Device token registration (iOS, Watch) | ✅ Implemented |
| NTF-6 | Do Not Disturb mode with configurable time window | ✅ Implemented |

---

### 7.15 Offline Mode & Sync

**Description:** Queue actions when offline and synchronize when connectivity is restored.

| ID | Requirement | Status |
|----|-------------|--------|
| OFF-1 | Queue pending actions in `sync_queue` table | ✅ Implemented |
| OFF-2 | Action types: send vibration, create pattern, friend request, etc. | ✅ Implemented |
| OFF-3 | Status tracking: pending → processing → completed / failed | ✅ Implemented |
| OFF-4 | Retry with counter (retry_count) and error logging | ✅ Implemented |

---

## 8. System Architecture

### 8.1 High-Level Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐
│   iOS App   │    │ watchOS App │    │   Web App (PWA) │
│   (Swift)   │    │   (Swift)   │    │ (React + Vite)  │
└──────┬──────┘    └──────┬──────┘    └────────┬────────┘
       │                  │                     │
       │         HTTPS + WebSocket (WSS)        │
       └──────────────────┼─────────────────────┘
                          │
                 ┌────────▼────────┐
                 │  Nginx Reverse  │
                 │     Proxy       │
                 │  (ports 80/443) │
                 └───┬────────┬───┘
                     │        │
          ┌──────────▼──┐  ┌──▼──────────┐
          │  Backend API │  │  Web Static  │
          │  (Express +  │  │  (Nginx)     │
          │  Socket.io)  │  │  port 8080   │
          │  port 3000   │  └──────────────┘
          └──┬───────┬───┘
             │       │
    ┌────────▼──┐ ┌──▼────────┐
    │ PostgreSQL│ │   Redis   │
    │  (port    │ │  (port    │
    │   5432)   │ │   6379)   │
    └───────────┘ └───────────┘
```

### 8.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Node.js + Express + TypeScript | REST API server |
| **Real-time** | Socket.io | WebSocket server for live vibration delivery |
| **Database** | PostgreSQL 15+ | Persistent data storage (users, patterns, history) |
| **Cache** | Redis 7+ | Session management, online status, refresh tokens |
| **Web Frontend** | React 18 + TypeScript + Vite | Single-page web application |
| **State** | Zustand | Lightweight client-side state management |
| **Styling** | Tailwind CSS + Framer Motion | UI styling and animations |
| **iOS** | Swift + SwiftUI + CoreHaptics | Native iOS application |
| **watchOS** | Swift + WatchKit | Native watch application |
| **Auth** | Apple Sign In + Google OAuth 2.0 | Passwordless authentication |
| **Push** | APNS (node-apn) | Apple Push Notification Service |
| **Containerization** | Docker + Docker Compose | Development and deployment |
| **Proxy** | Nginx | Reverse proxy, SSL termination, static file serving |

### 8.3 Data Model

**Core tables (v1.0):** 7 tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User accounts | id (UUID), email, username, auth_provider, provider_id, streak fields, profile fields |
| `device_tokens` | APNS push tokens | user_id, device_type (ios/watch), token |
| `friendships` | Friend relationships | user_id, friend_id, status (pending/accepted/declined/blocked) |
| `vibration_patterns` | Preset patterns (5) | name, pattern (JSONB), is_preset |
| `custom_patterns` | User-created patterns | user_id, name, pattern (JSONB) |
| `vibration_history` | Sent/received log | sender_id, receiver_id, vibration_type, emoji, sent_at, delivered_at, read_at |
| `user_settings` | User preferences | notifications_enabled, dnd_enabled, dnd_start/end, privacy_mode |

**v2.0 additions:** 14 tables + 2 views

| Table | Purpose |
|-------|---------|
| `friend_groups` | Named friend groups |
| `friend_group_members` | Group membership (M:M) |
| `group_vibrations` | Group message records |
| `group_vibration_recipients` | Per-recipient delivery tracking |
| `haptic_stories` | Story posts with 24h expiry |
| `story_sequences` | Ordered steps within a story |
| `story_views` | Unique view tracking |
| `scheduled_vibrations` | Time-based recurring sends |
| `achievements` | Achievement definitions (25+ seeded) |
| `user_achievements` | User progress per achievement |
| `daily_challenges` | Daily challenge definitions |
| `user_challenge_progress` | User challenge completion |
| `leaderboard_scores` | Ranked scores by type and period |
| `feed_posts` | Social feed posts |
| `post_likes` | Post likes |
| `post_comments` | Post comments |
| `user_analytics` | Daily per-user analytics |
| `marketplace_patterns` | Published marketplace listings |
| `pattern_ratings` | User ratings and reviews |
| `sync_queue` | Offline action queue |
| `user_encryption_keys` | Public key storage (E2E foundation) |
| `notifications` | In-app notification log |

**Database views:**
- `user_profiles` — aggregated user profile with friends count, achievements, points
- `social_feed` — feed posts joined with user info, pattern data, achievement data

**Triggers:**
- `increment_vibration_count` — auto-updates `users.total_vibrations_sent/received` and streak on each `vibration_history` INSERT
- `update_updated_at_column` — auto-timestamps on 6 tables

### 8.4 API Design

**Base URLs:**
- v1: `/api/v1` — core features (auth, users, friends, vibrations)
- v2: `/api/v2` — social features (groups, profiles, stories, achievements, feed, marketplace)

**Authentication:** All endpoints require `Authorization: Bearer {JWT}` except:
- `POST /api/v1/auth/apple` — Apple Sign In
- `POST /api/v1/auth/google` — Google Sign In
- `GET /api/v1/auth/username/:username` — username availability
- `GET /api/v2/feed/trending` — public trending patterns

**Rate Limiting:**
- Auth endpoints: dedicated `authLimiter`
- Vibration sending: dedicated `vibrationLimiter`
- General API: `apiLimiter`

**Endpoint Summary:**

| Namespace | Endpoints | Description |
|-----------|-----------|-------------|
| `/api/v1/auth` | 5 | Authentication & token management |
| `/api/v1/users` | 4 | User profile & device tokens |
| `/api/v1/friends` | 6 | Friend CRUD & requests |
| `/api/v1/vibrations` | 9 | Send, patterns, history |
| `/api/v2/groups` | 8 | Friend groups & group vibrations |
| `/api/v2/profiles` | 3 | User profiles & analytics |
| `/api/v2/achievements` | 2 | Achievements & leaderboards |
| `/api/v2/stories` | 5 | Haptic stories CRUD |
| `/api/v2/scheduled-vibrations` | 4 | Scheduled sends |
| `/api/v2/feed` | 8 | Social feed, likes, comments |
| **Total** | **~54** | |

### 8.5 Real-Time Communication

**Protocol:** Socket.io (WebSocket with HTTP long-polling fallback)

**Authentication:** JWT token passed during connection handshake.

**Room structure:** Each user joins room `user:{userId}` on connect.

**Events:**

| Direction | Event | Payload | Description |
|-----------|-------|---------|-------------|
| Client → Server | `vibration_sent` | `{ vibrationId, receiverId }` | Notify server of sent vibration |
| Client → Server | `typing` | `{ receiverId }` | Typing indicator |
| Client → Server | `presence_update` | `{ status }` | Presence change |
| Server → Client | `vibration_received` | `{ vibration }` | New vibration arrived |
| Server → Client | `friend_online` | `{ userId }` | Friend came online |
| Server → Client | `friend_offline` | `{ userId }` | Friend went offline |
| Server → Client | `friend_typing` | `{ userId }` | Friend is typing |
| Server → Client | `friend_request` | `{ request }` | New friend request |

**Online tracking:** Redis SET `online_users` tracks currently connected user IDs. Supports multiple connections per user. Auto-cleanup on disconnect.

---

## 9. Platform Support

| Platform | Status | Key Details |
|----------|--------|-------------|
| **iOS** | ✅ Production | SwiftUI, CoreHaptics, MVVM architecture, Apple Sign In, Keychain token storage |
| **watchOS** | ✅ Production | WatchKit, instant wrist notifications, haptic playback, quick reply, complications |
| **Web (PWA)** | ✅ Production | React 18, Vite, Tailwind, installable PWA, responsive (mobile/tablet/desktop) |
| **Android** | ❌ Planned | Listed in roadmap |
| **Desktop** | ❌ Planned | Listed in roadmap |

### Web App Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginPage | OAuth login + username selection |
| `/friends` | FriendsPage | Friend list, search, requests, groups |
| `/send` | SendPage | Friend picker, pattern picker, emoji picker, send |
| `/history` | HistoryPage | Sent/received vibration log |
| `/settings` | SettingsPage | Preferences, notifications, logout |
| `/draw` | DrawPage | Haptic drawing canvas (v2.0) |
| `/feed` | SocialFeedPage | Social feed (v2.0) |

---

## 10. Security & Privacy

| Area | Implementation |
|------|---------------|
| **Authentication** | OAuth 2.0 only (Apple + Google). No password storage. |
| **Token security** | JWT signed with HS256. 15-min access + 7-day refresh. Refresh tokens in Redis. |
| **Transport** | HTTPS/WSS enforced via Nginx. |
| **Input validation** | express-validator on all endpoints. |
| **SQL injection** | Parameterized queries (node-postgres). No raw string interpolation. |
| **XSS** | React's built-in escaping. Helmet.js for CSP headers. |
| **CORS** | Configurable origin whitelist (`CORS_ORIGIN` env var). |
| **Rate limiting** | Per-endpoint limiters (auth, vibration, general). |
| **iOS token storage** | Keychain Services for JWT tokens. |
| **Privacy controls** | Per-user privacy mode (everyone / friends / nobody). DND time windows. |
| **E2E encryption** | Foundation in place (`user_encryption_keys` table). Full implementation planned for v3.0. |

---

## 11. Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| **Vibration delivery latency** | < 500ms | WebSocket direct delivery (online users) |
| **API response time (p95)** | < 200ms | For standard CRUD endpoints |
| **WebSocket connection setup** | < 1s | Including JWT verification |
| **Push notification delivery** | < 3s | APNS-dependent; measured from send to device receipt |
| **Concurrent WebSocket connections** | 10,000+ | Per server instance |
| **Database query time (p95)** | < 50ms | Indexed queries, optimized views |
| **Web app initial load (LCP)** | < 2s | Vite code splitting, lazy loading |
| **Uptime target** | 99.9% | Excluding planned maintenance |

**Caching strategy:**
- Redis: online user set, refresh tokens, friend list cache
- Client-side: patterns, user profile, friend list (Zustand store)
- Database: materialized views for feed and profiles

---

## 12. Monetization Strategy

> **Current status:** Not monetized. The following are recommended options based on the product's features and audience.

### Option A: Freemium Subscription (Recommended)

| | Free Tier | Premium ($2.99/month) |
|---|-----------|----------------------|
| Custom patterns | 10 | Unlimited |
| Daily vibrations | 50 | Unlimited |
| Group size | 5 members | Unlimited |
| Story sequences | 3 steps | Unlimited |
| Scheduled vibrations | 2 active | Unlimited |
| Drawing canvas | Basic | Advanced (layers, export) |
| Analytics | Basic (7-day) | Full history |
| Marketplace | Browse only | Publish + download |
| Exclusive patterns | ❌ | ✅ Monthly drops |
| Ad-free | ❌ | ✅ |

**Projected conversion rate:** 5% (based on social app benchmarks)

### Option B: Creator Marketplace Revenue Share

- Creators publish paid patterns (price set by creator, min $0.99)
- Platform takes 30% commission
- Payouts weekly via Stripe Connect
- Verified Creator badge for top publishers

### Option C: Hybrid (A + B)

Combine subscription for power-user features with marketplace commissions. This maximizes both recurring revenue and creator ecosystem growth.

**Recommendation:** Start with **Option A** (Freemium) to establish paid conversion benchmarks. Add **Option B** (Marketplace) once the creator community reaches critical mass (1,000+ published patterns).

---

## 13. Success Metrics & KPIs

### Engagement Metrics

| Metric | Current Baseline | v2.0 Target |
|--------|-----------------|-------------|
| DAU/MAU ratio | 15% | 40% |
| Average session length | 2 min | 8 min |
| Day-1 retention | ~40% | 60% |
| Day-7 retention | ~20% | 50% |
| Day-30 retention | ~8% | 25% |
| Vibrations sent per DAU | 3 | 15 |
| Viral coefficient | < 1.0 | 1.5 |

### Feature Adoption Metrics

| Feature | Target Adoption (% of MAU) |
|---------|---------------------------|
| Custom pattern creation | 30% |
| Drawing canvas usage | 20% |
| Group vibrations | 25% |
| Stories created | 15% |
| Scheduled vibrations | 20% |
| Social feed engagement | 35% |
| Daily challenge completion | 40% |
| Marketplace browsing | 25% |

### Social Metrics

| Metric | Target |
|--------|--------|
| Average friends per user | 25 (from 5) |
| Average group size | 4 |
| Social shares to external platforms | 1M/month |
| Feed posts per week (per active user) | 2 |

### North Star Metric

> **Daily Vibrations Sent** — a leading indicator combining user activation, retention, and relationship depth.

---

## 14. Risks & Mitigations

| # | Risk | Severity | Probability | Mitigation |
|---|------|----------|-------------|------------|
| R1 | **Low retention** — users try app once and leave | High | Medium | Gamification (streaks, achievements, challenges), scheduled vibrations create habit loops, push notification re-engagement |
| R2 | **Platform dependency** — Apple could build haptic messaging into iMessage | High | Low | Build defensible social graph and creative tools. Web + future Android reduce Apple dependency. |
| R3 | **Haptic hardware fragmentation** — inconsistent vibration motors across devices | Medium | High | Abstract haptic layer with device-specific adapters. CoreHaptics on iOS provides consistent API. Web Vibration API is limited but functional. |
| R4 | **Privacy concerns** — users worried about haptic data being stored | Medium | Medium | E2E encryption roadmap. Clear privacy policy. Minimal data retention (50-message history cap). Privacy mode. |
| R5 | **Marketplace abuse** — inappropriate or low-quality patterns | Medium | Medium | Approval workflow (is_approved flag). Community ratings. Report mechanism. |
| R6 | **WebSocket scalability** — single server connection limit | Medium | Low | Socket.io supports Redis adapter for horizontal scaling. Architecture is stateless. |
| R7 | **Single-platform start** — iOS-only haptics limit addressable market | High | High | Web PWA available now. Android planned. watchOS extends iOS reach. |

---

## 15. Future Roadmap (v3.0+)

The following features are planned but **not yet implemented**:

| Feature | Description | Priority |
|---------|-------------|----------|
| **Music-to-Haptic Converter** | AI converts songs (bass, rhythm, melody) into haptic patterns. Spotify/Apple Music integration. | High |
| **AI Pattern Generation** | Describe a pattern in words ("gentle ocean waves") → AI generates haptic sequence. Emotion-to-haptic mapping. | High |
| **Haptic Games** | Multiplayer games — Morse Code Challenge, Rhythm Match, Haptic Simon Says, Feel the Beat. | Medium |
| **End-to-End Encryption** | Full E2E encryption for all vibrations. Self-destructing messages. Encrypted backups. | High |
| **Android App** | Full feature parity with iOS using Kotlin + Jetpack Compose. | High |
| **Desktop Apps** | Windows, macOS, Linux via Electron or Tauri. | Low |
| **Smart Home Integration** | Alexa, Google Home, HomeKit triggers for haptic events. | Low |
| **AR/VR Haptics** | 3D haptic pattern visualization. VR full-body haptic support. | Low |
| **Wearable Devices** | Dedicated haptic rings, bands. | Low |
| **Localization** | 20+ languages (Spanish, French, German, Chinese, Japanese, Korean, etc.) | Medium |
| **Accessibility** | VoiceOver/TalkBack, high contrast, adjustable text, motor accessibility. | Medium |

---

## 16. Glossary

| Term | Definition |
|------|-----------|
| **Haptic** | Relating to the sense of touch. In this context, vibration patterns played on a device's haptic motor. |
| **Vibration pattern** | A sequence of intervals (durations) and intensities (0.0–1.0) that define a haptic experience. |
| **Preset pattern** | One of 5 built-in patterns: short_tap, double_tap, long_vibration, sos, heartbeat. |
| **Custom pattern** | A user-created vibration pattern saved to their account. |
| **Haptic story** | A multi-step sequence of vibrations + emojis + text, viewable by friends for 24 hours. |
| **Friend group** | A named collection of friends for group vibration sending. |
| **Streak** | Consecutive days a user has sent at least one vibration. Resets if a day is missed. |
| **Drawing canvas** | Visual interface where users draw vibration patterns by mapping touch position to time/intensity. |
| **APNS** | Apple Push Notification Service — delivers push notifications to iOS/watchOS. |
| **CoreHaptics** | Apple framework for creating and playing custom haptic patterns on iPhone. |
| **Socket.io** | WebSocket library used for real-time bidirectional communication. |
| **Zustand** | Lightweight React state management library used in the web app. |

---

*Document Version: 2.0.0*
*Author: Haptic Friends Team*
*Last Updated: 2026-02-16*
