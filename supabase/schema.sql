-- Digitaalinen viinikellari — MVP-skeema
-- Aja tämä Supabase-projektin SQL-editorissa.

create table wines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  producer text not null,
  country text not null,
  region text not null,
  grapes text[] not null default '{}',
  vintage int,
  type text not null check (type in ('red','white','rose','sparkling','dessert','fortified')),
  notes text,
  label_image_url text,
  created_at timestamptz not null default now()
);

create table bottles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  wine_id uuid not null references wines(id) on delete cascade,
  location text,
  quantity int not null default 1,
  purchase_price numeric,
  purchase_date date,
  status text not null default 'in_cellar' check (status in ('in_cellar','consumed')),
  created_at timestamptz not null default now()
);

-- Row Level Security: jokainen käyttäjä näkee ja muokkaa vain omaa dataansa.
alter table wines enable row level security;
alter table bottles enable row level security;

create policy "Users manage own wines" on wines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own bottles" on bottles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Indeksit yleisimpiin suodattimiin
create index wines_country_idx on wines(country);
create index wines_region_idx on wines(region);
create index wines_vintage_idx on wines(vintage);
create index bottles_wine_id_idx on bottles(wine_id);
create index bottles_status_idx on bottles(status);
