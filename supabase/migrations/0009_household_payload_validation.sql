-- Finding (Important, batched review): create_household is a `security
-- definer` RPC directly callable by any authenticated client via `.rpc()`,
-- so the Zod schema in src/lib/household/createHousehold.ts is a
-- convenience guard, not the security boundary. 0007 closed the "empty
-- p_adults array" gap with a jsonb_array_length check, but a wrong-shaped
-- *non-empty* element still passed that check and failed deep inside the
-- members insert loop with a raw, uncaught Postgres error, e.g.:
--   null value in column "first_name" of relation "members" violates
--   not-null constraint
-- That leaks internal table/column names to any caller who calls the RPC
-- with a malformed payload -- an information leak, not a data-integrity
-- bug (rollback already worked).
--
-- Fix: validate the shape of every element of p_adults and p_children
-- before any insert runs, and raise a clean domain-level message that
-- names neither table nor column. Because all validation happens before
-- the first insert, a rejected payload never leaves partial rows.
--
-- Re-created (not altered) because Postgres has no ALTER FUNCTION ...
-- BODY; create or replace keeps the same signature so existing grants
-- survive.
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

  -- Validate every adult's shape up front, before any insert.
  for v_adult in select * from jsonb_array_elements(p_adults) loop
    if jsonb_typeof(v_adult) <> 'object'
      or v_adult ->> 'firstName' is null
      or btrim(v_adult ->> 'firstName') = ''
    then
      raise exception 'invalid household payload: each adult needs a first name';
    end if;
  end loop;

  -- Validate every child's shape up front, before any insert.
  for v_child in select * from jsonb_array_elements(p_children) loop
    if jsonb_typeof(v_child) <> 'object'
      or v_child ->> 'firstName' is null
      or btrim(v_child ->> 'firstName') = ''
    then
      raise exception 'invalid household payload: each child needs a first name';
    end if;

    if v_child ->> 'birthYear' is null
      or jsonb_typeof(v_child -> 'birthYear') <> 'number'
      or (v_child ->> 'birthYear') !~ '^-?\d+$'
    then
      raise exception 'invalid household payload: each child needs an integer birth year';
    end if;

    if v_child ->> 'institutionId' is null
      or (v_child ->> 'institutionId') !~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then
      raise exception 'invalid household payload: each child needs a valid institution reference';
    end if;
  end loop;

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
  -- The unique constraint from 0007 is what actually guarantees the
  -- one-household-per-user invariant under concurrency; this catch keeps
  -- the error message the same friendly one as the sequential "if exists"
  -- guard above, regardless of which of the two concurrent transactions
  -- loses the race.
  when unique_violation then
    raise exception 'user already belongs to a household';
end;
$$;

revoke execute on function create_household(text, jsonb, jsonb) from public;
grant execute on function create_household(text, jsonb, jsonb) to authenticated;
