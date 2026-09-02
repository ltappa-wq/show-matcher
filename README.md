# TogetherWatch

A room for however many people. Pick titles. See what overlaps.

Live build is on Floot. This repo is a source snapshot.

## What it does

- Create or join a room by 6-character code (`/r/CODE`)
- Any number of members, each with their own picks
- Matches = titles picked by 2+ people, ranked by overlap (`everyone` if the whole room picked it)
- Catalog + TMDB search, posters from cached `poster_path`
- Repeat searches hit Postgres first (`search_queries` + `titles`)

## API

- `POST /_api/rooms` create
- `POST /_api/rooms/join` join
- `GET /_api/rooms?code=` room + members + picks
- `GET|POST /_api/picks` room-scoped picks
- `GET /_api/titles` cached catalog (backfills missing posters once)
- `POST /_api/search` TMDB only when the cache is thin

## Secrets

`TMDB_API_KEY` and/or `TMDB_ACCESS_TOKEN` are server-side only. Never `VITE_`.
