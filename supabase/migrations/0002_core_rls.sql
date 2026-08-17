-- security definer so the policies below can call it without recursing into
-- household_members' own RLS
create function auth_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from household_members where user_id = auth.uid()
$$;

alter table households enable row level security;
alter table household_members enable row level security;
alter table members enable row level security;
alter table institutions enable row level security;
alter table enrollments enable row level security;

create policy households_read on households for select
  using (id in (select auth_household_ids()));
create policy households_write on households for all
  using (id in (select auth_household_ids()))
  with check (id in (select auth_household_ids()));

create policy household_members_read on household_members for select
  using (user_id = auth.uid());

create policy members_all on members for all
  using (household_id in (select auth_household_ids()))
  with check (household_id in (select auth_household_ids()));

create policy enrollments_all on enrollments for all
  using (member_id in (select id from members where household_id in (select auth_household_ids())))
  with check (member_id in (select id from members where household_id in (select auth_household_ids())));

-- the institutions registry is public reference data for any signed-in user
create policy institutions_read on institutions for select
  to authenticated using (true);

-- This CLI's local config defaults auto_expose_new_tables off (the new cloud
-- default: new tables get no DML privileges via the Data API roles until
-- explicitly granted). RLS above defines *which rows* are visible; these
-- grants are what make the tables reachable via PostgREST at all for the
-- `authenticated` role in the first place. `anon` gets nothing, since every
-- policy above keys off auth.uid() and the product requires sign-in.
grant select, insert, update, delete on households to authenticated;
grant select on household_members to authenticated;
grant select, insert, update, delete on members to authenticated;
grant select on institutions to authenticated;
grant select, insert, update, delete on enrollments to authenticated;

-- service_role has BYPASSRLS but the same CLI default still withholds table
-- grants from it; BYPASSRLS skips policy checks, not the underlying GRANT
-- check, so without this the admin/service client gets "permission denied"
-- on plain inserts (e.g. test fixtures seeding households directly).
grant select, insert, update, delete on households, household_members, members, institutions, enrollments to service_role;
