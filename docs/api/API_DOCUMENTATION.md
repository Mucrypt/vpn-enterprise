# 📖 VPN Enterprise API Documentation

Complete API reference for the VPN Enterprise platform.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

Most endpoints require authentication using JWT tokens from Supabase.

### Headers

```
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

## Endpoints

### 🏥 Health & Status

#### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T18:00:00.000Z",
  "service": "vpn-enterprise-api",
  "version": "1.0.0"
}
```

---

### 🔐 Authentication

#### POST `/api/v1/auth/signup`

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "authenticated"
  },
  "message": "User created successfully"
}
```

---

#### POST `/api/v1/auth/login`

Authenticate a user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "subscription": {
      "plan_type": "free",
      "status": "active",
      "max_devices": 1
    }
  },
  "session": {
    "access_token": "jwt_token_here",
    "refresh_token": "refresh_token_here",
    "expires_at": 1234567890
  }
}
```

---

### 🌍 Servers

#### GET `/api/v1/servers`

Get all active VPN servers.

**Response:**
```json
{
  "servers": [
    {
      "id": "uuid",
      "name": "US-East-1",
      "country": "United States",
      "country_code": "US",
      "city": "New York",
      "host": "45.79.123.45",
      "port": 51820,
      "load": 45.5,
      "max_clients": 100,
      "current_clients": 45,
      "is_active": true,
      "protocol": "wireguard"
    }
  ]
}
```

---

#### GET `/api/v1/servers/country/:code`

Get servers by country code.

**Parameters:**
- `code` (string): ISO 3166-1 alpha-2 country code (e.g., "US", "UK", "DE")

**Response:**
```json
{
  "servers": [...]
}
```

---

#### GET `/api/v1/servers/best`

Get the best available server (lowest load).

**Query Parameters:**
- `country` (optional): Filter by country code

**Response:**
```json
{
  "server": {
    "id": "uuid",
    "name": "US-East-1",
    "load": 25.3,
    ...
  }
}
```

---

### 👤 User Management

#### GET `/api/v1/user/subscription`

Get current user's subscription details.

**Headers:** Requires authentication

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "user_id": "uuid",
    "plan_type": "premium",
    "status": "active",
    "max_devices": 5,
    "data_limit_gb": null,
    "bandwidth_limit_mbps": null,
    "started_at": "2025-01-01T00:00:00Z",
    "expires_at": "2025-12-31T23:59:59Z",
    "auto_renew": true
  }
}
```

---

#### GET `/api/v1/user/devices`

Get all devices for the authenticated user.

**Headers:** Requires authentication

**Response:**
```json
{
  "devices": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "device_name": "My Laptop",
      "public_key": "...",
      "assigned_ip": "10.0.0.2",
      "is_active": true,
      "last_connected_at": "2025-11-07T17:30:00Z",
      "os_type": "linux",
      "created_at": "2025-11-01T10:00:00Z"
    }
  ]
}
```

---

#### POST `/api/v1/user/devices`

Add a new device for the user.

**Headers:** Requires authentication

**Request:**
```json
{
  "device_name": "My Laptop",
  "os_type": "linux"
}
```

**Response:**
```json
{
  "device": {
    "id": "uuid",
    "device_name": "My Laptop",
    "public_key": "...",
    "assigned_ip": "10.0.0.2",
    "is_active": true
  },
  "config": {
    "id": "...",
    "name": "My Laptop",
    "publicKey": "...",
    "ipAddress": "10.0.0.2",
    "createdAt": "...",
    "isActive": true,
    "dataUsage": 0
  }
}
```

---

#### DELETE `/api/v1/user/devices/:id`

Remove a device.

**Headers:** Requires authentication

**Parameters:**
- `id` (uuid): Device ID

**Response:**
```json
{
  "message": "Device deleted successfully"
}
```

---

#### GET `/api/v1/user/connections`

Get user's connection history.

**Headers:** Requires authentication

**Query Parameters:**
- `limit` (number, optional): Maximum number of records (default: 50)

**Response:**
```json
{
  "connections": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "server_id": "uuid",
      "status": "disconnected",
      "connected_at": "2025-11-07T10:00:00Z",
      "disconnected_at": "2025-11-07T12:30:00Z",
      "duration_minutes": 150,
      "data_uploaded_mb": 250.5,
      "data_downloaded_mb": 1500.75,
      "servers": {
        "name": "US-East-1",
        "country": "United States"
      }
    }
  ]
}
```

---

#### GET `/api/v1/user/usage`

Get user's total data usage.

**Headers:** Requires authentication

**Response:**
```json
{
  "usage": {
    "total_uploaded_mb": 5234.67,
    "total_downloaded_mb": 25678.90,
    "total_mb": 30913.57
  }
}
```

---

### 🔌 VPN Connections

#### POST `/api/v1/vpn/connect`

Start a VPN connection.

**Headers:** Requires authentication

**Request:**
```json
{
  "server_id": "uuid",
  "device_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Connection started",
  "connection_id": "uuid"
}
```

**Error Responses:**
- `403`: No active subscription
- `400`: Missing server_id

---

#### POST `/api/v1/vpn/disconnect`

End the current VPN connection.

**Headers:** Requires authentication

**Response:**
```json
{
  "message": "Connection ended successfully"
}
```

---

#### GET `/api/v1/vpn/status`

Get VPN connection status.

**Headers:** Requires authentication

**Response:**
```json
{
  "active_connections": [
    {
      "id": "uuid",
      "server_id": "uuid",
      "connected_at": "2025-11-07T17:00:00Z",
      "status": "connected"
    }
  ],
  "server_status": {
    "status": "running",
    "serverPublicKey": "...",
    "timestamp": "2025-11-07T18:00:00Z"
  }
}
```

---

### 🛡️ Admin Endpoints

All admin endpoints require authentication and admin role.

#### POST `/api/v1/admin/servers`

Add a new VPN server.

**Headers:** Requires authentication + admin role

**Request:**
```json
{
  "name": "EU-Frankfurt-2",
  "country": "Germany",
  "country_code": "DE",
  "city": "Frankfurt",
  "host": "45.79.123.50",
  "public_key": "server_public_key_here",
  "port": 51820,
  "max_clients": 150
}
```

**Response:**
```json
{
  "server": {
    "id": "uuid",
    "name": "EU-Frankfurt-2",
    ...
  }
}
```

---

#### PUT `/api/v1/admin/servers/:id`

Update a server.

**Headers:** Requires authentication + admin role

**Request:**
```json
{
  "is_active": false,
  "max_clients": 200
}
```

**Response:**
```json
{
  "server": {
    "id": "uuid",
    "is_active": false,
    "max_clients": 200,
    ...
  }
}
```

---

#### DELETE `/api/v1/admin/servers/:id`

Delete a server.

**Headers:** Requires authentication + admin role

**Response:**
```json
{
  "message": "Server deleted successfully"
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation error",
  "message": "Email and password are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "No active subscription"
}
```

### 404 Not Found
```json
{
  "error": "Endpoint not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch servers"
}
```

---

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP address

When rate limit is exceeded:
```json
{
  "error": "Too many requests, please try again later."
}
```

---

## Webhooks (Coming Soon)

For Stripe payment integration and real-time notifications.

---

## SDKs & Libraries

- JavaScript/TypeScript SDK (coming soon)
- Python SDK (coming soon)
- Mobile SDKs (iOS/Android) (coming soon)
