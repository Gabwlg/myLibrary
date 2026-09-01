-- myLibrary schema
create extension if not exists pgcrypto;

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('movie', 'book', 'other')),
  title text not null,
  creator text,
  year int,
  image_url text,
  status text not null,
  notes text,
  rating numeric(2,1),
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.movie_info (
  id_item uuid primary key references public.items(id) on delete cascade,
  director text,
  runtime_minutes int
);

create table if not exists public.book_info (
  id_item uuid primary key references public.items(id) on delete cascade,
  author text,
  page_count int
);

alter table public.items enable row level security;
alter table public.movie_info enable row level security;
alter table public.book_info enable row level security;

create policy "Users manage own items"
  on public.items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users read own movie details"
  on public.movie_info
  for all
  using (
    exists (
      select 1 from public.items
      where items.id = movie_info.id_item and items.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.items
      where items.id = movie_info.id_item and items.user_id = auth.uid()
    )
  );

create policy "Users read own book details"
  on public.book_info
  for all
  using (
    exists (
      select 1 from public.items
      where items.id = book_info.id_item and items.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.items
      where items.id = book_info.id_item and items.user_id = auth.uid()
    )
  );

-- Seed examples (replace user UUID with a real auth user id)
-- insert into public.items (id, user_id, type, title, creator, year, image_url, status, tags)
-- values
--   ('c4a6dfcc-1942-47a6-9f89-bf7e5f52be8d', '00000000-0000-0000-0000-000000000000', 'movie', 'Dune: Part Two', 'Denis Villeneuve', 2024, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80', 'to watch', '{sci-fi,epic}'),
--   ('5f3d9d29-51d5-4a0f-9a8f-a2c7496d6b6d', '00000000-0000-0000-0000-000000000000', 'book', 'The Name of the Wind', 'Patrick Rothfuss', 2007, 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=600&q=80', 'reading', '{fantasy}');
-- insert into public.movie_info (id_item, director, runtime_minutes)
-- values ('c4a6dfcc-1942-47a6-9f89-bf7e5f52be8d', 'Denis Villeneuve', 166);
-- insert into public.book_info (id_item, author, page_count)
-- values ('5f3d9d29-51d5-4a0f-9a8f-a2c7496d6b6d', 'Patrick Rothfuss', 662);
