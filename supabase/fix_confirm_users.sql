-- Fix: confirm all unconfirmed Auth users (dev bootstrap)
-- Run in Supabase SQL Editor for project: gniggkqljmrxbnrglqyw

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmed_at = coalesce(confirmed_at, now())
where email_confirmed_at is null;

-- Verify
select id, email, email_confirmed_at, confirmed_at
from auth.users
order by created_at desc;
