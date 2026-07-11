# Anact Ortho

> **Democratizing elite sports tech with an on-device AI referee, commentator, and scout inside a single phone.**
>
> _VS Hacks submission — Anact Ortho Master Blueprint._

Anact Ortho turns any smartphone mounted to a fence or a $9 tripod into a real-time referee, playground commentator, and pro-grade scouting analyst — powered **entirely on-device**. No wearables. No smart balls. No cloud upload. No subscription.

---

## What it does

Three parallel pillars, running simultaneously on the same phone:

- **Automated Officiating** — CV court-line calibration + ball tracking → an instant whistle the moment the ball crosses the boundary, killing the 15–20% of pickup time lost to disputes.
- **Playground Commentary** — Event-driven text-to-speech watches score, streaks, and momentum, calling out plays broadcast-style.
- **Zero-Cost Pro Scouting** — Vertical jump (cm), shot release velocity (m/s), heatmap, and highlight reel — auto-exported as a shareable scout card with a QR code.

## Why it wins

- **Equity angle** — kills the pay-to-play data divide (avg $883/season club fees, $Ks of enterprise SaaS) that keeps low-income and minority talent invisible to recruiters.
- **Edge-native** — MediaPipe pose + hue/motion ball tracker run on the phone's own GPU. Works offline in parks with no cellular bar.
- **Zero-hardware** — the tool every athlete already owns. Just launch, mount, play.

---

## Tech stack

| Layer | Tech |
| --- | --- |
| App shell | React 19 + TypeScript + Vite + React Router |
| UI | TailwindCSS, Framer Motion, Lucide icons, custom broadcast HUD |
| Pose model | `@mediapipe/tasks-vision` — Pose Landmarker Lite (GPU-delegated, quantized) |
| Ball tracker | Custom OpenCV-style hue + inter-frame motion segmentation with kinematic-vector fallback on occlusion |
| Officiating | Point-in-quad test against user-calibrated homography anchors |
| Commentary | Web Speech API + templated playground / broadcast / hype phrase engine |
| Whistle & FX | Live-synthesized referee whistle, score blip, crowd shimmer via Web Audio API |
| State | Zustand |
| Install | PWA manifest — installable as a standalone app on any phone |

Everything is bundled into a single SPA. The pose model is fetched from a CDN once, then cached by the service worker layer of the browser — after that, the whole thing works offline.

---

## Running locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`) on the machine you'd like to test on.

### Trying it on your phone

Modern browsers require **HTTPS** (or `localhost`) to grant camera access. Two easy options:

1. Open the same URL on your phone if you're on the same Wi-Fi as your laptop, and accept the "insecure origin" prompt in Chrome/Safari for `http://<lan-ip>:5173` (some browsers require flag). Or:
2. Deploy to any static host (Vercel, Netlify, GitHub Pages) — HTTPS comes free and camera/mic will work everywhere.

### Building for production

```bash
npm run build
npm run preview
```

---

## App flow

1. **`/` Landing** — pitch and stats.
2. **`/calibrate`** — enable camera, tap 4 corners of the court (or hit **Auto-detect** for a starter homography).
3. **`/live`** — tip off. You'll see:
   - Live pose skeleton overlay on every detected player
   - Ball indicator with solid or dashed ring (dashed = predicted through occlusion)
   - Court boundary drawn in orange
   - Live score, streak, and commentary caption
   - Manual score buttons + whistle button (for scenarios the CV misses)
4. **`/analytics`** — post-game report with heatmap, momentum curve, highlight reel, player breakdown, and full event log. JSON export included.
5. **`/profile`** — the **scout card**: a shareable, QR-fronted page recruiters can open on any device.

## Judge-friendly touches

- **Zero-friction demo** — Landing → "See a demo dashboard" loads a rich fake session so judges see the analytics/scout card even without a camera present.
- **Manual overrides everywhere** — `+2/+3` per team, manual whistle, TTS toggle, whistle toggle. If a demo court is dark or unusual, judges can still drive the experience.
- **On-device chip** — every page displays a green "Edge · Offline-first" chip, making the differentiator obvious in screenshots.
- **PWA** — click **Add to Home Screen** on a phone and Anact Ortho becomes a standalone app.

---

## Repo layout

```
src/
├─ App.tsx                  # Router
├─ components/
│   ├─ Layout.tsx           # Header + bottom nav + page transitions
│   └─ Logo.tsx
├─ lib/
│   ├─ audio.ts             # Web Audio whistle/score/crowd + Web Speech TTS
│   ├─ ball.ts              # Hue + motion ball tracker, kinematic fallback
│   ├─ commentary.ts        # Playground/broadcast/hype phrase engine
│   ├─ pose.ts              # MediaPipe pose + JumpTracker + ReleaseVelocity
│   └─ useCamera.ts         # MediaStream lifecycle hook
├─ pages/
│   ├─ Analytics.tsx        # Post-game dashboard (heatmap, momentum, log)
│   ├─ Calibrate.tsx        # Corner tap-mapping / auto-detect
│   ├─ Landing.tsx          # Pitch, stats, broadcast mock
│   ├─ Live.tsx             # The main game surface
│   └─ ScoutProfile.tsx     # Shareable scout card w/ QR
└─ state/
    └─ gameStore.ts         # Zustand — sport, events, players, snapshot
```

---

## Roadmap toward the pitch's full vision

- Swap the color-hue ball tracker for a lightweight quantized YOLO-nano tflite when running natively; the same interface stays.
- Replace the pseudo-QR with `qr-code-styling` for real recruit sharing.
- Wrap the PWA in a React Native / Capacitor shell to hit NPUs (Neural Engine, Hexagon) directly for even lower thermal load.
- Persist match snapshots in IndexedDB and let players sign scout cards with a WebAuthn key so verification is trust-minimized.

---

_"Every kid, every court, every jump — on the record."_
