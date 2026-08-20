alter table profiles
  add column if not exists digest_subscribed boolean not null default true;
