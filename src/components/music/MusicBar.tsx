"use client";

/**
 * Ambient now-playing bar (brief §8). Loads the Spotify IFrame API, creates a
 * controller for the configured playlist in a 1px-hidden iframe, and drives a
 * custom bar from its `playback_update` events. Starts paused (browsers block
 * autoplay), remembers the user's start choice in localStorage, and keeps all
 * state in the music store.
 *
 * Note: the IFrame API does not expose track title/artist, so the bar shows a
 * fixed ambient label. Richer "what's playing" needs the Web Playback SDK +
 * OAuth — the documented upgrade path, intentionally not built here.
 */

import { useEffect, useRef } from "react";
import { config } from "@/config";
import { useMusicStore, type TrackInfo } from "@/store/musicStore";
import type { PlaylistTrack } from "@/lib/spotify";

// --- Minimal typings for the Spotify IFrame API --------------------------
interface PlaybackData {
  isPaused: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
}
interface SpotifyEmbedController {
  addListener(event: "ready", cb: () => void): void;
  addListener(event: "playback_update", cb: (e: { data: PlaybackData }) => void): void;
  play(): void;
  pause(): void;
  resume(): void;
  togglePlay(): void;
  seek(seconds: number): void;
  destroy(): void;
}
interface SpotifyIFrameAPI {
  createController(
    el: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    cb: (controller: SpotifyEmbedController) => void,
  ): void;
}
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}

const IFRAME_API_SRC = "https://open.spotify.com/embed/iframe-api/v1";
const STORAGE_KEY = "virasat:music:autostart";

/** spotify:playlist:ID → https://open.spotify.com/playlist/ID */
function openUrl(uri: string): string {
  const [, type, id] = uri.split(":");
  return type && id
    ? `https://open.spotify.com/${type}/${id}`
    : "https://open.spotify.com";
}

export function MusicBar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);

  const { ready, isPaused, position, duration, started } = useMusicStore();
  const controls = useMusicStore((s) => s.controls);
  const track = useMusicStore((s) => s.track);
  const setReady = useMusicStore((s) => s.setReady);
  const setPlayback = useMusicStore((s) => s.setPlayback);
  const setStarted = useMusicStore((s) => s.setStarted);
  const setTrack = useMusicStore((s) => s.setTrack);
  const registerControls = useMusicStore((s) => s.registerControls);

  // duration_ms → track metadata, used to identify the currently-playing song.
  const trackMapRef = useRef<Map<number, TrackInfo>>(new Map());

  // Pre-fetch the playlist's tracks once (empty if Spotify creds aren't set).
  useEffect(() => {
    if (!config.flags.MUSIC_ENABLED) return;
    let cancelled = false;
    fetch("/api/playlist")
      .then((r) => (r.ok ? r.json() : { tracks: [] }))
      .then((data: { tracks: PlaylistTrack[] }) => {
        if (cancelled) return;
        const map = new Map<number, TrackInfo>();
        for (const t of data.tracks ?? []) {
          map.set(t.durationMs, {
            name: t.name,
            artist: t.artist,
            image: t.image,
          });
        }
        trackMapRef.current = map;
      })
      .catch(() => {
        /* no metadata available; widget keeps its placeholder label */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!config.flags.MUSIC_ENABLED) return;
    const el = containerRef.current;
    if (!el || controllerRef.current) return;

    const wantsAutostart =
      typeof window !== "undefined" &&
      window.localStorage.getItem(STORAGE_KEY) === "1";

    const onApiReady = (IFrameAPI: SpotifyIFrameAPI) => {
      IFrameAPI.createController(
        el,
        { uri: config.spotifyPlaylistUri, width: "1", height: "1" },
        (controller) => {
          controllerRef.current = controller;

          controller.addListener("ready", () => {
            setReady(true);
            // Best-effort resume if the user opted in previously (may be
            // blocked by the browser until a user gesture — that's fine).
            if (wantsAutostart) {
              try {
                controller.resume();
              } catch {
                /* autoplay blocked; bar stays paused */
              }
            }
          });

          controller.addListener("playback_update", (e) => {
            setPlayback({
              isPaused: e.data.isPaused,
              position: e.data.position,
              duration: e.data.duration,
            });

            // Identify the current track by matching its duration.
            const map = trackMapRef.current;
            if (map.size > 0) {
              let info = map.get(e.data.duration) ?? null;
              if (!info) {
                // Tolerance scan — embed duration can differ by a few ms.
                for (const [dur, t] of map) {
                  if (Math.abs(dur - e.data.duration) <= 1500) {
                    info = t;
                    break;
                  }
                }
              }
              const cur = useMusicStore.getState().track;
              if ((info?.name ?? null) !== (cur?.name ?? null)) setTrack(info);
            }
          });

          registerControls({
            toggle: () => {
              controller.togglePlay();
              if (!useMusicStore.getState().started) {
                setStarted(true);
                window.localStorage.setItem(STORAGE_KEY, "1");
              }
            },
            seekRatio: (ratio) => {
              const dur = useMusicStore.getState().duration;
              if (dur > 0) controller.seek((ratio * dur) / 1000);
            },
          });
        },
      );
    };

    // The API calls this global when the script finishes loading.
    window.onSpotifyIframeApiReady = onApiReady;

    if (!document.querySelector(`script[src="${IFRAME_API_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = IFRAME_API_SRC;
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      registerControls(null);
    };
  }, [setReady, setPlayback, setStarted, setTrack, registerControls]);

  if (!config.flags.MUSIC_ENABLED) return null;

  const ratio = duration > 0 ? Math.min(1, position / duration) : 0;
  const playing = started && !isPaused;
  const disabled = !ready || !controls;

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const r = (e.clientX - rect.left) / rect.width;
    controls?.seekRatio(Math.max(0, Math.min(1, r)));
  };

  // The IFrame API can't change track, so "skip" nudges ±15s via seek.
  const seekBy = (deltaSeconds: number) => {
    const { position: p, duration: d, controls: c } = useMusicStore.getState();
    if (d > 0) c?.seekRatio(Math.max(0, Math.min(1, (p + deltaSeconds * 1000) / d)));
  };

  return (
    <>
      {/* Hidden embed host (1px). aria-hidden + offscreen. */}
      <div
        ref={containerRef}
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 h-px w-px overflow-hidden opacity-0"
      />

      <div className="fixed bottom-5 left-5 z-40 w-74 max-w-[calc(100vw-2.5rem)]">
        <div className="relative flex items-center rounded-[20px] border border-black/5 bg-bg/95 py-2.5 pl-17.5 pr-3 shadow-[0_1px_2px_rgba(0,0,0,.05),0_14px_36px_rgba(0,0,0,.14)] backdrop-blur">
          {/* Tilted album artwork — real cover when matched, else gradient. */}
          <div
            className="absolute -top-3.5 left-2.5 h-15 w-15 overflow-hidden rounded-[15px] shadow-[0_10px_24px_rgba(0,0,0,.28)] transition-transform duration-300"
            style={{ transform: playing ? "rotate(0deg)" : "rotate(-8deg)" }}
          >
            {track?.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN art; next/image config not needed for a 60px thumb.
              <img
                src={track.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-accent to-indigo font-display text-2xl text-bg">
                ♪
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {/* Label + open-in-Spotify */}
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm leading-tight text-ink">
                  {track?.name ?? config.musicLabel}
                </p>
                {track?.artist && (
                  <p className="truncate text-[11px] leading-tight text-ink-2">
                    {track.artist}
                  </p>
                )}
              </div>
              <a
                href={openUrl(config.spotifyPlaylistUri)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open playlist in Spotify"
                className="shrink-0 text-ink-2 transition-colors hover:text-ink"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </a>
            </div>

            {/* Controls row: ⏮  ▶/❚❚  ⏭  + progress */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Back 15 seconds"
                disabled={disabled}
                onClick={() => seekBy(-15)}
                className="shrink-0 text-ink-2 transition-colors hover:text-ink disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18 5.5v13a1 1 0 0 1-1.5.87L7 13.74V18a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v4.26l9.5-5.63A1 1 0 0 1 18 5.5Z" />
                </svg>
              </button>

              <button
                type="button"
                aria-label={playing ? "Pause" : "Play ambient music"}
                disabled={disabled}
                onClick={() => controls?.toggle()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {playing ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                aria-label="Forward 15 seconds"
                disabled={disabled}
                onClick={() => seekBy(15)}
                className="shrink-0 text-ink-2 transition-colors hover:text-ink disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M6 5.5v13a1 1 0 0 0 1.5.87L17 13.74V18a1 1 0 0 0 2 0V6a1 1 0 0 0-2 0v4.26L7.5 4.63A1 1 0 0 0 6 5.5Z" />
                </svg>
              </button>

              <div
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(ratio * 100)}
                tabIndex={0}
                onClick={onSeek}
                className="relative ml-1 h-1.5 flex-1 cursor-pointer rounded-full bg-black/10"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-accent"
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
