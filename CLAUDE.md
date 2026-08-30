# CLAUDE.md: Machar

Hebrew iOS app: what does my family need tomorrow, from the Israeli school
calendar, resolved per child.

Read [docs/agent-os/project-context.md](docs/agent-os/project-context.md) first,
then [docs/plan/roadmap.md](docs/plan/roadmap.md) and
[tasks/lessons.md](tasks/lessons.md).

## Non-negotiable

1. **One calendar source of truth.** `src/lib/calendar/data/*.ts`, then
   `node scripts/exportSchoolYear.mjs`. Never hand-edit the iOS JSON bundle.
2. **Swift and TypeScript engines are one contract.** Behaviour changes land in
   both, with tests in both.
3. **RLS is the security boundary.** Probe policies with a real second
   household; never assert them from reading SQL.
4. **The Ministry data was human-verified on 2026-08-30**
   (`docs/fidelity-check-2026-2027.md`). Changing `src/lib/calendar/data/*.ts`
   invalidates that sign-off: regenerate the checklist and re-check what changed.
5. **Dates are ISO strings.** No `Date`/timezone handling inside calendar logic.
6. Update `tasks/progress.md` after every commit.

## Scope defence

Machar answers one question. A family organiser, chore list, shared to-do or
school comms feature is out of scope unless the roadmap says otherwise.
