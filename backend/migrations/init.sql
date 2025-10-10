DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'editor') THEN
    CREATE TYPE Editor AS ENUM ('vscode', 'unknown');
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

create table if not exists machine(
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
