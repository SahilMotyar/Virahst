"use client";

/**
 * Ambient now-playing widget (brief §8). Loads the Spotify IFrame API, creates a
 * controller for the configured playlist in a 1px-hidden iframe, and drives a
 * custom bottom-left widget from its `playback_update` events.
 *
 * Track metadata (title / artist / artwork) comes from a static snapshot
 * (src/data/playlistTracks.ts); the playing song is identified by matching its
 * duration. Prev/next genuinely change track via the controller's loadUri using
 * the snapshot's URIs. Autoplay is attempted on load (browsers usually block it
 * until a user gesture — then the user presses play); the choice is remembered
 * in localStorage. All UI state lives in the music store.
 */

import { useEffect, useRef } from "react";
import { config } from "@/config";
import { useMusicStore } from "@/store/musicStore";
import { playlistTracks } from "@/data/playlistTracks";

/** Index of the playlist track whose duration matches, or -1. */
function matchIndex(durationMs: number): number {
  for (let i = 0; i < playlistTracks.length; i++) {
    // Tolerance: the embed's reported duration can differ by a few ms.
    if (Math.abs(playlistTracks[i].durationMs - durationMs) <= 1500) return i;
  }
  return -1;
}

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
  loadUri(uri: string): void;
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
  const currentIndexRef = useRef(0);
  // The disc rotates via rAF (not CSS) so it can't be killed by a global
  // prefers-reduced-motion rule and doesn't depend on a keyframe.
  const discRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);

  const { ready, isPaused, position, duration } = useMusicStore();
  const controls = useMusicStore((s) => s.controls);
  const track = useMusicStore((s) => s.track);
  const setReady = useMusicStore((s) => s.setReady);
  const setPlayback = useMusicStore((s) => s.setPlayback);
  const setStarted = useMusicStore((s) => s.setStarted);
  const setTrack = useMusicStore((s) => s.setTrack);
  const registerControls = useMusicStore((s) => s.registerControls);

  useEffect(() => {
    if (!config.flags.MUSIC_ENABLED) return;
    const el = containerRef.current;
    if (!el || controllerRef.current) return;

    const onApiReady = (IFrameAPI: SpotifyIFrameAPI) => {
      IFrameAPI.createController(
        el,
        { uri: config.spotifyPlaylistUri, width: "1", height: "1" },
        (controller) => {
          controllerRef.current = controller;

          controller.addListener("ready", () => {
            setReady(true);
            // Attempt autoplay on arrival (usually blocked until a gesture).
            try {
              controller.play();
            } catch {
              /* autoplay blocked; bar stays paused */
            }
          });

          controller.addListener("playback_update", (e) => {
            setPlayback({
              isPaused: e.data.isPaused,
              position: e.data.position,
              duration: e.data.duration,
            });
            // Identify the current track by matching its duration.
            const idx = matchIndex(e.data.duration);
            if (idx >= 0) currentIndexRef.current = idx;
            const t = idx >= 0 ? playlistTracks[idx] : null;
            const cur = useMusicStore.getState().track;
            if ((t?.name ?? null) !== (cur?.name ?? null)) {
              setTrack(t ? { name: t.name, artist: t.artist, image: t.image } : null);
            }
          });

          const markStarted = () => {
            if (!useMusicStore.getState().started) setStarted(true);
            window.localStorage.setItem(STORAGE_KEY, "1");
          };

          // Load + play a specific track (wrapping the playlist by index).
          const loadIndex = (idx: number) => {
            const len = playlistTracks.length;
            const i = ((idx % len) + len) % len;
            const t = playlistTracks[i];
            currentIndexRef.current = i;
            controller.loadUri(t.uri);
            // Give the embed a moment to swap tracks, then play.
            window.setTimeout(() => {
              try {
                controller.play();
              } catch {
                /* ignore */
              }
            }, 400);
            setTrack({ name: t.name, artist: t.artist, image: t.image });
            markStarted();
          };

          registerControls({
            toggle: () => {
              controller.togglePlay();
              markStarted();
            },
            seekRatio: (r) => {
              const dur = useMusicStore.getState().duration;
              if (dur > 0) controller.seek((r * dur) / 1000);
            },
            next: () => loadIndex(currentIndexRef.current + 1),
            prev: () => loadIndex(currentIndexRef.current - 1),
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

  const ratio = duration > 0 ? Math.min(1, position / duration) : 0;
  const playing = ready && !isPaused;
  const disabled = !ready || !controls;

  // Spin the album disc while playing (≈8s per rotation), continuing from the
  // current angle so play/pause doesn't snap.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      angleRef.current = (angleRef.current + (dt / 8000) * 360) % 360;
      if (discRef.current) {
        discRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  if (!config.flags.MUSIC_ENABLED) return null;

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const r = (e.clientX - rect.left) / rect.width;
    controls?.seekRatio(Math.max(0, Math.min(1, r)));
  };

  return (
    <>
      {/* Hidden embed host (1px). aria-hidden + offscreen. */}
      <div
        ref={containerRef}
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 h-px w-px overflow-hidden opacity-0"
      />

      <div className="fixed bottom-5 left-5 z-40 w-84 max-w-[calc(100vw-2.5rem)]">
        <div className="relative flex items-center rounded-[22px] border border-black/5 bg-bg/95 py-3 pl-30 pr-4 shadow-[0_1px_2px_rgba(0,0,0,.05),0_14px_36px_rgba(0,0,0,.14)] backdrop-blur">
          {/* Album disc. Outer scales up slightly when playing; inner spins (rAF). */}
          <div
            className="absolute -top-4 left-4 h-24 w-24"
            style={{
              transform: playing ? "scale(1.06)" : "scale(1)",
              transition: "transform 0.3s ease",
            }}
          >
            <div
              ref={discRef}
              className="h-full w-full overflow-hidden rounded-full shadow-[0_10px_24px_rgba(0,0,0,.28)] will-change-transform"
            >
              {track?.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN art; next/image config not needed for an 80px thumb.
                <img
                  src={track.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-accent to-indigo font-display text-3xl text-bg">
                  ♪
                </div>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {/* Label + open-in-Spotify */}
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm leading-tight text-ink">
                  {track?.name ?? config.musicLabel}
                </p>
                <p className="truncate text-[11px] leading-tight text-ink-2">
                  {track?.artist ?? "Spotify playlist"}
                </p>
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

            {/* Controls row: prev · play/pause · next · progress */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous track"
                disabled={disabled}
                onClick={() => controls?.prev()}
                className="shrink-0 text-ink-2 transition-colors hover:text-ink disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M7 6a1 1 0 0 0-2 0v12a1 1 0 0 0 2 0V6Z" />
                  <path d="M20 5.5v13a1 1 0 0 1-1.5.87l-9-6.5a1 1 0 0 1 0-1.74l9-6.5A1 1 0 0 1 20 5.5Z" />
                </svg>
              </button>

              <button
                type="button"
                aria-label={playing ? "Pause" : "Play ambient music"}
                disabled={disabled}
                onClick={() => controls?.toggle()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {playing ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                aria-label="Next track"
                disabled={disabled}
                onClick={() => controls?.next()}
                className="shrink-0 text-ink-2 transition-colors hover:text-ink disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17 6a1 1 0 0 1 2 0v12a1 1 0 0 1-2 0V6Z" />
                  <path d="M4 5.5v13a1 1 0 0 0 1.5.87l9-6.5a1 1 0 0 0 0-1.74l-9-6.5A1 1 0 0 0 4 5.5Z" />
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
