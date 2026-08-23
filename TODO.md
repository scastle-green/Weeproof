# Weeproof — todo

## Context
- Before this app existed, the stopgap was a native phone reminder set
  to prompt a toilet check hourly, 9am–9pm — but the phone's built-in
  Reminders app couldn't actually do proper hourly repeats. That
  limitation is the direct reason Weeproof exists.
- Branding idea to consider alongside (or instead of) "Weeproof": **"A
  Wee Reminder"**.
- **The live PWA (GitHub Pages) is a proof of concept, not the shipping
  product.** It's staying up because it's genuinely being used day to
  day, but it was never the plan to launch/market/monetize *that* -
  the Flutter + MySQL + Node/Python/PHP stack under Architecture notes
  is the actual productization path if this gets taken further. Worth
  keeping in mind when reading the ASO/pricing/distribution notes
  elsewhere in this file: those were scoped to a future native app, not
  a plan to push the current web version as a real release.
- **Real result so far: a remarkable change since starting to use the
  app.** Separately, he genuinely likes being involved in logging it
  himself - tapping the button is something he wants to do, not just
  tolerates. Both are worth remembering: this isn't just a convenience
  tool for the parent, the kid's own engagement with it seems to be
  part of why it's working. Also a good hook for the Distribution /
  feedback channels posts below if that ever happens - a real "this
  actually helped" result is worth more than a feature list.

## Research
- [x] Look into the science/papers on daytime wetting regression in
  school-age kids — first pass done, sources in README under
  "Background reading" (constipation link, ICCS timed-voiding guidance,
  Cochrane evidence caveat, punishment/shaming research).

  **Summary — timed voiding is the actual evidence basis for this app:**
  Scheduled toilet reminders ("timed voiding") are recommended as
  first-line care for *any* child with daytime incontinence, per the
  International Children's Continence Society's standardization
  document. So the app's core mechanic (log → hourly reminder) isn't
  just a convenient nudge, it's the specific intervention clinical
  guidance leads with before anything else is tried. Caveat: the
  Cochrane review of trial evidence for these interventions found it
  thin and heterogeneous, so this is "recommended standard practice,"
  not "proven to work fast" — keep that distinction in any wording used
  in the app or its listing.

  **Paper to read properly (not just skimmed via search) for future
  reference:**
  Chang SJ, Van Laecke E, Bauer SB, et al. *"Treatment of daytime
  urinary incontinence: A standardization document from the
  International Children's Continence Society."* Neurourology and
  Urodynamics, 2017.
  https://onlinelibrary.wiley.com/doi/abs/10.1002/nau.22911
- [ ] Dig deeper / keep an eye out for anything more specific than the
  first pass turned up (e.g. anything on regression specifically, vs.
  daytime wetting in general).
- [ ] Turn the "Background reading" links into fuller practical
  guidance for parents: what tends to help and what to avoid, written
  out properly rather than just linked. Frame as general information,
  not medical advice, and point to a GP/paediatrician for anything that
  looks like it needs one.
- [ ] Revisit whether logging "refused to go when prompted" is worth
  adding as a fourth event type, once the deeper research above says
  whether refusal/withholding patterns are actually something worth
  tracking.

## Open feature ideas
- [ ] **Show time between events, not time-since-now, in the log list.**
  Right now each entry shows "X ago" relative to the current moment,
  which is only useful in the instant you glance at it and stops being
  informative as the day goes on. More useful: show the gap to the
  previous entry of the *same type* (e.g. "9:03am · 1h 12m since last
  wee") - that surfaces the actual pattern (is he going every 45 min or
  every 3 hours?) which is what actually matters for judging whether
  the reminder interval is well-tuned. Same principle applies to poos -
  the gap between them is literally the constipation-frequency signal
  already noted under Research, so this isn't just a wee-log nicety.
  The very first entry of a given type (nothing earlier to compare to)
  has no gap to show - just the time, or "first today".
- [ ] **Wee/poo graph over time.** At some point, a proper trends view -
  wees, accidents, and poos plotted over days/weeks rather than just
  today's flat list. Natural extension of the time-between-events item
  above (that's the per-entry version, this is the zoomed-out picture)
  and directly useful for two things already noted elsewhere: judging
  whether accidents cluster around long poo gaps (the constipation
  link from Research), and eventually tuning the adaptive-interval idea
  off real data instead of guessing. Also just genuinely useful to show
  a GP if it comes to that - "here's the pattern" beats trying to
  describe it from memory. No rush on this one; wants real weeks of
  data in the log before a chart is more useful than noise.
- [ ] Surface the fuller guidance from the research above somewhere
  in-app (e.g. a "Tips" section), once it exists - right now it's only
  in the README.
- [ ] Consider a lightweight "hard/painful?" marker when logging a poo -
  frequency alone is a weaker constipation signal than frequency +
  straining/pain, per the Rome IV criteria referenced in the research.
  Not built yet since it adds friction to logging; revisit if the poo
  log turns out to be useful on its own first.
- [ ] **Adaptive reminder interval.** Instead of a flat interval the
  parent sets once, adapt the check interval automatically based on how
  it's going: lengthen it after X days with no accidents, shorten it
  after repeated accidents. Would need to decide/tune what X is and how
  big a step to adjust by - worth revisiting once there's enough real
  usage data to see what a sensible default looks like, rather than
  guessing up front.
- [ ] **In-app feedback prompt.** Ask users for feedback and missing
  features from inside the app (not just relying on store reviews) -
  both useful for improving it and for engagement.
- [ ] **Child self-log + rewards.** Let the child log themselves via a
  pre-reader-friendly, icon-based tap (no text), with a celebration
  animation on success. Bumped up from "someday" to worth prioritizing
  properly: real usage shows he actively wants to be the one tapping
  the button, and there's been a remarkable improvement since starting
  to use the app - the engagement itself may be doing real work here,
  not just the reminder mechanism. Make it fun and make him feel
  involved: stars/points for logging (wees and poos both - not just
  "good" outcomes, showing up and using the toilet is the behavior
  being reinforced), a simple visible tally or small chart of
  stars/streaks he can see building up, positive animation/sound on
  every log. Explicitly *not* a full toddler-training reward curriculum
  (see BUILD_BRIEF.md's "who this is not for") - keep it lightweight,
  no loss states, no charts that can go backwards or feel punishing on
  an accident day. Separate concern from the multi-child/childId item
  below, which is about supporting more than one child, not this.

## Distribution / feedback channels
- [ ] Non-ad places to post for early feedback and users: r/Parenting,
  r/toddlers, r/Preschoolers, r/alphaandbetausers, r/SideProject, Indie
  Hackers, Mumsnet.

## Future considerations (not building yet)
- [ ] **Multi-parent logging.** Both parents should be able to log and
  see the same data without buying/installing it twice. Needs real
  shared storage instead of the current per-device `localStorage` (see
  Architecture notes below for the current DB/hosting decision - this
  supersedes the earlier Firebase/Supabase suggestion), plus some
  lightweight way to pair two phones to the same child's data (e.g. a
  share code/link, not full account creation). Bigger lift - revisit
  alongside the notification-reliability work (Web Push if it stays a
  PWA, or just native push if the Flutter path in Architecture notes
  goes ahead), since both need the same "small server" foundation.
- [ ] **Multiple children.** E.g. twins - would need a child selector
  before logging, and all history/reminders scoped per child instead of
  one global log. Genuinely a real edge case, low priority, but noting
  it now since it'd affect the data model (events would need a
  `childId`) - cheaper to account for in the shared-storage redesign
  above than to retrofit later.

## Architecture notes (backend, auth)
- See `BUILD_BRIEF.md` in this repo for the standalone spec to hand to a
  coding agent for the actual Flutter rebuild - it captures the exact
  reminder algorithm, data model, and phased scope (MVP -> shared data ->
  nice-to-haves) so a fresh agent doesn't need this whole file's history.

- [ ] **Client: Flutter**, being considered instead of the earlier
  "wrap the existing PWA in Capacitor" plan. Worth being clear-eyed
  that this is a bigger call than it sounds: it's a full rewrite (Dart,
  not the existing HTML/CSS/JS) rather than reusing what's built,
  whereas Capacitor would have wrapped the current code as-is. The
  upside is real though - it cleanly resolves two things noted
  separately above without extra plumbing: `local_auth` gives proper
  native biometrics, and native push (FCM/APNs) sidesteps the Web Push
  backend complexity noted under Multi-parent logging - a real app
  shell can schedule/receive notifications far more reliably than a
  backgrounded browser tab ever could.
- [ ] **Backend API: Python, PHP, or Node** - Node was flagged with
  "assuming it can handle the MySQL side" - it can, comfortably (the
  `mysql2` driver plus an ORM like Prisma or Knex is a completely
  standard, mature combination). So the choice between the three is
  genuinely just about preference/familiarity, not a technical
  limitation of any of them.
- [ ] **Database: self-hosted MySQL**, not a managed platform. Decision
  is to keep ongoing cost low by hosting it yourself rather than
  Firebase/Supabase's per-project managed tier. Real trade-off worth
  keeping in mind: this moves cost from money to your own time - you
  own patching, backups, and uptime instead of a managed platform
  handling it. Also needs somewhere to actually run it, since MySQL
  itself doesn't have a meaningful free managed tier the way
  Firebase/Supabase do (a small VPS - e.g. Hetzner/DigitalOcean - or
  self-hosting at home are the realistic options).
- [ ] **Auth: prefer OAuth where possible** over building
  username/password from scratch - e.g. Sign in with Apple / Google.
  Note: if the app ships on iOS and offers any third-party OAuth login,
  Apple's App Store guidelines (4.8) require Sign in with Apple to also
  be offered as an option.
- [ ] **Biometrics baked in** - Face ID / Touch ID / fingerprint to
  unlock the app, presumably given the health-adjacent nature of the
  data. If the Flutter path above goes ahead, this is just the
  `local_auth` package - straightforward. (Only falls back to WebAuthn
  or a Capacitor plugin if the client decision above reverts to staying
  web-based.)
