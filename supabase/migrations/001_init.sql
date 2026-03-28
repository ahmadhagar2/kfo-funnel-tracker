-- KFO Funnel Tracker – initial schema

create table if not exists funnel_entries (
  id           uuid primary key default gen_random_uuid(),
  datum        date not null,
  uhrzeit      time not null,
  standort     text not null check (standort in ('Stadttheater', 'Wiehre')),
  bereich      text not null check (bereich in ('Empfang', 'Planbesprechungszimmer')),
  mitarbeiter  text not null,
  werttyp      text not null check (werttyp in (
    'online_termin',
    'telefonische_anfrage',
    'sonstiger_kontakt',
    'neuaufnahme',
    'planbesprechung',
    'unterschriebene_unterlagen'
  )),
  anzahl       integer not null default 1,
  erstellt_am  timestamptz default now(),
  geaendert_am timestamptz default now()
);

create table if not exists users (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Seed users
insert into users (name) values ('Eva Maria'), ('Nathalie')
on conflict (name) do nothing;

-- Enable RLS
alter table funnel_entries enable row level security;
alter table users enable row level security;

-- Allow all operations (PIN handles access control on the frontend)
create policy "Allow all on funnel_entries" on funnel_entries
  for all using (true) with check (true);

create policy "Allow all on users" on users
  for all using (true) with check (true);

-- Enable Realtime on funnel_entries
alter publication supabase_realtime add table funnel_entries;
