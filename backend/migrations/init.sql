DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'editor') THEN
    CREATE TYPE editor AS ENUM ('vscode', 'unknown');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lang') THEN
    CREATE TYPE Lang AS ENUM ('abap', 'bat', 'bibtex', 'clojure', 'coffeescript', 'c', 'cpp', 'csharp', 'dockercompose', 'css', 'cuda-cpp', 'd', 'dart', 'diff', 'dockerfile', 'erlang', 'fsharp',  'go', 'groovy', 'handlebars', 'haml', 'haskell', 'html', 'ini', 'java', 'javascript', 'javascriptreact', 'json', 'jsonc', 'julia', 'latex', 'less', 'lua', 'makefile', 'markdown', 'objective-c', 'objective-cpp', 'ocaml', 'pascal', 'perl', 'perl6', 'php', 'plaintext', 'powershell', 'jade', 'pug', 'python', 'r', 'razor', 'ruby', 'rust', 'scss', 'sass', 'shaderlab', 'shellscript', 'slim', 'sql', 'stylus', 'svelte', 'swift', 'typescript', 'typescriptreact', 'tex', 'vb', 'vue', 'vue-html', 'xml', 'xsl', 'yaml');
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

create table if not exists projects (
  project_path varchar(500),
  project_name text generated always as (regexp_replace(project_path, '^.*[\\/]', '')) stored,
  user_id integer references users(user_id),
  primary key (user_id, project_path),

  started_at timestamp not null default now()
);

create table if not exists project_files (
  file_id integer primary key,

  user_id integer references users(user_id),
  project_path varchar(255),
  foreign key (user_id, project_path) references projects(user_id, project_path) on delete cascade,

  file_path varchar(500), -- This is the path relative to the project path
  file_name text generated always as (regexp_replace(file_path, '^.*[\\/]', '')) stored,
  lang Lang,

  -- File rename setup
  old_file_path varchar(500), 
  superseded_by integer references project_files (file_id),
  deleted_at timestamp
);

CREATE UNIQUE INDEX if not exists unique_active_file_path
ON project_files (user_id, project_path, file_path)
WHERE deleted_at IS NULL AND superseded_by IS NULL;
