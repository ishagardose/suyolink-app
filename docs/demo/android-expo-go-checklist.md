# Android Expo Go Demo Checklist

## Build Verification

| Check | Result |
|---|---|
| `npm test` (unit + schema) | ✅ PASS — 7 unit tests, 81 schema checks |
| `npm run test:e2e` | ✅ PASS — 6/6 e2e tests |
| `npx expo-doctor@latest` | ✅ PASS — No issues found |
| `npx expo export --platform android` | ✅ PASS — 858 modules, exported to `dist-native/` |
| `npm ci` | ⚠️ SKIP — Windows file-lock on native `.node` binary while Metro is running; `npm install` with existing node_modules passes. Run after closing all dev tools if a clean install is needed for CI. |

**Migration pending:** `202609300001_core_mvp_privacy_transactions.sql`  
Run `npx supabase@latest db push --dry-run` then `npx supabase@latest db push` against the linked development project before the demo.

---

## Device Setup

**Required:** Two physical Android devices (or one device + one emulator) both running **Expo Go SDK 54**.

| Item | Requester device | Provider device |
|---|---|---|
| Expo Go version | SDK 54 | SDK 54 |
| Account | `requester@yourdomain.com` | `provider@yourdomain.com` |

Start the dev server: `npx expo start --tunnel` and scan the QR code on each device.

---

## Two-Account Demo Script

### 1. Location permission

| # | Requester | Provider |
|---|---|---|
| 1a | Launch app. When prompted for location, **deny** permission. | — |
| 1b | Verify "Set your area" fallback screen appears. Tap map, drop a pin, tap **Save location**. | — |
| 1c | Verify dashboard loads with nearby tasks. | Launch app. Allow GPS. Confirm location is auto-selected. |

---

### 2. Post a Suyo (Requester)

| # | Step | Expected screen state |
|---|---|---|
| 2a | Tap **+** / Post a Suyo | Post form opens |
| 2b | Fill title, category, details, reward (e.g. ₱150), deadline (1 hour), drop pin on map | Form validates; pin and "Selected task coordinates" label visible |
| 2c | Tap **Post Suyo** | Returns to dashboard; new task appears in list |
| 2d | Tap **My Suyos → Posted** | Task visible with status `Open` |

---

### 3. Browse & Apply (Provider)

| # | Step | Expected screen state |
|---|---|---|
| 3a | Provider: tap task in browse list | Task detail screen opens |
| 3b | Confirm no **exact address** or **phone number** visible | Only public location shown |
| 3c | Tap **Apply to this Suyo** | Button changes to "Your application: pending" |
| 3d | Tap **My Suyos → Applications** | Application card shows "Application: pending" |

---

### 4. Accept application & private info reveal (Requester)

| # | Step | Expected screen state |
|---|---|---|
| 4a | Requester: tap **My Suyos → Posted** → open the task | Applications panel shows provider's name |
| 4b | Tap **Accept [provider name]** | Application status → `accepted`; task status → `Assigned` |
| 4c | Provider: refresh task | Exact address and contact phone now visible |
| 4d | Tap phone number → device dialler opens; tap address → copy works | ✅ |

---

### 5. Start task & upload proof (Provider)

| # | Step | Expected screen state |
|---|---|---|
| 5a | Provider: tap **Start task** | Status → `In progress` |
| 5b | Tap **Submit proof** screen opens; tap **Choose proof photo** | Camera/gallery picker opens |
| 5c | Select a photo | Thumbnail preview visible, "Submit proof" enabled |
| 5d | Add a note, tap **Submit proof** | Status → `Awaiting confirmation` |

---

### 6. Problem report & resubmit (optional path)

| # | Step | Expected screen state |
|---|---|---|
| 6a | Requester: tap **Request changes**, enter reason, tap **Submit** | Status → `In progress`; proof status → `rejected` |
| 6b | Provider: re-upload proof with corrected photo | Status → `Awaiting confirmation` again |

---

### 7. Approve proof & rate (Requester)

| # | Step | Expected screen state |
|---|---|---|
| 7a | Requester: tap **Approve completion** | Rating screen appears immediately |
| 7b | Select 5 stars, enter review, tap **Submit rating** | Rating: 5/5 shown; Submit button disappears |
| 7c | Tap **My Suyos → Activity** | Completed task visible |

---

### 8. Notifications

| # | Step | Expected screen state |
|---|---|---|
| 8a | Both devices: open **Notifications** from dashboard | Task update notifications listed |
| 8b | Tap **View request** on a notification | Navigates to correct task; notification marked read |

---

### 9. Transaction history

| # | Step | Expected screen state |
|---|---|---|
| 9a | Requester: open sidebar → **Transaction History** | Spent total shows ₱150.00 (or posted amount); completed task card visible |
| 9b | Provider: open sidebar → **Transaction History** | Earned total shows ₱150.00; rating stars and comment visible |

---

### 10. Logout & session restore

| # | Step | Expected screen state |
|---|---|---|
| 10a | Requester: sidebar → **Log Out** | Returns to login screen |
| 10b | Log back in | Dashboard loads immediately; previous data visible |

---

## Reset Instructions

To reset between demo runs:

1. In the Supabase dashboard, delete the test user accounts and run:
   ```sql
   truncate table suyo_requests, applications, proofs, ratings, notifications, transactions, request_events, user_locations cascade;
   ```
2. On each device, clear Expo Go app data or use a different account.

---

## Accepted Limitations

| Limitation | Impact |
|---|---|
| `npm ci` blocked by Windows file-lock on `lightningcss.win32-x64-msvc.node` while Metro runs | No demo impact; existing node_modules are correct |
| Leaflet CSS `url(images/...)` warnings during web bundle | Android/Expo Go path is unaffected; web map tiles work correctly |
| No push notifications (Expo Go FCM token not provisioned) | In-app notification bell covers the MVP requirement |
| `expo-doctor` suggests updating itself (0.11 → 0.14) | Informational only; all SDK checks pass |

---

*Recorded: 2026-09-30 · Expo Go SDK 54 · Migration `202609300001_core_mvp_privacy_transactions`*
