/**
 * Ambient music playback state (brief §8). The Spotify embed controller itself
 * lives in the MusicBar component (a mutable ref); this store holds only the
 * UI-facing playback state plus an imperative controls handle, so the bar and
 * any future music controls stay in sync without prop-drilling.
 */

import { create } from "zustand";

export interface MusicControls {
  /** Toggle play/pause; marks the session as started on first play. */
  toggle: () => void;
  /** Seek to a fraction (0–1) of the track. */
  seekRatio: (ratio: number) => void;
  /** Load + play the next track in the playlist snapshot. */
  next: () => void;
  /** Load + play the previous track in the playlist snapshot. */
  prev: () => void;
}

interface PlaybackPatch {
  isPaused?: boolean;
  position?: number;
  duration?: number;
}

/** Resolved metadata for the currently-playing track (via duration match). */
export interface TrackInfo {
  name: string;
  artist: string;
  image: string | null;
}

interface MusicState {
  /** Embed controller has loaded and is ready to accept commands. */
  ready: boolean;
  isPaused: boolean;
  /** Position + duration in milliseconds (as reported by playback_update). */
  position: number;
  duration: number;
  /** Whether the user has started playback at least once this session. */
  started: boolean;
  /** Metadata for the current track, or null when unmatched/unavailable. */
  track: TrackInfo | null;
  controls: MusicControls | null;
  setReady: (ready: boolean) => void;
  setPlayback: (patch: PlaybackPatch) => void;
  setStarted: (started: boolean) => void;
  setTrack: (track: TrackInfo | null) => void;
  registerControls: (controls: MusicControls | null) => void;
}

export const useMusicStore = create<MusicState>((set) => ({
  ready: false,
  isPaused: true,
  position: 0,
  duration: 0,
  started: false,
  track: null,
  controls: null,
  setReady: (ready) => set({ ready }),
  setPlayback: (patch) => set(patch),
  setStarted: (started) => set({ started }),
  setTrack: (track) => set({ track }),
  registerControls: (controls) => set({ controls }),
}));
