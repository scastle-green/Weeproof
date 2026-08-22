# Weeproof — todo

## Context
- Before this app existed, the stopgap was a native phone reminder set
  to prompt a toilet check hourly, 9am–9pm — but the phone's built-in
  Reminders app couldn't actually do proper hourly repeats. That
  limitation is the direct reason Weeproof exists.
- Branding idea to consider alongside (or instead of) "Weeproof": **"A
  Wee Reminder"**.

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
- [ ] **Child self-log.** Let the child log themselves via a
  pre-reader-friendly, icon-based tap (no text), with a small
  celebration animation on success - separate concern from the
  multi-child/childId item below, this is about the child being the one
  using the button, not about supporting more than one child.

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
  alongside the Web Push backend work, since both need the same "small
  server" foundation.
- [ ] **Multiple children.** E.g. twins - would need a child selector
  before logging, and all history/reminders scoped per child instead of
  one global log. Genuinely a real edge case, low priority, but noting
  it now since it'd affect the data model (events would need a
  `childId`) - cheaper to account for in the shared-storage redesign
  above than to retrofit later.

## Architecture notes (backend, auth)
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
  data. Two implementation paths depending on how the app ends up
  shipping: WebAuthn if it stays a web/PWA (modern mobile browsers
  support real biometric-backed unlock), or a native biometric plugin
  if it ends up wrapped via Capacitor per the earlier native-app
  discussion.
