create table if not exists user_stats_aggregate_daily (
  user_id int not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  lang_durations jsonb default '{}'::jsonb,
  machine_durations jsonb default '{}'::jsonb,
  editor_durations jsonb default '{}'::jsonb,
  project_durations jsonb default '{}'::jsonb,
  activity_durations jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, window_start)
);

create table if not exists user_stats_rolling_day (
  user_id int primary key,
  lang_durations jsonb default '{}'::jsonb,
  machine_durations jsonb default '{}'::jsonb,
  editor_durations jsonb default '{}'::jsonb,
  project_durations jsonb default '{}'::jsonb,
  activity_durations jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_project_stats_aggregate_daily (
  user_id integer,
  project_path varchar(500) not null,
  window_start timestamp not null,
  window_end timestamp not null,
  lang_durations jsonb,
  machine_durations jsonb,
  editor_durations jsonb,
  activity_durations jsonb,
  files_durations jsonb,
  updated_at timestamptz default now(),
  unique (user_id, project_path, window_start)
);

create table if not exists user_project_stats_rolling_day (
  user_id integer,
  project_path varchar(500) not null,
  lang_durations jsonb,
  machine_durations jsonb,
  editor_durations jsonb,
  activity_durations jsonb,
  files_durations jsonb,
  updated_at timestamptz default now(),
  unique (user_id, project_path)
);

create table if not exists user_project_session (
  user_id int not null,
  project_path int not null,
  window_start timestamp not null,
  window_end timestamp not null,
  primary key (user_id, project_path, window_start)
);

create table if not exists user_lang_session (
  user_id int not null,
  lang text,
  window_start timestamp not null,
  window_end timestamp not null,
  primary key (user_id, lang, window_start)
);
