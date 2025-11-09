# 📱 Native Client Development Guide

Complete API reference for building native VPN applications (Windows, macOS, Linux, iOS, Android) that integrate with VPN Enterprise.

## 🎯 Overview

This guide helps you build native VPN clients that:
- Fetch server lists from the API
- Generate platform-specific VPN configurations
- Manage WireGuard/OpenVPN connections
- Implement kill switch functionality
- Support split tunneling
- Handle authentication and security

---

## 🔐 Authentication

All API requests require JWT authentication (except public endpoints).

### Get Access Token

```http
POST /api/auth/login
Content-Type: application/json

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
    "email": "user@example.com"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

**Include in Headers:**
```
Authorization: Bearer <access_token>
```

---

## 🌍 Server Management

### Get Available Servers

```http
GET /api/servers
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "US-East-1",
    "country": "United States",
    "country_code": "US",
    "city": "New York",
    "host": "45.79.123.45",
    "public_key": "4nEWZs+9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=",
    "port": 51820,
    "load": 45.5,
    "is_active": true,
    "protocol": "wireguard"
  }
]
```

### Get Best Server

```http
GET /api/servers/best?country=US
```

Returns the server with the lowest load in the specified country.

---

## 📱 Device Management

### Register New Device

```http
POST /api/user/devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "device_name": "iPhone 15 Pro",
  "public_key": "generated-public-key",
  "private_key": "generated-private-key",
  "assigned_ip": "10.0.0.5",
  "os_type": "iOS",
  "device_fingerprint": "optional-unique-id"
}
```

**Response:**
```json
{
  "id": "device-uuid",
  "device_name": "iPhone 15 Pro",
  "assigned_ip": "10.0.0.5",
  "is_active": true
}
```

### Get User Devices

```http
GET /api/user/devices
Authorization: Bearer <token>
```

---

## 🔧 Configuration Generation

### Get WireGuard Configuration

```http
POST /api/user/devices/:deviceId/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "server_id": "server-uuid",
  "platform": "ios",
  "kill_switch": true,
  "dns_servers": ["1.1.1.1", "1.0.0.1"]
}
```

**Response:**
```json
{
  "config_id": "uuid",
  "config_type": "wireguard",
  "platform": "ios",
  "config_data": "[Interface]\nPrivateKey = ...\n[Peer]\n..."
}
```

**Platforms:** `windows`, `macos`, `linux`, `ios`, `android`

---

## 🔒 Security Features

### Get User Security Settings

```http
GET /api/user/security
Authorization: Bearer <token>
```

**Response:**
```json
{
  "kill_switch_enabled": true,
  "two_factor_enabled": false,
  "dns_leak_protection": true,
  "ipv6_leak_protection": true,
  "preferred_protocol": "wireguard",
  "auto_connect": false
}
```

### Enable Kill Switch

```http
POST /api/user/security/kill-switch
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true
}
```

### Enable Two-Factor Authentication

```http
POST /api/user/security/2fa/enable
Authorization: Bearer <token>
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "otpauth://totp/VPN:user@example.com?secret=...",
  "backup_codes": ["code1", "code2", ...]
}
```

### Verify 2FA Code

```http
POST /api/user/security/2fa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "123456"
}
```

---

## 🔀 Split Tunneling

### Get Split Tunnel Rules

```http
GET /api/user/split-tunnel
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "rule-uuid",
    "rule_type": "app",
    "rule_value": "com.netflix.app",
    "action": "bypass",
    "platform": "ios",
    "is_active": true
  }
]
```

### Create Split Tunnel Rule

```http
POST /api/user/split-tunnel
Authorization: Bearer <token>
Content-Type: application/json

{
  "rule_type": "app",
  "rule_value": "com.netflix.app",
  "action": "bypass",
  "platform": "ios"
}
```

**Rule Types:**
- `app` - Application identifier (e.g., `com.example.app`)
- `domain` - Domain name (e.g., `netflix.com`)
- `ip` - IP address or range (e.g., `192.168.1.0/24`)

**Actions:**
- `bypass` - Exclude from VPN tunnel
- `force_vpn` - Always use VPN tunnel

---

## 🔌 Connection Management

### Start VPN Connection

```http
POST /api/vpn/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "server_id": "server-uuid",
  "device_id": "device-uuid"
}
```

### Disconnect VPN

```http
POST /api/vpn/disconnect
Authorization: Bearer <token>
Content-Type: application/json

{
  "connection_id": "connection-uuid",
  "reason": "user_initiated"
}
```

### Get Connection History

```http
GET /api/user/connections?limit=50
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "connection-uuid",
    "server": {
      "name": "US-East-1",
      "country": "United States"
    },
    "connected_at": "2025-11-07T10:30:00Z",
    "disconnected_at": "2025-11-07T12:45:00Z",
    "duration_minutes": 135,
    "data_uploaded_mb": 45.2,
    "data_downloaded_mb": 234.7
  }
]
```

---

## 📊 Usage Statistics

### Get Data Usage

```http
GET /api/user/usage
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_uploaded_mb": 1245.67,
  "total_downloaded_mb": 5678.90,
  "total_mb": 6924.57,
  "current_month_mb": 456.78
}
```

---

## 💻 Platform-Specific Implementation

### iOS/macOS (Swift)

```swift
import NetworkExtension

class VPNManager {
    func createWireGuardTunnel(config: String) {
        let manager = NETunnelProviderManager()
        manager.protocolConfiguration = NETunnelProviderProtocol()
        
        // Load WireGuard configuration
        // ...
    }
}
```

### Android (Kotlin)

```kotlin
import com.wireguard.android.backend.GoBackend

class VPNService {
    fun connectWireGuard(config: String) {
        val backend = GoBackend(applicationContext)
        // Parse and apply configuration
    }
}
```

### Windows (C#)

```csharp
using WireGuardNT;

class VPNClient {
    public void Connect(string configPath) {
        // Use WireGuard NT kernel driver
        var service = new WireGuardService();
        service.Start(configPath);
    }
}
```

### Linux (Python)

```python
import subprocess

def connect_wireguard(config_file):
    subprocess.run(['wg-quick', 'up', config_file])
```

---

## 🛡️ Kill Switch Implementation

### Linux/macOS

Use `iptables` or `pf` to block all non-VPN traffic:

```bash
# Block all traffic except VPN interface
iptables -A OUTPUT ! -o wg0 -m mark ! --mark $(wg show wg0 fwmark) -m addrtype ! --dst-type LOCAL -j REJECT
```

### Windows

Use Windows Firewall API:

```powershell
New-NetFirewallRule -DisplayName "VPN Kill Switch" `
    -Direction Outbound -Action Block `
    -Profile Any -InterfaceAlias !wg0
```

### iOS/macOS (NEPacketTunnelProvider)

```swift
override func startTunnel(options: [String : NSObject]?) {
    // Configure to drop all traffic if VPN fails
    let networkSettings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: serverIP)
    networkSettings.ipv4Settings?.includedRoutes = [NEIPv4Route.default()]
    // This ensures all traffic goes through VPN
}
```

---

## 🔐 Encryption Levels

### Get Supported Protocols

```http
GET /api/encryption-protocols
```

**Response:**
```json
[
  {
    "name": "WireGuard ChaCha20",
    "protocol_type": "wireguard",
    "cipher": "ChaCha20-Poly1305",
    "key_size": 256,
    "security_level": "maximum"
  }
]
```

---

## 📡 Error Handling

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Unauthorized | Re-authenticate |
| 403 | Forbidden | Check subscription |
| 404 | Not Found | Verify resource ID |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Contact support |

### Error Response Format

```json
{
  "error": {
    "code": "DEVICE_LIMIT_REACHED",
    "message": "Maximum devices reached for your plan",
    "details": {
      "current": 3,
      "max": 3,
      "plan": "basic"
    }
  }
}
```

---

## 🚀 Best Practices

1. **Always validate tokens** before making requests
2. **Cache server list** for 5-10 minutes
3. **Implement automatic reconnection** on network changes
4. **Log security events** locally for debugging
5. **Handle kill switch gracefully** - don't leave users without internet
6. **Test on all supported OS versions**
7. **Implement proper DNS leak protection**
8. **Use system keychain** for storing credentials
9. **Implement certificate pinning** for API calls
10. **Follow platform security guidelines**

---

## 📞 Support

- API Issues: Check logs at `/api/user/audit-logs`
- Documentation: `/docs/api/`
- Status: `GET /health`

---

## 🔄 Changelog

### Version 1.0.0 (Phase 4)
- Added native client configuration endpoints
- Implemented kill switch support
- Added split tunneling
- Added 2FA authentication
- Enhanced encryption options
