create table if not exists nodes (
  id text primary key,
  type text not null,
  label text not null,
  content text not null default '',
  context text not null default '',
  status text not null default 'pending',
  author text,
  source jsonb,
  team text,
  created_at timestamptz not null default now()
);
create table if not exists edges (
  id text primary key,
  from_node text not null references nodes(id) on delete cascade,
  to_node text not null references nodes(id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now()
);
alter table nodes disable row level security;
alter table edges disable row level security;
alter publication supabase_realtime add table nodes;
alter publication supabase_realtime add table edges;
