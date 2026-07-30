-- Client Management CRM — Initial Schema
-- Run this in Supabase SQL Editor (or via supabase db push)

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.user_role as enum ('super_admin', 'admin', 'manager', 'employee');
create type public.client_status as enum ('lead', 'active', 'inactive', 'archived');
create type public.priority_level as enum ('low', 'medium', 'high', 'urgent');
create type public.project_status as enum ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled');
create type public.task_status as enum ('todo', 'in_progress', 'review', 'done', 'cancelled');
create type public.entity_type as enum ('client', 'company', 'project', 'task', 'user', 'document');

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'employee',
  avatar_url text,
  phone text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Companies
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  industry text,
  address text,
  phone text,
  email text,
  created_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_id uuid references public.companies (id) on delete set null,
  phone text,
  email text,
  website text,
  address text,
  industry text,
  budget numeric(14, 2) default 0,
  deadline date,
  requirements text,
  status public.client_status not null default 'lead',
  priority public.priority_level not null default 'medium',
  created_by uuid references public.profiles (id) on delete set null,
  assigned_manager_id uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id uuid not null references public.clients (id) on delete restrict,
  description text,
  budget numeric(14, 2) default 0,
  deadline date,
  priority public.priority_level not null default 'medium',
  status public.project_status not null default 'planning',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  created_by uuid references public.profiles (id) on delete set null,
  manager_id uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Project team members
create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (project_id, user_id)
);

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  project_id uuid not null references public.projects (id) on delete cascade,
  assigned_to uuid references public.profiles (id) on delete set null,
  due_date date,
  priority public.priority_level not null default 'medium',
  status public.task_status not null default 'todo',
  created_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Task comments
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Documents
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,
  entity_type public.entity_type not null,
  entity_id uuid not null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Activity / audit logs
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type public.entity_type not null,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_clients_status on public.clients (status) where deleted_at is null;
create index idx_clients_manager on public.clients (assigned_manager_id) where deleted_at is null;
create index idx_clients_company on public.clients (company_id) where deleted_at is null;
create index idx_clients_name on public.clients using gin (to_tsvector('english', coalesce(name, '')));
create index idx_projects_client on public.projects (client_id) where deleted_at is null;
create index idx_projects_status on public.projects (status) where deleted_at is null;
create index idx_projects_manager on public.projects (manager_id) where deleted_at is null;
create index idx_tasks_project on public.tasks (project_id) where deleted_at is null;
create index idx_tasks_assigned on public.tasks (assigned_to) where deleted_at is null;
create index idx_tasks_status on public.tasks (status) where deleted_at is null;
create index idx_activity_entity on public.activity_logs (entity_type, entity_id);
create index idx_activity_created on public.activity_logs (created_at desc);
create index idx_notifications_user on public.notifications (user_id, created_at desc);
create index idx_documents_entity on public.documents (entity_type, entity_id) where deleted_at is null;
create index idx_profiles_role on public.profiles (role) where deleted_at is null;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'employee')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: current user role
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles
  where id = auth.uid() and deleted_at is null and is_active = true;
$$;

create or replace function public.is_admin_or_above()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('super_admin', 'admin') from public.profiles
     where id = auth.uid() and deleted_at is null and is_active = true),
    false
  );
$$;

create or replace function public.is_manager_or_above()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('super_admin', 'admin', 'manager') from public.profiles
     where id = auth.uid() and deleted_at is null and is_active = true),
    false
  );
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.documents enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;

-- Profiles policies
create policy "Users can view active profiles"
  on public.profiles for select
  using (auth.uid() is not null and deleted_at is null);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin_or_above());

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (public.is_admin_or_above());

-- Companies
create policy "Authenticated can view companies"
  on public.companies for select
  using (auth.uid() is not null and deleted_at is null);

create policy "Managers+ can manage companies"
  on public.companies for all
  using (public.is_manager_or_above())
  with check (public.is_manager_or_above());

-- Clients
create policy "Authenticated can view clients"
  on public.clients for select
  using (auth.uid() is not null and deleted_at is null);

create policy "Admins can manage clients"
  on public.clients for insert
  with check (public.is_admin_or_above());

create policy "Admins and assigned managers can update clients"
  on public.clients for update
  using (
    public.is_admin_or_above()
    or assigned_manager_id = auth.uid()
  );

create policy "Admins can soft-delete clients"
  on public.clients for update
  using (public.is_admin_or_above());

-- Projects
create policy "View projects if manager+ or team member"
  on public.projects for select
  using (
    deleted_at is null and (
      public.is_manager_or_above()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = projects.id and pm.user_id = auth.uid()
      )
    )
  );

create policy "Managers+ create projects"
  on public.projects for insert
  with check (public.is_manager_or_above());

create policy "Managers+ update projects"
  on public.projects for update
  using (public.is_manager_or_above());

-- Project members
create policy "View project members"
  on public.project_members for select
  using (auth.uid() is not null);

create policy "Managers+ manage members"
  on public.project_members for all
  using (public.is_manager_or_above())
  with check (public.is_manager_or_above());

-- Tasks
create policy "View tasks if related"
  on public.tasks for select
  using (
    deleted_at is null and (
      public.is_manager_or_above()
      or assigned_to = auth.uid()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = tasks.project_id and pm.user_id = auth.uid()
      )
    )
  );

create policy "Managers+ create tasks"
  on public.tasks for insert
  with check (public.is_manager_or_above());

create policy "Assignees and managers update tasks"
  on public.tasks for update
  using (
    public.is_manager_or_above()
    or assigned_to = auth.uid()
  );

-- Comments
create policy "View comments on visible tasks"
  on public.task_comments for select
  using (auth.uid() is not null);

create policy "Authenticated create comments"
  on public.task_comments for insert
  with check (auth.uid() = user_id);

-- Documents
create policy "View documents"
  on public.documents for select
  using (auth.uid() is not null and deleted_at is null);

create policy "Upload documents"
  on public.documents for insert
  with check (auth.uid() = uploaded_by);

create policy "Owners and admins update documents"
  on public.documents for update
  using (uploaded_by = auth.uid() or public.is_admin_or_above());

-- Activity logs
create policy "Managers+ view activity"
  on public.activity_logs for select
  using (public.is_manager_or_above());

create policy "Authenticated insert activity"
  on public.activity_logs for insert
  with check (auth.uid() is not null);

-- Notifications
create policy "Users view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "System/managers insert notifications"
  on public.notifications for insert
  with check (public.is_manager_or_above() or user_id = auth.uid());

-- Storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "Authenticated upload documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid() is not null);

create policy "Authenticated read documents"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.uid() is not null);

create policy "Owners delete documents"
  on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid() = owner);

-- Dashboard stats view
create or replace view public.dashboard_stats as
select
  (select count(*) from public.clients where deleted_at is null) as total_clients,
  (select count(*) from public.projects where deleted_at is null and status = 'in_progress') as active_projects,
  (select count(*) from public.projects where deleted_at is null and status = 'completed') as completed_projects,
  (select count(*) from public.tasks where deleted_at is null and status in ('todo', 'in_progress', 'review')) as pending_tasks,
  (select coalesce(sum(budget), 0) from public.projects where deleted_at is null and status = 'completed') as revenue;

-- Enable realtime
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.projects;
