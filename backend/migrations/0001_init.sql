DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'editor') THEN
    CREATE TYPE editor AS ENUM ('vscode', 'unknown');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'segmenttype') THEN
    CREATE TYPE SegmentType AS ENUM ('coding', 'debugging', 'ai-coding');
  END IF;
END$$;

create table if not exists users (
  user_id serial primary key,
  name varchar(255),
  email varchar(255),
  password_hash varchar(255),
  is_deleted bool default false,
  timezone integer check (timezone between -12 and 14)
);

create index if not exists idx_users_active on users(user_id) where not is_deleted; -- for active non deleted users

create table if not exists machine (
  machine_id serial primary key,
  user_id integer not null references users(user_id),
  name varchar(100),
  os varchar(100),
  constraint unique_machine_per_user unique (user_id, name)
);

create table if not exists api_key (
  value char(64) primary key,
  user_id integer not null references users(user_id),
  editor Editor,
  machine_id integer references machine(machine_id),
  metadata_set boolean default false
);

create table if not exists projects (
  project_path text not null,
  project_name text generated always as (regexp_replace(project_path, '^.*[\\/]', '')) stored,
  user_id integer references users(user_id),
  primary key (user_id, project_path),

  started_at timestamp not null default now()
);

create table if not exists project_files (
  file_id serial primary key,

  user_id integer references users(user_id),
  project_path varchar(255),
  foreign key (user_id, project_path) references projects(user_id, project_path) on delete cascade,

  file_path varchar(500) not null, -- This is the path relative to the project path
  file_name text generated always as (regexp_replace(file_path, '^.*[\\/]', '')) stored,
  lang varchar(255),

  constraint unique_file unique (user_id, project_path, file_path) include (file_id)
);

create table if not exists file_segments (
  segment_id serial primary key,

  file_id integer not null references project_files(file_id) on delete cascade,

  -- Time 
  start_time timestamp not null,
  end_time timestamp not null,
  duration_seconds integer generated always as (extract(epoch from (end_time - start_time))) stored,
  constraint end_after_start check (end_time >= start_time),
  unique (file_id, start_time, end_time),

  -- Metadata
  segment_type SegmentType not null,
  human_line_changes integer default 0 not null,
  ai_line_changes integer default 0 not null,
  editor Editor not null,
  machine_id integer references machine(machine_id) not null
);

create table if not exists outbox (
  segment_id integer primary key references file_segments(segment_id),
  processed boolean default false
);
