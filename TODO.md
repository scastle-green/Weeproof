# Weeproof — todo

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

## Future considerations (not building yet)
- [ ] **Multi-parent logging.** Both parents should be able to log and
  see the same data without buying/installing it twice. Needs real
  shared storage (ties to the earlier "cheapest persistence" discussion
  - Firebase/Supabase free tier) instead of the current per-device
  `localStorage`, plus some lightweight way to pair two phones to the
  same child's data (e.g. a share code/link, not full account
  creation). Bigger lift - revisit alongside the Web Push backend work,
  since both need the same "small server" foundation.
- [ ] **Multiple children.** E.g. twins - would need a child selector
  before logging, and all history/reminders scoped per child instead of
  one global log. Genuinely a real edge case, low priority, but noting
  it now since it'd affect the data model (events would need a
  `childId`) - cheaper to account for in the shared-storage redesign
  above than to retrofit later.
