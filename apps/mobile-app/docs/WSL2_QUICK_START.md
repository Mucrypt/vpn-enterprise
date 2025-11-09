# 🚀 WSL2 Quick Start Guide for VPN Enterprise Mobile

## ⚡ The Problem
When you run `npx expo start` or `expo start -c` in WSL2, it starts in **LAN mode**. Your Android emulator/device can't reach the WSL2 virtual network, so the app never loads.

## ✅ The Solution
Use **TUNNEL MODE** which creates a public URL that works from anywhere, bypassing WSL2's network isolation.

---

## 🎯 Quick Commands

### Option 1: Use the Script (Recommended)
```bash
./start-mobile-wsl.sh
```
This automatically starts Expo in tunnel mode with cache cleared.

### Option 2: NPM Command
```bash
npm run start:wsl
```
Same as above, just using npm script.

### Option 3: Direct Command
```bash
npx expo start --tunnel --clear
```

---

## 📱 After Starting

1. **Wait for "Tunnel ready"** message (30-60 seconds first time)
2. **Press `a`** to open in Android emulator
3. **OR scan QR code** with Expo Go on your phone
4. **Wait for app to load** (first load may take 30-60 seconds)

---

## ❌ Don't Do This in WSL2

```bash
# ❌ WRONG - This won't work in WSL2
npx expo start
npx expo start -c
npm start

# These start in LAN mode which is unreachable from your emulator/phone
```

---

## ✅ Always Do This in WSL2

```bash
# ✅ CORRECT - Use tunnel mode
./start-mobile-wsl.sh
npm run start:wsl
npx expo start --tunnel
```

---

## 🔧 Available NPM Scripts

```bash
npm run start:wsl      # Start with tunnel mode (WSL2-friendly)
npm run start:tunnel   # Same as above
npm run start          # Regular start (won't work in WSL2)
npm run android        # Open Android
npm run ios            # Open iOS
npm run web            # Open web browser
```

---

## 🎉 What You'll See

After the app loads successfully, you'll see:

- ✨ **Glowing AI-powered connection button**
- 🗺️ **Interactive world map** with server locations
- 📊 **Real-time speed metrics** (download/upload/latency)
- 🎯 **ML-based server recommendations**
- 💫 **Beautiful gradient animations**

---

## 🐛 Troubleshooting

### App never loads
- Make sure you used `--tunnel` flag
- Wait for "Tunnel ready" message
- Check that Android emulator is running
- Press 'a' to open in emulator

### "Metro waiting" stuck
- Press Ctrl+C and restart
- Clear cache: `npx expo start --tunnel --clear`

### React version errors
- Dependencies are already fixed in package.json
- Just run `npm install` if needed

### Tunnel connection failed
- Check internet connection
- Restart Expo server
- Try again (tunnel can be flaky sometimes)

---

## 📝 Remember

**In WSL2, ALWAYS use tunnel mode for mobile development!**

The script `./start-mobile-wsl.sh` is your friend. Use it! 🚀
