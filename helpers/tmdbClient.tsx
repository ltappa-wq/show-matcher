export function tmdbEnv() {
  const env = process.env as Record<string, string | undefined>;
  return { token: env.TMDB_ACCESS_TOKEN, apiKey: env.TMDB_API_KEY };
}

export function tmdbConfigured(): boolean {
  const { token, apiKey } = tmdbEnv();
  return Boolean(token || apiKey);
}

export async function tmdbGet(path: string, params: Record<string, string> = {}): Promise<Response> {
  const { token, apiKey } = tmdbEnv();
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  if (!token && apiKey) url.searchParams.set("api_key", apiKey);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url.toString(), { headers });
}
