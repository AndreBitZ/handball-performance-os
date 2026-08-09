-- Handball Performance OS
-- V1 data foundation. Designed for Supabase Free.
-- No video binaries are stored in Postgres.

create extension if not exists pgcrypto;

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  gender text not null check (gender in ('female','male','mixed')),
  category text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  status text not null default 'planned' check (status in ('planned','active','completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  first_name text not null,
  last_name text not null,
  display_name text generated always as (trim(first_name || ' ' || last_name)) stored,
  birth_date date,
  dominant_hand text check (dominant_hand in ('left','right','ambidextrous')),
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  photo_url text,
  status text not null default 'active' check (status in ('active','inactive','injured','released')),
  created_at timestamptz not null default now()
);

create table if not exists public.player_team_seasons (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  shirt_number integer check (shirt_number between 0 and 99),
  position text,
  joined_on date,
  left_on date,
  unique(player_id, team_id, season_id)
);

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  gender text check (gender in ('female','male','mixed')),
  category text,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  opponent_name text not null,
  opponent_team_id uuid references public.teams(id) on delete set null,
  competition_id uuid references public.competitions(id) on delete set null,
  match_date timestamptz,
  venue text,
  home_away text check (home_away in ('home','away','neutral')),
  goals_for integer,
  goals_against integer,
  status text not null default 'planned' check (status in ('planned','played','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.match_videos (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  source_type text not null default 'local' check (source_type in ('local','url','storage')),
  file_name text,
  duration_seconds numeric,
  file_size_bytes bigint,
  storage_path text,
  external_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  video_id uuid references public.match_videos(id) on delete set null,
  timestamp_seconds numeric(12,3) not null check (timestamp_seconds >= 0),
  duration_seconds numeric(12,3) not null default 0,
  event_type text not null,
  phase text,
  team_id uuid references public.teams(id) on delete set null,
  player_id uuid references public.players(id) on delete set null,
  result text,
  score_difference smallint,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.shot_events (
  event_id uuid primary key references public.events(id) on delete cascade,
  position text,
  zone text,
  distance_bucket text,
  shot_type text,
  hand text,
  assist_player_id uuid references public.players(id) on delete set null,
  defender_player_id uuid references public.players(id) on delete set null,
  goalkeeper_player_id uuid references public.players(id) on delete set null,
  xg numeric(6,4),
  outcome text
);

create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  match_id uuid not null references public.matches(id) on delete cascade,
  title text not null,
  start_seconds numeric(12,3) not null check (start_seconds >= 0),
  end_seconds numeric(12,3) not null check (end_seconds >= start_seconds),
  pre_roll_seconds numeric(6,2) not null default 5,
  post_roll_seconds numeric(6,2) not null default 8,
  notes text,
  is_favorite boolean not null default false,
  local_reference text,
  storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  name text not null,
  description text,
  is_dynamic boolean not null default false,
  filter_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.playlist_clips (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  clip_id uuid not null references public.clips(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (playlist_id, clip_id)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  name text not null,
  category text,
  unique(club_id, name)
);

create table if not exists public.clip_tags (
  clip_id uuid not null references public.clips(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (clip_id, tag_id)
);

create table if not exists public.clip_annotations (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clips(id) on delete cascade,
  type text not null check (type in ('arrow','line','circle','zone','text','freehand','ring')),
  start_seconds numeric(12,3) not null default 0,
  end_seconds numeric(12,3),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_teams_club on public.teams(club_id);
create index if not exists idx_players_club on public.players(club_id);
create index if not exists idx_player_team_season_player on public.player_team_seasons(player_id);
create index if not exists idx_matches_team_date on public.matches(team_id, match_date desc);
create index if not exists idx_events_match_time on public.events(match_id, timestamp_seconds);
create index if not exists idx_events_player on public.events(player_id);
create index if not exists idx_clips_match on public.clips(match_id);
create index if not exists idx_shots_xg on public.shot_events(xg);

-- V1 policy: database is ready for RLS, but application authentication is wired in the next phase.
-- Do not enable permissive public writes in production.
