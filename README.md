# Weeproof

A tiny installable web app for tracking when your kid goes for a wee, with an
hourly reminder that resets every time you log a new one.

## How it works

- Tap **Log a wee** each time he goes.
- The app shows a countdown to the next reminder — always `last wee time + interval` (1 hour by default).
- Logging a new wee at any point (on the hour, the half hour, whenever) resets the countdown to start again from that moment.
- If no new wee gets logged, it keeps reminding every interval from the last one until you log again.
- Tap **✎** next to the countdown to override the next reminder directly — nudge it with the +/-5/15/30/60m chips, set an exact clock time, or reset it back to the last-wee-plus-interval default.
- Tap **Log an accident** to record one separately from successful wees. Accidents still reset the reminder countdown (he's not going to need to go again right away) but show up in the log tagged as an accident, and today's count breaks out `N wees · N accidents`.
- Today's log is listed below the buttons; tap ✕ on an entry to remove a mis-tap.
- Settings (⚙️) let you change the interval (30/60/90/120 min), toggle sound/vibration, and clear today's history.

All data stays on the phone (`localStorage`) — there's no server or account.

## Running it

This is a static site, so any static file server works. From this folder:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open it on your phone. For notifications and "add to home screen" to
work properly it needs to be served over **HTTPS** (or `localhost` while
testing on the same machine) — plain `http://<lan-ip>` will load the page but
browsers block notification permission and service workers on it. For real
use, deploy it somewhere with HTTPS, e.g. GitHub Pages, Netlify, Vercel, or
Cloudflare Pages, and open that URL on the phone.

## Installing on your phone

**Android (Chrome):** open the site → menu (⋮) → **Add to Home screen**.

**iPhone (Safari):** open the site → Share icon → **Add to Home Screen**.
On iOS, notifications for home-screen web apps require iOS 16.4+, and you
must open the installed app (not the Safari tab) once and tap **Enable
reminders** for permission to be granted.

## A note on background reminders

This is a plain client-side web app with no backend, so reminders are
best-effort:

- While Weeproof is open (foreground or recently backgrounded) it will fire
  the notification/sound/vibration right on time.
- If the OS fully suspends or closes the tab/app, the timer can't fire while
  it's suspended — but the moment you reopen Weeproof it checks the time
  against the last wee and immediately fires any reminder that was missed.
- For guaranteed on-time alerts even with the app fully closed for hours,
  you'd need push notifications from a real server. This app intentionally
  skips that so it stays a simple, private, no-account, no-backend tool —
  just keep it on the home screen and glance at it occasionally.

## Files

- `index.html` / `style.css` / `app.js` — the app
- `manifest.webmanifest` — PWA install metadata
- `sw.js` — service worker for offline caching + notification click handling
- `icons/` — app icons
