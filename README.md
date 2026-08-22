# Weeproof

A tiny installable web app for tracking when your kid goes for a wee, with an
hourly reminder that resets every time you log a new one.

## How it works

- Tap **Log a wee** each time he goes.
- The app shows a countdown to the next reminder — always `last wee time + interval` (1 hour by default).
- Logging a new wee at any point (on the hour, the half hour, whenever) resets the countdown to start again from that moment.
- If no new wee gets logged, the first reminder fires one interval after the last log — then, if it's still missed, it keeps nagging every "repeat" interval (10 min by default, set in Settings) instead of waiting a full interval again. Logging a wee or accident cancels the nagging and goes back to the normal cadence.
- If nothing's ever been logged (a fresh install, or history cleared), there's no "last wee" to count from, so the app treats it as already overdue rather than quietly granting a fresh hour's grace period — the countdown shows a growing `-Xm Xs` "Overdue by" straight away instead of implying he's fine for the next hour when that's simply not known. It won't nag immediately on that very first load, but the first nag still arrives one repeat-interval later, same as any other miss.
- Tap **✎** next to the countdown to override the next reminder directly — nudge it with the +/-5/15/30/60m chips, set an exact clock time, or reset it back to the last-wee-plus-interval default.
- Tap **Log an accident** to record one separately from successful wees. Accidents still reset the reminder countdown (he's not going to need to go again right away) but show up in the log tagged as an accident, and today's count breaks out `N wees · N accidents`.
- Tap **Log a poo** to track bowel movements too — useful for spotting a constipation pattern, which is a common cause of daytime wetting regressions (see below). Poos are tracked and shown in the log, but deliberately don't affect the wee reminder at all.
- Tap **Log at a different time** if you missed logging something in the moment — pick wee, accident, or poo and the actual time it happened, rather than "now".
- Today's log is listed below the buttons; tap ✕ on an entry to remove a mis-tap.
- Settings (⚙️) let you change the interval (30/60/90/120 min), the nag-repeat interval (5/10/15/30 min), toggle sound/vibration, and clear today's history.

## Background reading

If daytime wetting has come back after your child was previously dry, a few
things worth knowing:

- Almost all kids with daytime wetting issues have some degree of
  constipation too, even without obvious symptoms — a full rectum physically
  presses on the bladder. In one study, 89% of kids became dry in the day
  once the constipation was treated. This is why Weeproof tracks poos as
  well as wees — long gaps are worth mentioning to a GP.
  ([UNC Urology](https://www.med.unc.edu/urology/pediatrics/pediatric-conditions/daytime-wetness/),
  [PMC: Bladder and Bowel Dysfunction in Children](https://pmc.ncbi.nlm.nih.gov/articles/PMC5332240/))
- Scheduled toilet reminders ("timed voiding") — the core thing this app
  does — are recommended as first-line care by the International
  Children's Continence Society for any child with daytime incontinence.
  ([ICCS standardization document](https://onlinelibrary.wiley.com/doi/abs/10.1002/nau.22911))
- The trial evidence behind these interventions is honestly thin and
  inconsistent, so "recommended practice" isn't the same as "proven to work
  fast" — worth keeping expectations realistic.
  ([Cochrane review](https://www.cochrane.org/evidence/CD012367_conservative-non-pharmaceutical-and-non-surgical-treatments-children-who-have-daytime-urinary))
- Punishment and shaming reliably make accidents worse, not better — it
  turns toileting into a stress trigger instead of a mastery goal.
  ([Why Punishment Derails Potty Training](https://mom.com/toddler/20906-why-punishment-derails-potty-training))

None of this is medical advice — if it persists or you're worried, a GP or
paediatrician is the right call.

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
