# Machar - Todo

## Now
- [ ] MCH-01: finish P2 (`docs/work-packets/MCH-01-finish-p2.md`)
  - [x] Story 1: fidelity-check checklist generator
  - [x] Story 2: edit and delete children
  - [x] Story 3: day detail sheet
  - [ ] Story 4: install on the founder's iPhone
- [x] **Human gate:** fidelity check signed off 2026-08-30. The gate is open.
- [ ] Set `DEVELOPMENT_TEAM` in `ios/Machar.xcodeproj` so the app can sign for a
      physical device (currently unset; simulator builds do not need it)

## Next (P3, only after two weeks of real use)
- [ ] Evening notification for a day where any child is out
- [ ] Home-screen widget
- [ ] Next school year without an app release

## Later (P4)
- [ ] Sign-in and sync
- [ ] P1 task 5: registry acquisition and seed script
- [ ] P1 task 6: institution search
- [ ] P1 task 13: unverified-institution fallback (owns migration 0008)
- [ ] Institution and class scope events

## Debt
- [ ] Migrations 0005 and 0008 do not exist; numbering never reconciled
- [ ] `[analytics]` disabled in the committed `supabase/config.toml`
- [ ] Middle and high school families would see 10 false open days at year end
