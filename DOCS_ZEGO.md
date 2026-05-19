
# ZegoCloud One-on-One Calling Setup

## 1. Credentials
Go to [ZegoCloud Admin Console](https://console.zegocloud.com/) and create a project.
Get your App ID and Server Secret.

Add to Vercel/Environment:
| Variable | Value |
| :--- | :--- |
| `NEXT_PUBLIC_ZEGO_APP_ID` | Your App ID (Number) |
| `ZEGO_SERVER_SECRET` | Your Server Secret (String) |

## 2. RTDB Rules
Update your Firebase Realtime Database rules to allow signaling:

```json
{
  "rules": {
    "calls": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null"
      }
    }
  }
}
```

## 3. How it Works
1. When User A clicks the "Video" icon in Chat, it writes to `calls/UserB` in RTDB.
2. User B has a `CallManager` listening. It shows a full-screen "Incoming Call" popup.
3. If User B accepts, both are redirected to `/call/[chatId]`.
4. ZegoCloud handles the heavy lifting of WebRTC, camera, and mic.
