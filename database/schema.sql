-- Lumina Studio Supabase Schema
-- Run this in Supabase SQL editor

-- Profiles table (extends auth.users)
create table profiles (
  id uuid primary key references auth.users not null,
  display_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro', 'team')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Projects table
create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles not null,
  name text not null,
  thumbnail_url text,
  timeline_data jsonb,
  fps int default 24,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Media assets table (metadata only; files stored in Supabase Storage)
create table media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade,
  owner_id uuid references profiles,
  name text,
  storage_path text,
  duration float,
  width int,
  height int,
  type text check (type in ('video', 'audio', 'image')),
  created_at timestamp with time zone default now()
);

-- API usage tracking for rate limiting
create table api_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles,
  model text,
  tokens_used int,
  cost_usd numeric(10, 6),
  created_at timestamp with time zone default now()
);

-- Row Level Security policies
alter table profiles enable row level security;
alter table projects enable row level security;
alter table media_assets enable row level security;
alter table api_usage enable row level security;

-- Users can view their own profile
create policy "users_can_view_own_profile" 
  on profiles for select using (auth.uid() = id);

-- Users can update their own profile
create policy "users_can_update_own_profile" 
  on profiles for update using (auth.uid() = id);

-- Users can view their own projects
create policy "users_can_view_own_projects" 
  on projects for select using (auth.uid() = owner_id);

-- Users can create projects
create policy "users_can_create_projects" 
  on projects for insert with check (auth.uid() = owner_id);

-- Users can update their own projects
create policy "users_can_update_own_projects" 
  on projects for update using (auth.uid() = owner_id);

-- Users can delete their own projects
create policy "users_can_delete_own_projects" 
  on projects for delete using (auth.uid() = owner_id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  trigger after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket policies (create bucket named 'media' in Supabase dashboard)
-- Allow authenticated users to upload
-- Allow authenticated users to read their project media
-- Allow authenticated users to delete their media