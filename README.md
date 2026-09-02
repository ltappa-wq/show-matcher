# TogetherWatch

Two seats. One catalog. Titles you both actually want to watch.

Live build is on Floot (TogetherWatch). This repo is a GitHub snapshot of the app-specific source.

## What works

- Catalog grid with Seat A / Seat B picks
- Match list = intersection of both seats
- `GET /_api/titles` loads normalized titles from Postgres, curated catalog fallback
- `POST /_api/search` searches TMDB server-side and upserts titles
- `GET|POST /_api/picks` persists seat picks

## Secrets

Configure `TMDB_API_KEY` and/or `TMDB_ACCESS_TOKEN` as **server-side** secrets only. Never `VITE_`.
