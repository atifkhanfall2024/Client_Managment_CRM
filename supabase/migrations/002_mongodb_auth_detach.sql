-- Detach profiles from Supabase Auth so MongoDB auth UUIDs can be used.
-- Run once in SQL Editor after switching login/register to MongoDB.

alter table public.profiles
  drop constraint if exists profiles_id_fkey;

-- Optional: stop auto-creating profiles from auth.users
drop trigger if exists on_auth_user_created on auth.users;
