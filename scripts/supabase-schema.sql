-- =============================================================================
-- LUMINA STUDIO - Supabase Schema
-- =============================================================================
-- Run this SQL in your Supabase SQL editor to set up the database
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- =============================================================================
-- Projects table - stores project metadata and basic info
-- =============================================================================
create table if not exists projects (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    name text not null,
    description text,
    thumbnail_url text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    duration_seconds integer default 0,
    fps integer default 24,
    zoom real default 2.0
);

-- =============================================================================
-- Media assets table - stores media file references
-- =============================================================================
create table if not exists media_assets (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references projects on delete cascade not null,
    name text not null,
    url text not null,
    thumbnail_url text,
    duration_seconds real default 0,
    width integer default 1920,
    height integer default 1080,
    type text check (type in ('video', 'audio', 'image')) not null,
    file_size bigint,
    created_at timestamp with time zone default now()
);

-- =============================================================================
-- Tracks table - timeline tracks (video/audio)
-- =============================================================================
create table if not exists tracks (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references projects on delete cascade not null,
    name text not null,
    type text check (type in ('video', 'audio')) not null,
    position integer not null,
    is_locked boolean default false,
    is_visible boolean default true,
    created_at timestamp with time zone default now()
);

-- =============================================================================
-- Clips table - timeline clips with references to media
-- =============================================================================
create table if not exists clips (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references projects on delete cascade not null,
    track_id uuid references tracks on delete cascade not null,
    asset_id uuid references media_assets on delete set null,
    name text not null,
    type text check (type in ('video', 'audio', 'text', 'ai')) not null,
    start_frame integer not null,
    duration integer not null,
    effects jsonb default '[]'::jsonb,
    created_at timestamp with time zone default now()
);

-- =============================================================================
-- Color nodes table - color grading nodes for each clip
-- =============================================================================
create table if not exists color_nodes (
    id uuid primary key default uuid_generate_v4(),
    clip_id uuid references clips on delete cascade not null,
    node_type text check (node_type in ('exposure', 'white-balance', 'curves', 'lut', 'color-wheel', 'smh', 'input', 'output')) not null,
    params jsonb default '{}'::jsonb,
    position_x real default 0,
    position_y real default 0,
    created_at timestamp with time zone default now()
);

-- =============================================================================
-- Color connections table - connections between color nodes
-- =============================================================================
create table if not exists color_connections (
    id uuid primary key default uuid_generate_v4(),
    clip_id uuid references clips on delete cascade not null,
    source_node_id uuid references color_nodes not null,
    target_node_id uuid references color_nodes not null,
    created_at timestamp with time zone default now()
);

-- =============================================================================
-- Keyframes table - animation keyframes for clip effects
-- =============================================================================
create table if not exists keyframes (
    id uuid primary key default uuid_generate_v4(),
    clip_id uuid references clips on delete cascade not null,
    effect_id uuid,
    frame_number integer not null,
    value jsonb not null,
    interpolation text check (interpolation in ('linear', 'ease-in', 'ease-out', 'bezier')) default 'linear',
    created_at timestamp with time zone default now()
);

-- =============================================================================
-- Export jobs table - video export queue
-- =============================================================================
create table if not exists export_jobs (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references projects on delete cascade not null,
    user_id uuid references auth.users not null,
    status text check (status in ('queued', 'processing', 'completed', 'failed')) default 'queued',
    format text default 'mp4',
    quality text check (quality in ('low', 'medium', 'high', 'ultra')) default 'medium',
    output_url text,
    error_message text,
    progress integer default 0,
    created_at timestamp with time zone default now(),
    completed_at timestamp with time zone
);

-- =============================================================================
-- Collaborators table - real-time collaboration metadata
-- =============================================================================
create table if not exists collaborators (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references projects on delete cascade not null,
    user_id uuid references auth.users not null,
    display_name text,
    cursor_x real,
    cursor_y real,
    last_seen timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    unique(project_id, user_id)
);

-- =============================================================================
-- Indexes for performance
-- =============================================================================
create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_media_assets_project_id on media_assets(project_id);
create index if not exists idx_tracks_project_id on tracks(project_id);
create index if not exists idx_clips_project_id on clips(project_id);
create index if not exists idx_clips_track_id on clips(track_id);
create index if not exists idx_color_nodes_clip_id on color_nodes(clip_id);
create index if not exists idx_keyframes_clip_id on keyframes(clip_id);
create index if not exists idx_export_jobs_project_id on export_jobs(project_id);
create index if not exists idx_collaborators_project_id on collaborators(project_id);

-- =============================================================================
-- Row Level Security Policies
-- =============================================================================
-- Enable RLS on all tables
alter table projects enable row level security;
alter table media_assets enable row level security;
alter table tracks enable row level security;
alter table clips enable row level security;
alter table color_nodes enable row level security;
alter table color_connections enable row level security;
alter table keyframes enable row level security;
alter table export_jobs enable row level security;
alter table collaborators enable row level security;

-- Projects policies
create policy "Users can view their own projects" on projects
    for select using (auth.uid() = user_id);
create policy "Users can insert their own projects" on projects
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own projects" on projects
    for update using (auth.uid() = user_id);
create policy "Users can delete their own projects" on projects
    for delete using (auth.uid() = user_id);

-- Media assets policies
create policy "Users can manage media for their projects" on media_assets
    for all using (
        exists (select 1 from projects where projects.id = media_assets.project_id and projects.user_id = auth.uid())
    );

-- Track policies
create policy "Users can manage tracks for their projects" on tracks
    for all using (
        exists (select 1 from projects where projects.id = tracks.project_id and projects.user_id = auth.uid())
    );

-- Clip policies
create policy "Users can manage clips for their projects" on clips
    for all using (
        exists (select 1 from projects where projects.id = clips.project_id and projects.user_id = auth.uid())
    );

-- Export jobs policies
create policy "Users can view their export jobs" on export_jobs
    for select using (auth.uid() = user_id);
create policy "Users can create export jobs" on export_jobs
    for insert with check (auth.uid() = user_id);

-- Collaborators policies - read all, update own
create policy "Users can view collaborators" on collaborators
    for select using (true);
create policy "Users can manage their collaboration status" on collaborators
    for all using (auth.uid() = user_id);

-- =============================================================================
-- Realtime Publication
-- =============================================================================
-- Enable Realtime for collaboration features
alter table projects replica identity full;
alter table clips replica identity full;
alter table tracks replica identity full;
alter table media_assets replica identity full;
alter table collaborators replica identity full;
alter table export_jobs replica identity full;