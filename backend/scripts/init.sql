create table if not exists users (
  user_id integer primary key,
  name varchar(255),
  email varchar(255),
  password_hash varchar(255),
  is_deleted bool default false,
  timezone integer check (timezone between -12 and 14)
);
