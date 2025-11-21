# Haptic Friends API Documentation

Base URL: `http://localhost:3000/api/v1`

## Authentication

All authenticated endpoints require the `Authorization` header:
```
Authorization: Bearer {access_token}
```

---

## 🔐 Authentication Endpoints

### Sign in with Apple
```http
POST /auth/apple
```

**Request Body:**
```json
{
  "identityToken": "string (required)",
  "username": "string (optional, required for new users)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "john_doe"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Username is required for new users",
  "requiresUsername": true
}
```

---

### Sign in with Google
```http
POST /auth/google
```

**Request Body:**
```json
{
  "idToken": "string (required)",
  "username": "string (optional, required for new users)"
}
```

**Response:** Same as Apple Sign In

---

### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

### Logout
```http
POST /auth/logout
```

**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Check Username Availability
```http
GET /auth/username/:username
```

**Success Response (200):**
```json
{
  "success": true,
  "available": true,
  "message": "Username is available"
}
```

---

## 👤 User Endpoints

### Get Profile
```http
GET /users/profile
```

**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "john_doe",
    "created_at": "2024-01-01T00:00:00Z",
    "last_seen": "2024-01-15T10:30:00Z"
  }
}
```

---

### Update Profile
```http
PUT /users/profile
```

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "username": "new_username"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "new_username"
  }
}
```

---

### Search Users
```http
GET /users/search?q={query}
```

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `q` (required): Search term (username)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "jane_doe",
      "last_seen": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Register Device Token
```http
POST /users/device-token
```

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "token": "apns_device_token",
  "deviceType": "ios" // or "watch"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Device token registered successfully"
}
```

---

### Delete Account
```http
DELETE /users/profile
```

**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

## 👥 Friend Endpoints

### Get Friends List
```http
GET /friends
```

**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "jane_doe",
      "email": "jane@example.com",
      "last_seen": "2024-01-15T10:00:00Z",
      "is_active": true,
      "friendship_status": "accepted",
      "has_watch": true
    }
  ]
}
```

---

### Get Pending Requests
```http
GET /friends/requests/pending
```

**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "bob_smith",
      "email": "bob@example.com",
      "request_id": "request_uuid",
      "requested_at": "2024-01-15T09:00:00Z"
    }
  ]
}
```

---

### Get Sent Requests
```http
GET /friends/requests/sent
```

**Headers:** `Authorization: Bearer {token}`

---

### Send Friend Request
```http
POST /friends/request
```

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "friendId": "uuid"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Friend request sent successfully",
  "data": {
    "id": "request_uuid",
    "user_id": "your_uuid",
    "friend_id": "friend_uuid",
    "status": "pending",
    "requested_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### Accept Friend Request
```http
PUT /friends/request/:requestId/accept
```

**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Friend request accepted",
  "data": {
    "id": "request_uuid",
    "status": "accepted",
    "responded_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### Decline Friend Request
```http
PUT /friends/request/:requestId/decline
```

**Headers:** `Authorization: Bearer {token}`

---

### Remove Friend
```http
DELETE /friends/:friendId
```

**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Friend removed successfully"
}
```

---

## 📳 Vibration Endpoints

### Get Preset Patterns
```http
GET /vibrations/patterns/presets
```

**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "short_tap",
      "pattern": {
        "intervals": [0.2],
        "intensities": [1.0]
      },
      "is_preset": true,
      "description": "Quick single tap"
    }
  ]
}
```

---

### Get Custom Patterns
```http
GET /vibrations/patterns/custom
```

**Headers:** `Authorization: Bearer {token}`

---

### Create Custom Pattern
```http
POST /vibrations/patterns/custom
```

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "My Pattern",
  "pattern": {
    "intervals": [0.2, 0.1, 0.2],
    "intensities": [1.0, 0.0, 1.0]
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Custom pattern created successfully",
  "data": {
    "id": "uuid",
    "user_id": "your_uuid",
    "name": "My Pattern",
    "pattern": {
      "intervals": [0.2, 0.1, 0.2],
      "intensities": [1.0, 0.0, 1.0]
    },
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**Validation Rules:**
- Maximum 5 custom patterns per user
- Pattern intervals: array of positive numbers
- Pattern intensities: array of numbers between 0 and 1
- Arrays must be same length
- Maximum 20 intervals

---

### Delete Custom Pattern
```http
DELETE /vibrations/patterns/custom/:patternId
```

**Headers:** `Authorization: Bearer {token}`

---

### Send Vibration
```http
POST /vibrations/send
```

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "receiverId": "uuid",
  "vibrationType": "short_tap",
  "patternId": "uuid (optional)",
  "customPatternId": "uuid (optional)",
  "emoji": "❤️ (optional)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Vibration sent successfully",
  "data": {
    "id": "vibration_uuid",
    "sender_id": "your_uuid",
    "receiver_id": "friend_uuid",
    "vibration_type": "short_tap",
    "emoji": "❤️",
    "sent_at": "2024-01-15T10:00:00Z"
  }
}
```

**Rate Limiting:** 30 vibrations per minute

---

### Get Sent History
```http
GET /vibrations/history/sent?limit=50
```

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `limit` (optional): Number of results (default: 50, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sender_id": "your_uuid",
      "receiver_id": "friend_uuid",
      "sender_username": "john_doe",
      "receiver_username": "jane_doe",
      "vibration_type": "short_tap",
      "pattern_name": "short_tap",
      "emoji": "❤️",
      "sent_at": "2024-01-15T10:00:00Z",
      "delivered_at": "2024-01-15T10:00:01Z",
      "read_at": "2024-01-15T10:01:00Z"
    }
  ]
}
```

---

### Get Received History
```http
GET /vibrations/history/received?limit=50
```

**Headers:** `Authorization: Bearer {token}`

---

### Get Unread Count
```http
GET /vibrations/unread-count
```

**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### Mark as Read
```http
PUT /vibrations/:vibrationId/read
```

**Headers:** `Authorization: Bearer {token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Marked as read"
}
```

---

## 🔌 WebSocket Events

### Connection

```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events to Send (Client → Server)

#### vibration_sent
Notify server that a vibration was sent.

```javascript
socket.emit('vibration_sent', {
  vibrationId: 'uuid',
  receiverId: 'uuid',
  vibrationType: 'short_tap',
  emoji: '❤️',
  patternName: 'short_tap'
});
```

#### typing
Send typing indicator.

```javascript
socket.emit('typing', {
  receiverId: 'uuid'
});
```

#### presence_update
Update your presence.

```javascript
socket.emit('presence_update', {});
```

### Events to Receive (Server → Client)

#### vibration_received
Receive a new vibration.

```javascript
socket.on('vibration_received', (data) => {
  // data: {
  //   vibrationId: 'uuid',
  //   senderId: 'uuid',
  //   senderUsername: 'john_doe',
  //   vibrationType: 'short_tap',
  //   emoji: '❤️',
  //   patternName: 'short_tap',
  //   timestamp: '2024-01-15T10:00:00Z'
  // }
});
```

#### friend_online
Friend came online.

```javascript
socket.on('friend_online', (data) => {
  // data: { userId: 'uuid', username: 'john_doe' }
});
```

#### friend_offline
Friend went offline.

```javascript
socket.on('friend_offline', (data) => {
  // data: { userId: 'uuid', username: 'john_doe', lastSeen: '...' }
});
```

#### friend_typing
Friend is typing.

```javascript
socket.on('friend_typing', (data) => {
  // data: { userId: 'uuid', username: 'john_doe' }
});
```

---

## ❌ Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🔒 Rate Limiting

Different endpoints have different rate limits:

- **Authentication endpoints**: 5 requests per 15 minutes
- **API endpoints**: 100 requests per 15 minutes
- **Vibration sending**: 30 requests per minute
- **Search endpoints**: 20 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642267200
```

---

## 🧪 Testing with cURL

### Example: Sign in with Apple

```bash
curl -X POST http://localhost:3000/api/v1/auth/apple \
  -H "Content-Type: application/json" \
  -d '{
    "identityToken": "your_token",
    "username": "john_doe"
  }'
```

### Example: Get Friends List

```bash
curl http://localhost:3000/api/v1/friends \
  -H "Authorization: Bearer your_jwt_token"
```

### Example: Send Vibration

```bash
curl -X POST http://localhost:3000/api/v1/vibrations/send \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "friend_uuid",
    "vibrationType": "short_tap",
    "emoji": "❤️"
  }'
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all IDs
- Maximum request body size: 10MB
- WebSocket connections timeout after 5 seconds of inactivity
- Refresh tokens are valid for 7 days
- Access tokens are valid for 15 minutes
