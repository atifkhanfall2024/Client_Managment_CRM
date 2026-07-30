-- Seed helper notes:
-- 1. Run 001_initial_schema.sql first
-- 2. Register users via the app (/register)
-- 3. Then promote your first user to super_admin in SQL:

-- update public.profiles
-- set role = 'super_admin'
-- where email = 'you@company.com';

-- Optional demo companies (run after you have at least one profile id):
-- insert into public.companies (name, industry, email, created_by)
-- values
--   ('Acme Corp', 'Technology', 'hello@acme.test', '<profile-uuid>'),
--   ('Nova Labs', 'Marketing', 'team@nova.test', '<profile-uuid>');
