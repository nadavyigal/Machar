alter table events enable row level security;

create policy events_read_national on events for select
  to authenticated
  using (scope = 'national');

create policy events_read_institution on events for select
  to authenticated
  using (
    scope = 'institution'
    and institution_id in (
      select e.institution_id from enrollments e
      join members m on m.id = e.member_id
      where e.active and m.household_id in (select auth_household_ids())
    )
  );

create policy events_read_class on events for select
  to authenticated
  using (
    scope = 'class'
    and exists (
      select 1 from enrollments e
      join members m on m.id = e.member_id
      where e.active
        and m.household_id in (select auth_household_ids())
        and e.institution_id = events.institution_id
        and e.class_ref is not distinct from events.class_ref
    )
  );

create policy events_household_all on events for all
  to authenticated
  using (scope = 'household' and household_id in (select auth_household_ids()))
  with check (scope = 'household' and household_id in (select auth_household_ids()));

-- Note that only the household policy grants write. National rows are written
-- by the seed script using the service role; institution and class writes
-- arrive in P4 through a dedicated contribution path.

-- Same CLI default as 0002_core_rls.sql: auto_expose_new_tables is off, so
-- events is unreachable via PostgREST for either role until explicitly
-- granted, regardless of whether RLS policies are correct.
--
-- authenticated gets select (every read policy above is `to authenticated`,
-- across all four scopes) plus insert/update/delete (needed only by
-- events_household_all's `for all`). The table-level grant cannot itself be
-- scoped to household rows -- that narrowing is what the RLS policies above
-- already do. Because no insert/update/delete policy exists for national,
-- institution, or class scope, granting these privileges at the table level
-- does not open write access to those scopes: RLS still denies any row for
-- a command with no applicable policy. anon gets nothing, since every policy
-- keys off auth.uid() and the product requires sign-in.
grant select, insert, update, delete on events to authenticated;

-- service_role has BYPASSRLS but, per the same CLI default, still needs the
-- table grant to avoid "permission denied" -- the seed script inserts
-- national rows and tests insert household/national/class fixtures directly
-- via the admin client.
grant select, insert, update, delete on events to service_role;
