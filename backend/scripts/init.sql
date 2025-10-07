create table if not exists users (
  user_id serial primary key,
  name varchar(255),
  email varchar(255) unique,
  password_hash varchar(255),
  is_deleted bool default false,
  timezone integer check (timezone between -12 and 14)
);
