# 🔧 WSL2 + Expo + Android - Networking Fix Guide

## Problem

When running Expo in WSL2 (Ubuntu) and scanning QR code with Expo Go on Android phone or Windows emulator, the app shows "Connecting..." but never loads.

## Root Cause

**WSL2 uses a virtual network** that is isolated from your Windows host network. Your Android device/emulator can't reach the Expo dev server running in WSL2.

---

## ✅ Solution Options

### **Option 1: Use Tunnel Mode (EASIEST - RECOMMENDED)**

This creates a public URL that works everywhere, bypassing network issues.

#### Steps:

1. **Install Expo CLI globally** (if not already):
```bash
npm install -g expo-cli
```

2. **Start Expo with tunnel**:
```bash
cd /home/mukulah/vpn-enterprise/apps/mobile-app
npx expo start --tunnel
```

3. **Wait for tunnel to connect** (may take 30-60 seconds):
```
Tunnel ready.
› Tunnel URL: exp://abc-xyz.tunnel.exp.direct:80
```

4. **Scan the QR code** with Expo Go app - it will work!

#### Pros:
- ✅ Works instantly
- ✅ No network configuration needed
- ✅ Works on any device (phone, emulator, anywhere)

#### Cons:
- ⚠️ Slower than LAN (but still fast enough for development)
- ⚠️ Requires internet connection

---

### **Option 2: Port Forwarding from Windows to WSL (ADVANCED)**

Forward ports from Windows to WSL2 so Android can connect to WSL's Expo server.

#### Steps:

1. **Find your WSL2 IP address**:
```bash
# In WSL/Ubuntu terminal:
ip addr show eth0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1
```
Example output: `172.20.10.5`

2. **Find your Windows IP address**:
```bash
# In WSL/Ubuntu terminal:
ip route show | grep -i default | awk '{ print $3}'
```
Example output: `172.20.10.1`

3. **Create port forwarding script on Windows**:

Open **PowerShell as Administrator** in Windows and run:

```powershell
# Replace 172.20.10.5 with YOUR WSL IP from step 1
$wslIp = "172.20.10.5"

# Forward Expo ports (8081 for Metro bundler, 19000-19002 for Expo)
netsh interface portproxy add v4tov4 listenport=8081 listenaddress=0.0.0.0 connectport=8081 connectaddress=$wslIp
netsh interface portproxy add v4tov4 listenport=19000 listenaddress=0.0.0.0 connectport=19000 connectaddress=$wslIp
netsh interface portproxy add v4tov4 listenport=19001 listenaddress=0.0.0.0 connectport=19001 connectaddress=$wslIp
netsh interface portproxy add v4tov4 listenport=19002 listenaddress=0.0.0.0 connectport=19002 connectaddress=$wslIp

# Allow through Windows Firewall
New-NetFirewallRule -DisplayName "Expo WSL" -Direction Inbound -LocalPort 8081,19000,19001,19002 -Protocol TCP -Action Allow
```

4. **Verify port forwarding**:
```powershell
netsh interface portproxy show all
```

5. **Start Expo in WSL with LAN mode**:
```bash
cd /home/mukulah/vpn-enterprise/apps/mobile-app
npx expo start --lan
```

6. **Scan QR code** with Expo Go app.

#### To Remove Port Forwarding Later:
```powershell
# In PowerShell as Administrator:
netsh interface portproxy delete v4tov4 listenport=8081 listenaddress=0.0.0.0
netsh interface portproxy delete v4tov4 listenport=19000 listenaddress=0.0.0.0
netsh interface portproxy delete v4tov4 listenport=19001 listenaddress=0.0.0.0
netsh interface portproxy delete v4tov4 listenport=19002 listenaddress=0.0.0.0
```

---

### **Option 3: Use Windows Emulator Directly (SIMPLE)**

Run the Android emulator from Windows and connect via localhost.

#### Steps:

1. **Start Android emulator in Windows** (through Android Studio).

2. **In WSL, start Expo**:
```bash
cd /home/mukulah/vpn-enterprise/apps/mobile-app
npx expo start
```

3. **Press 'a' for Android** when prompted.

4. **Expo will automatically detect** the Windows emulator via ADB bridge.

#### Setup ADB Bridge (one-time):

In WSL:
```bash
# Connect to Windows ADB
export ADB_SERVER_SOCKET=tcp:127.0.0.1:5037

# Verify connection
adb devices
```

---

### **Option 4: Run Everything in Windows (SIMPLEST)**

Develop directly in Windows instead of WSL.

#### Steps:

1. **Open PowerShell/CMD in Windows**.

2. **Navigate to project**:
```powershell
cd \\wsl$\Ubuntu\home\mukulah\vpn-enterprise\apps\mobile-app
```

3. **Install dependencies** (if not already):
```powershell
npm install
```

4. **Start Expo**:
```powershell
npx expo start
```

5. **Works perfectly** with both emulator and physical device!

---

## 🚀 RECOMMENDED SOLUTION FOR YOU

**Use Tunnel Mode** - it's the easiest and most reliable:

```bash
cd /home/mukulah/vpn-enterprise/apps/mobile-app
npx expo start --tunnel
```

**Why?**
- ✅ No network configuration needed
- ✅ Works with WSL2 immediately
- ✅ Works with phone and emulator
- ✅ No PowerShell/admin rights needed
- ✅ Easy to use

**Downside**: Slightly slower hot reload (2-3 seconds vs instant), but perfectly fine for development.

---

## 📱 Alternative: Create Helper Script

I'll create a script that automatically uses tunnel mode in WSL:

### `start-mobile.sh`:
```bash
#!/bin/bash
cd /home/mukulah/vpn-enterprise/apps/mobile-app
echo "🚀 Starting Expo with tunnel mode (WSL2-friendly)..."
npx expo start --tunnel
```

Make it executable:
```bash
chmod +x start-mobile.sh
./start-mobile.sh
```

---

## 🧪 Testing Each Solution

### Test Tunnel Mode:
```bash
npx expo start --tunnel
# Wait for "Tunnel ready" message
# Scan QR code → Should work ✅
```

### Test Port Forwarding:
```bash
# After setting up port forwarding in PowerShell
npx expo start --lan
# Scan QR code → Should work ✅
```

### Test Windows Emulator:
```bash
# Start emulator in Windows first
npx expo start
# Press 'a' → Should open in emulator ✅
```

---

## 🔍 Troubleshooting

### Issue: Tunnel won't connect
**Solution**: Check internet connection, or run:
```bash
npx expo start --tunnel --clear
```

### Issue: "Couldn't start project"
**Solution**: Clear cache:
```bash
npx expo start --clear
```

### Issue: Port already in use
**Solution**: Kill Expo process:
```bash
killall -9 node
npx expo start --tunnel
```

### Issue: QR code shows but app won't load
**Solution**: Make sure phone and computer are on same WiFi (for LAN mode) or use tunnel mode.

---

## 📊 Comparison

| Method | Speed | Setup Difficulty | Reliability |
|--------|-------|------------------|-------------|
| **Tunnel Mode** | ⭐⭐⭐ Good | ✅ Easy | ⭐⭐⭐⭐⭐ Excellent |
| Port Forwarding | ⭐⭐⭐⭐⭐ Excellent | ⚠️ Hard | ⭐⭐⭐ Good |
| Windows Emulator | ⭐⭐⭐⭐⭐ Excellent | ✅ Easy | ⭐⭐⭐⭐ Very Good |
| Run in Windows | ⭐⭐⭐⭐⭐ Excellent | ✅ Easy | ⭐⭐⭐⭐⭐ Excellent |

---

## ✅ My Recommendation

**For your setup (WSL2 + Windows + Android):**

1. **Primary method**: Use **Tunnel Mode** for quick development
   ```bash
   npx expo start --tunnel
   ```

2. **For faster hot reload**: Use **Windows Emulator** with ADB bridge
   ```bash
   # Start emulator in Windows
   npx expo start  # in WSL
   # Press 'a'
   ```

3. **For production testing**: Set up **Port Forwarding** once and use LAN mode

---

**Let's get your app running!** Try tunnel mode first - it should work immediately! 🚀
