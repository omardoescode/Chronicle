create table user_stats_aggregate (
  user_id int,
  window_type text not null check (window_type in ('day', 'week', 'month', 'year', 'last day', 'last week', 'last month', 'last year')),
  window_start timestamp not null,
  window_end timestamp not null,
  total_duration bigint,
  lang_durations jsonb,
  machine_durations jsonb,
  editor_durations jsonb,
  project_durations jsonb,
  activity_durations jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, window_type, window_start)
);

create table user_project_stats_aggregate (
  project_id int primary key,
  window_type text not null check (window_type in ('day', 'week', 'month', 'year', 'last day', 'last week', 'last month', 'last year', 'all_time')),
  window_start timestamp not null,
  window_end timestamp not null,
  total_duration bigint,
  lang_durations jsonb,
  machine_durations jsonb,
  editor_durations jsonb,
  activity_durations jsonb,
  files_durations jsonb,
  updated_at timestamptz default now()
);

create table user_project_session (
  user_id int not null,
  project_id int not null,
  window_start timestamp not null,
  window_end timestamp not null,
  primary key (user_id, project_id, window_start)
);

create table user_lang_session (
  user_id int not null,
  lang text,
  window_start timestamp not null,
  window_end timestamp not null,
  primary key (user_id, lang, window_start)
);
