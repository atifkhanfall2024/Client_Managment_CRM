-- Dev reset: remove auth user so you can register again with a known password
-- Run in SQL Editor, then go to /register and create the account again.

-- 1) Confirm which users exist
select id, email, email_confirmed_at, created_at
from auth.users;

-- 2) Delete your test user (change email if needed)
delete from auth.users
where email = 'muhammadatifkhan2004@gmail.com';

-- profiles row is removed automatically (ON DELETE CASCADE)
