# myLibrary

myLibrary is a modern Next.js + Supabase app for tracking personal media in one visual collection (movies, books, and expandable media types).

## Stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Storage-ready)

## Features in this starter

- Supabase auth wiring (email/password sign in + sign up)
- Responsive dashboard with media cards
- Add / edit / delete item flow
- Search, filter, and sort controls
- Item detail modal
- Tags, notes, rating, type-specific fields
- Dark cinematic UI style + empty state
- Add-item flow with external suggestion hooks:
  - Open Library search wired for books
  - TMDB search path prepared for movies
- Starter routes/components:
  - `/` dashboard
  - `/add` add-item page starter
  - `/items/[id]` detail page starter

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env.local
```

3. Fill in values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- optional: `NEXT_PUBLIC_TMDB_API_KEY`

4. In Supabase SQL editor, run:

- `/home/runner/work/myLibrary/myLibrary/supabase/schema.sql`

5. Start development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Database design

- `items` contains shared fields (`id`, `user_id`, `type`, `title`, `image_url`, `status`, `notes`, `rating`, `tags`, `created_at`, etc.)
- subtype 1:1 tables:
  - `movie_info(id_item PK/FK -> items.id)`
  - `book_info(id_item PK/FK -> items.id)`
- RLS enabled for all tables with per-user access policies

## External metadata integration points

- Book suggestions: `src/lib/library/search-providers.ts` (`searchSuggestions` for `book`)
- Movie suggestions (TMDB-ready): `src/lib/library/search-providers.ts` (`movie` branch using `NEXT_PUBLIC_TMDB_API_KEY`)
- Supabase item CRUD: `src/lib/supabase/library-repository.ts`

## Notes

- If Supabase env vars are not set, the app falls back to demo mode with seeded sample items from `src/lib/library/sample-items.ts`.
- For production image uploads, add a Supabase Storage bucket and save uploaded file URLs into `items.image_url`.
