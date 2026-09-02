# TogetherWatch

## Title catalog configuration

TogetherWatch loads movie and show metadata through its same-origin server endpoint and persists normalized results in `.data/title-cache.json`.

Configure either `TMDB_API_KEY` or `TMDB_ACCESS_TOKEN` as a **server-side Replit Secret** in both the development and published environments. Never use a `VITE_` prefix: Vite exposes variables with that prefix in browser assets.

The browser never receives the credential. Cached titles continue to work if TMDB is temporarily unavailable; uncached titles show a clear configuration or upstream-service warning and fall back to the curated local catalog.