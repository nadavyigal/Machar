# Machar: Roadmap

Last updated: 2026-08-30

## What Machar is

A Hebrew iOS app that answers one question for an Israeli parent:

> **What does my family need tomorrow, before it is too late to arrange it?**

School closures, short days and per-child differences arrive as WhatsApp
messages, printed circulars and half-remembered dates. The parent who misses one
loses a workday. Machar makes that state visible without the parent entering a
single date.

**Not** a family organiser, a chore app, a shared to-do list or a school comms
platform. Those are what this becomes if scope is not defended.

## Who it is for

Israeli households with children in גן through יסודי, where at least one parent
works. Version one is for the founder's own family - a real user with real
consequences, in the year the calendar actually applies.

## The bet

The Ministry of Education publishes the school year once. The value is not in
having the data. It is in resolving it **per child**, for **this household**, and
surfacing it **the day before it matters**. A family with a gan child on a
six-day week and a school child on a five-day week has a different calendar for
each, and no published source shows them together.

## Phases

### P1: Cold-start spine ✅ merged 2026-08-30 (PR #1)

A household can exist and a correct calendar can be computed with zero user
input beyond who the children are.

- Supabase schema: households, members, institutions, enrollments, events.
- Household-isolation RLS, verified by adversarial probing rather than by
  reading the SQL.
- Four-scope event model (national / institution / class / household); only
  household scope is writable, so P4's class sharing needs no migration.
- Ministry institution registry parser.
- Calendar engine: school-year types, self-consistency validator, day resolver,
  per-child month view model.
- The 2026-27 (תשפ"ז) school year transcribed from the Ministry circular and
  seeded as national events.

**Outcome:** the logic is correct and provably isolated. Nothing is visible.

### P2: The app a parent can open ⬅ in progress (PR #2)

- `ios/MacharCore`: the calendar engine ported to Swift, 18 tests mirroring the
  TypeScript cases.
- `ios/Machar`: onboarding, the tomorrow card, the month grid.
- Local-only storage. No account, no network.

**Remaining in P2:**

| # | Step | Outcome |
|---|---|---|
| 1 | **Ministry fidelity check** on the 2026-27 data (Task 8 step 4) | The dates are human-verified, not just internally consistent. This gates every other person using the app. |
| 2 | Edit and delete children after onboarding | A parent can fix a typo without deleting the app. |
| 3 | Day detail: tap a day, see each child and the reason | The month grid stops being a colour code. |
| 4 | Install on the founder's iPhone | Real daily use starts, in the school year this data covers. |

**Outcome:** the founder's family uses it daily from the first week of the school
year. That is the only P2 success measure. Not App Store, not users.

### P3: Worth keeping on the phone

Only build these after two weeks of real use say which is missing.

- A notification the evening before a day where any child is out.
- Home-screen widget with tomorrow's state.
- The next school year, and a way to update a year without an app release.

**Outcome:** the founder stops checking the app because the app tells him first.

### P4: More than one household

This is where the Supabase work from P1 finally gets used.

- Sign-in, sync, second parent on a second device.
- Institution and class scope: the specific school's own days, then a class
  parent sharing a class-scope event.

**Outcome:** two parents in one household see the same calendar. Decides whether
Machar is a personal tool or a product.

### P5: Distribution

Not scoped. Do not scope it before P4 has evidence.

## Gates

| Gate | Condition |
|---|---|
| Anyone outside the founder's family uses it | The Ministry fidelity check is done and signed off |
| Middle/high school families | The schema gets its own bucket for חטיבת ביניים / חטיבה עליונה; today they would see 10 false open days at year end |
| Any sync work | Two weeks of real single-device use first |
| Any App Store work | P3 complete and still used daily |

## Known debt

- Migrations `0005` and `0008` do not exist; the numbering was never reconciled.
- `[analytics]` is disabled in the committed `supabase/config.toml`, which
  changes local dev for anyone who clones this.
- High-school closure applicability is inferred from practice, not from the
  circular, and is recorded as such at the mapping site.
- The calendar engine now exists in TypeScript and Swift. The tests mirror each
  other deliberately; a precedence change must land in both.
