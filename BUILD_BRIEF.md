# Weeproof — build brief for a coding agent

This is a standalone spec for building the "real" version of Weeproof — a
Flutter rebuild of the working proof-of-concept PWA that lives in this same
repo (`index.html` / `app.js` / `style.css`). Read this file on its own; it
doesn't assume you've seen the rest of the repo, though the PWA's `app.js`
is the authoritative reference implementation of the logic below if
anything here is ambiguous.

## What this app is

A tracker for parents of a school-age child who has had daytime wetting
regress after being previously dry (not a toddler potty-training app — see
"Who this is not for" below). Core loop: log when he goes (or has an
accident), get reminded to prompt a toilet check on a schedule that resets
every time something is logged. The scheduled-reminder approach ("timed
voiding") is recommended first-line care by the International Children's
Continence Society for daytime incontinence in children — this app's core
mechanic has a real evidence basis, not just a "seemed like a good idea"
one. See `README.md` in this repo for the fuller research summary and
citations.

**Who this is not for:** toddlers being potty-trained for the first time.
That's a much more crowded app category with different needs (training
schedules, readiness assessment, a whole curriculum). Don't pull in a full
training-program UX from that category — this is a narrower tool for an
older kid and their parent, not a course.

That said, don't over-read "not a toddler app" as "no rewards at all" —
real usage shows the child actively wants to be the one tapping the
button, and there's been a genuine, noticeable improvement since starting
to use it, so the child's own engagement with logging appears to be doing
real work here, not just the reminder mechanism. See the child self-log +
rewards item in `TODO.md` for the specific, lightweight shape this should
take (stars/celebration for logging itself, not a loss-state chart, not
gated on "good" outcomes only).

## The core domain logic (get this exactly right)

This is the part worth being precise about — it's subtle enough that a
plausible-looking reimplementation can still get the edge cases wrong.

**State** (per child, once multi-child support exists — see Phasing):
- `events`: list of `{ id, ts: DateTime, type: 'wee' | 'accident' | 'poo' }`
- `intervalMinutes`: int, default 60. User-selectable: 30 / 60 / 90 / 120.
- `repeatIntervalMinutes`: int, default 10. User-selectable: 5 / 10 / 15 / 30.
- `nextReminderAt`: DateTime, always set once the app has run once (see
  "Cold start" below — there's no meaningful "unset" state in steady use).
- `overshoot`: bool — whether the reminder is currently in "nagging" mode
  (see rule 3).

**Rule 1 — poos don't drive the reminder.** Define
`mostRecentReminderEvent` as the latest event, by `ts`, whose `type` is
`wee` or `accident` (skip any `poo` entries, even if one is chronologically
the most recent event overall). Only `mostRecentReminderEvent` ever feeds
the scheduling math below. Logging, editing, or deleting a `poo` never
touches `nextReminderAt` or `overshoot` — it's pure tracking, useful for
spotting a constipation pattern (a very common contributor to daytime
wetting), nothing more.

**Rule 2 — logging a wee or accident resets the schedule.** On logging
either type at timestamp `ts`:
```
nextReminderAt = mostRecentReminderEvent.ts + intervalMinutes
overshoot = false
```
Note this uses `mostRecentReminderEvent`, not necessarily `ts` itself —
if the user backdates an entry to a time earlier than an existing later
wee/accident, the schedule is still driven by whichever is chronologically
latest, not by whichever was just tapped.

**Rule 3 — missed reminders nag on a shorter cycle, not the full interval
again.** When `now >= nextReminderAt`, fire an alert (see Notifications),
then:
```
step = overshoot ? repeatIntervalMinutes : intervalMinutes
nextReminderAt += step
overshoot = true
```
So: the *first* miss waits a full `intervalMinutes` after the last log,
consistent with rule 2. Every miss after that re-fires every
`repeatIntervalMinutes` until a new wee/accident resets it back to rule 2's
`overshoot = false` state.

**Rule 4 — deleting an event.** If the deleted event was a wee/accident,
recompute from the new `mostRecentReminderEvent` per rule 2 (or, if no
wee/accident remains at all, fall back to "now" as the base). If the
deleted event was a `poo`, do nothing to the reminder state at all — it
never touched it.

**Rule 5 — manual override.** The user can directly nudge `nextReminderAt`
by a relative delta (+/-5/15/30/60 min) or set an exact clock time today
(rolling to tomorrow if that time has already passed), independent of the
event log. There's also an explicit "reset to default" action that
reapplies rule 2 from `mostRecentReminderEvent`. An override is silently
superseded the next time a wee/accident is logged (rule 2 always wins) —
that's intentional, don't try to "protect" a manual override from being
overwritten by a new log.

**Rule 6 — cold start (nothing ever logged).** There's no real "last wee"
to base a countdown on. Do **not** grant a fresh `intervalMinutes` of
grace as if he'd just gone — that's misleading (it implies knowledge you
don't have). Instead:
```
nextReminderAt = now
overshoot = true
```
i.e. treat it as already due. Do **not** fire an alert at the instant this
is set (that would mean a brand-new install immediately buzzes at you) —
schedule the *first* actual alert `repeatIntervalMinutes` from now, same
timing as any other ongoing miss, just without an alert at t=0.

**Display:** `remaining = nextReminderAt - now`. If positive, show
something like "Next reminder in 42m 10s". If `<= 0`, show the *elapsed*
overdue time growing live — "Overdue by 12m 34s" — not a static "due now"
label. Parents want to know how overdue it is, not just that it is.

**Reliability is the actual point of doing this rewrite.** The PWA
prototype cannot make rules 3/6 fire reliably once the browser tab is
backgrounded or the phone is locked for a while — JS timers get suspended,
and it can only "catch up" retroactively when reopened. That's the #1
reason this is being rebuilt natively. Whatever scheduling mechanism you
use must survive the app being fully closed for hours: **use the OS's
native local-notification scheduling API** (Flutter:
`flutter_local_notifications`), not a foreground timer/polling loop.
Reschedule the pending local notification every time rules 2–6 recompute
`nextReminderAt`. This does **not** require a backend or push server for a
single-device MVP — local notifications are scheduled and fired entirely
on-device by the OS. Only cross-device sync (Phase 2, see below) needs a
server in the loop for notifications.

## Data model

```
events (
  id           bigint / uuid, primary key
  child_id     fk -> children.id   (nullable / single implicit child until Phase 2)
  user_id      fk -> users.id      (who logged it - relevant once multi-parent exists)
  type         enum('wee','accident','poo')
  occurred_at  datetime            -- the real/backdated time, not necessarily created_at
  created_at   datetime
)

settings (
  child_id               fk -> children.id
  interval_minutes        int, default 60
  repeat_interval_minutes int, default 10
  sound_enabled            bool, default true
  vibrate_enabled          bool, default true
)

-- Phase 2 only:
children ( id, name, created_by_user_id )
users ( id, oauth_provider, oauth_subject, display_name )
child_shares ( child_id, user_id )   -- who can see/log for which child
```

`occurred_at` matters: the app supports logging an event for a time other
than "now" (parent forgot to log in the moment) — never assume
`occurred_at == created_at`.

## Phasing

**Phase 1 (MVP) — ship the reliability fix first, nothing else:**
- Flutter app, single device, no login, no backend.
- Local persistence only (SQLite via `sqflite`, or even just `shared_preferences`
  for something this small — either is fine).
- Full domain logic above, native local notifications for the reminder.
- Log wee / accident / poo, backdate any of them to a specific time,
  today's log list with delete, settings for the two intervals + sound/vibrate.
- Manual reminder override (nudge chips + exact time + reset-to-default).
- This alone is a complete, useful app and fixes the one real limitation
  of the PWA prototype. Don't let Phase 2/3 scope creep into this phase.

**Phase 2 — shared data, once Phase 1 is proven out:**
- Backend API (Node, Python, or PHP — genuinely just pick whichever you're
  most comfortable in, all three handle this fine) + self-hosted MySQL.
- OAuth login (Sign in with Apple / Google). If shipping on iOS and
  offering any other OAuth provider, Apple requires Sign in with Apple
  also be offered (App Store guideline 4.8).
- Biometric app-lock on top of login (`local_auth` — Face ID / Touch ID /
  fingerprint), given the data is health-adjacent.
- Multi-parent: both parents see/log the same child's data without a
  second purchase — a lightweight share-code/link flow, not full
  multi-tenant account infrastructure.
- Multi-child support (e.g. twins) — a child selector before logging, all
  history/reminders scoped per child. Low priority, but if Phase 2 touches
  the data model anyway, add `child_id` now rather than retrofitting later.
- Once there's a server and multiple devices, reminders should be
  server-driven push (FCM/APNs) in addition to (or instead of) local
  notifications, so both parents' phones stay in sync.

**Phase 3 — nice-to-haves, mostly no urgency, don't build speculatively —
with one exception:**
- **Child self-log + lightweight rewards** — treat this one as higher
  priority than the rest of this list, not speculative. Pre-reader-friendly,
  icon-based (no text) logging so the kid taps it themselves, plus stars/
  celebration for logging (any log — wee, accident, or poo — not gated on
  "good" outcomes only). Real usage already shows the child wants to be
  the one tapping the button, and there's been a genuine improvement since
  starting to use the app at all — his own engagement with logging seems
  to be doing real work, not just the reminder mechanic. Keep it
  lightweight (stars/streak, positive animation) — explicitly not a full
  toddler-training reward curriculum with loss states or charts that can
  go backwards; see "Who this is not for" above.
- **Time-between-events in the log, not time-since-now.** Cheap enough
  to fold into Phase 1 rather than wait: each log entry currently would
  show "X ago" relative to the current moment, which stops being useful
  once time passes. Show the gap to the previous entry of the *same
  type* instead (e.g. "1h 12m since last wee") — that's the actual
  pattern that matters for judging whether the reminder interval is
  well-tuned, and for poos it's literally the constipation-frequency
  signal from the Research section of `TODO.md`. Pure display logic
  over data already being fetched — no new fields or backend work
  needed, so there's no real reason to defer it with the rest of this
  phase.
- Adaptive reminder interval (auto-lengthen after X accident-free days,
  shorten after repeated accidents) — needs real usage data to tune
  sensibly, don't guess the constants up front.
- In-app feedback prompt.
- A "hard/painful?" marker on poo logs (stronger constipation signal than
  frequency alone, per the Rome IV criteria) — only worth it once poo
  logging itself is proven useful.
- Surfacing the background-reading/guidance content in-app (currently only
  in this repo's README).

## Explicitly out of scope

- Not a medical device, not a diagnostic tool. Any guidance content
  surfaced in-app must be framed as general information with a clear
  "see a GP/paediatrician" pointer, never as a treatment plan.
- No ads, no data resale — this is a paid-once-or-free personal tool, not
  an ad-supported product (see this repo's TODO.md for the honest
  monetization assessment if that's relevant to your build).
- No punishment/shaming-adjacent UX (streak-breaking guilt trips, "oh no"
  messaging on an accident, etc.) — the research is clear that shame makes
  outcomes worse. Keep tone neutral-to-encouraging throughout, especially
  around accidents.

## Branding

Working name is "Weeproof"; "A Wee Reminder" is a live alternative under
consideration. Don't hard-code either name deeply into code/asset
filenames in a way that makes a rename annoying later.
