/**
 * Server-only Spotify helpers for the MusicBar's now-playing metadata.
 *
 * Spotify's Client-Credentials token can no longer read playlist tracks (the
 * `tracks` field is stripped and `/tracks` 403s as of late 2024). So instead we
 * read the track list the **embed page bootstraps** for its own iframe — this
 * gives title / artist / duration for the tracks the embed preloads, with no
 * visitor login. Album art isn't in that payload, so we hydrate it via the
 * `/v1/tracks` endpoint (which still works with an app token) when
 * SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET are set.
 *
 * This relies on the embed's undocumented JSON and only covers the bootstrapped
 * tracks — unmatched songs fall back to the widget's placeholder label.
 */

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

export interface PlaylistTrack {
  name: string;
  artist: string;
  durationMs: number;
  image: string | null;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

// Token cached in-process for the life of a warm server instance.
let cachedToken: { token: string; expires: number } | null = null;

async function getToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (cachedToken && cachedToken.expires > Date.now() + 5_000) {
    return cachedToken.token;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as TokenResponse;
  cachedToken = {
    token: data.access_token,
    expires: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

// --- embed bootstrap parsing ---------------------------------------------

interface EmbedTrack {
  uri: string;
  title: string;
  subtitle: string;
  duration: number;
}

function isEmbedTrack(x: unknown): x is EmbedTrack {
  if (x === null || typeof x !== "object") return false;
  const t = x as Record<string, unknown>;
  return (
    typeof t.uri === "string" &&
    typeof t.title === "string" &&
    typeof t.duration === "number"
  );
}

/** Recursively locate the first `trackList` array in the embed's JSON. */
function findTrackList(node: unknown): unknown[] | null {
  if (node === null || typeof node !== "object") return null;
  const rec = node as Record<string, unknown>;
  if (Array.isArray(rec.trackList)) return rec.trackList;
  for (const key of Object.keys(rec)) {
    const found = findTrackList(rec[key]);
    if (found) return found;
  }
  return null;
}

/**
 * Fetch album art per track ID. Spotify blocks the batch `/tracks?ids=`
 * endpoint (403) for app tokens, but the single `/tracks/{id}` endpoint works,
 * so we request each individually (in parallel; the embed only yields ~9).
 */
async function fetchArt(
  ids: string[],
  token: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(`${API}/tracks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      });
      if (!res.ok) return;
      const t = (await res.json()) as {
        album?: { images?: { url: string }[] };
      };
      const url = t.album?.images?.[0]?.url;
      if (url) map.set(id, url);
    }),
  );
  return map;
}

/**
 * Title / artist / duration (+ art when creds are set) for the tracks the
 * playlist embed bootstraps. Returns [] on any failure → placeholder fallback.
 */
export async function fetchPlaylistTracks(
  playlistId: string,
): Promise<PlaylistTrack[]> {
  if (!playlistId) return [];

  let rawList: unknown[] | null = null;
  try {
    const res = await fetch(
      `https://open.spotify.com/embed/playlist/${playlistId}`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; virasat/1.0)" },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return [];
    const html = await res.text();
    const match = html.match(
      /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
    );
    if (!match) return [];
    rawList = findTrackList(JSON.parse(match[1]));
  } catch {
    return [];
  }
  if (!rawList) return [];

  const embeds = rawList.filter(isEmbedTrack);
  const tracks: PlaylistTrack[] = embeds.map((t) => ({
    name: t.title,
    artist: t.subtitle,
    durationMs: t.duration,
    image: null,
  }));

  // Best-effort album art (needs app credentials).
  const token = await getToken();
  if (token) {
    const ids = embeds.map((t) => t.uri.split(":")[2]).filter(Boolean);
    const art = await fetchArt(ids, token);
    embeds.forEach((t, i) => {
      const url = art.get(t.uri.split(":")[2]);
      if (url) tracks[i].image = url;
    });
  }

  return tracks;
}
