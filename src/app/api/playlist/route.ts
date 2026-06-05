/**
 * Returns the configured playlist's tracklist (title / artist / artwork /
 * duration) for the MusicBar's duration-matching. Cached for an hour. Returns
 * an empty list when Spotify credentials aren't configured — the widget then
 * falls back to its placeholder label.
 */

import { NextResponse } from "next/server";
import { fetchPlaylistTracks } from "@/lib/spotify";
import { config } from "@/config";

export const revalidate = 3600;

export async function GET() {
  const playlistId = config.spotifyPlaylistUri.split(":")[2] ?? "";
  const tracks = await fetchPlaylistTracks(playlistId);
  return NextResponse.json({ tracks });
}
