-- Finding 1 (CRITICAL, task-9 review): one-household-per-user was only
-- enforced by a check-then-act guard in create_household (0006):
--   if exists (select 1 from household_members where user_id = auth.uid())
--     then raise exception ...
-- Under READ COMMITTED, two concurrent calls from the same signed-in user
-- both take their snapshot before either commits, so both pass the check
-- and both commit -- the reviewer reproduced two household_members rows for
-- one user. A composite primary key (household_id, user_id) does nothing to
-- stop the same user_id appearing under a second household_id.
--
-- Fix: a real uniqueness constraint on user_id, so the second insert fails
-- atomically at the database level instead of relying on the earlier read.
alter table household_members
  add constraint household_members_one_household_per_user unique (user_id);

-- Finding 2 (Important, task-9 review): create_household is directly
-- callable by any authenticated client via `.rpc()`. The "at least one
-- adult" rule lived only in the Zod schema (HouseholdInput in
-- src/lib/household/createHousehold.ts) -- the reviewer called the RPC with
-- p_adults: [] and it succeeded, creating an adult-less household. The Zod
-- rule stays (it's the good-path guard, gives a nice client-side error);
-- this makes the database the real invariant.
--
-- Re-created (not altered) because Postgres has no ALTER FUNCTION ... BODY;
-- create or replace keeps the same signature so existing grants survive.
create or replace function create_household(
  p_display_name text,
  p_adults jsonb,
  p_children jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_member_id uuid;
  v_child jsonb;
  v_adult jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_adults is null or jsonb_typeof(p_adults) <> 'array' or jsonb_array_length(p_adults) < 1 then
    raise exception 'household must have at least one adult';
  end if;

  if exists (select 1 from household_members where user_id = auth.uid()) then
    raise exception 'user already belongs to a household';
  end if;

  insert into households (display_name) values (p_display_name) returning id into v_household_id;
  insert into household_members (household_id, user_id) values (v_household_id, auth.uid());

  for v_adult in select * from jsonb_array_elements(p_adults) loop
    insert into members (household_id, role, first_name)
    values (v_household_id, 'adult', v_adult ->> 'firstName');
  end loop;

  for v_child in select * from jsonb_array_elements(p_children) loop
    insert into members (household_id, role, first_name, birth_year)
    values (v_household_id, 'child', v_child ->> 'firstName', (v_child ->> 'birthYear')::int)
    returning id into v_member_id;

    insert into enrollments (member_id, institution_id, class_ref)
    values (v_member_id, (v_child ->> 'institutionId')::uuid, nullif(v_child ->> 'classRef', ''));
  end loop;

  return v_household_id;
exception
  -- The unique constraint above is what actually guarantees the invariant
  -- under concurrency; this catch keeps the error message the same
  -- friendly one as the sequential "if exists" guard above, regardless of
  -- which of the two concurrent transactions loses the race. Everything
  -- this function inserted earlier in the same call (the households row,
  -- in particular) is rolled back along with the exception -- plpgsql
  -- exception blocks roll back to the implicit savepoint at block entry.
  when unique_violation then
    raise exception 'user already belongs to a household';
end;
$$;

revoke execute on function create_household(text, jsonb, jsonb) from public;
grant execute on function create_household(text, jsonb, jsonb) to authenticated;
