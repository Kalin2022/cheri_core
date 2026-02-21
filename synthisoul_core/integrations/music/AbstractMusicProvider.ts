// synthisoul_core/integrations/music/AbstractMusicProvider.ts
/**
 * Abstract Music Provider Interface
 * 
 * Provider-agnostic interface for music operations.
 * All methods are optional to support graceful fallback.
 * This protects the system from provider dependencies.
 */

import type { TrackInfo } from "../../music/MusicEventTypes";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  durationMs?: number;
  source: string; // Provider identifier (e.g., "spotify", "system", "local")
  uri?: string; // Provider-specific URI if available
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  source: string;
}

export interface ProviderCapabilities {
  canPause: boolean;
  canPlay: boolean;
  canSkip: boolean;
  canPrevious: boolean;
  canGetNowPlaying: boolean;
  canCreatePlaylist: boolean;
  canGetLikedTracks: boolean;
  canSearchTracks: boolean;
  canPlayTrack: boolean;
  canDeepLink: boolean;
}

export type MusicActionResult = 
  | { status: "OK_EXECUTED" }
  | { status: "OK_NOOP_NO_PROVIDER" }
  | { status: "OK_NOOP_METHOD_UNSUPPORTED"; method: string }
  | { status: "ERROR"; error: string };

export interface AbstractMusicProvider {
  /**
   * Provider identifier (e.g., "spotify", "system", "local")
   */
  readonly providerId: string;

  /**
   * Check if provider is available/connected
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get explicit capabilities of this provider
   * If not implemented, capabilities will be inferred from method presence
   */
  getCapabilities?(): ProviderCapabilities;

  /**
   * Get user's liked/saved tracks (if supported)
   * Returns empty array if not supported
   */
  getLikedTracks?(): Promise<Track[]>;

  /**
   * Create a playlist (if supported)
   * Returns null if not supported
   */
  createPlaylist?(name: string, tracks: Track[]): Promise<Playlist | null>;

  /**
   * Play music (if supported)
   * Returns result object to distinguish execution outcomes
   */
  play?(): Promise<MusicActionResult>;

  /**
   * Pause music (if supported)
   * Returns result object to distinguish execution outcomes
   */
  pause?(): Promise<MusicActionResult>;

  /**
   * Skip to next track (if supported)
   * Returns result object to distinguish execution outcomes
   */
  skip?(): Promise<MusicActionResult>;

  /**
   * Skip to previous track (if supported)
   * Returns result object to distinguish execution outcomes
   */
  previous?(): Promise<MusicActionResult>;

  /**
   * Get currently playing track (if supported)
   */
  getNowPlaying?(): Promise<Track | null>;

  /**
   * Play a specific track (if supported)
   * Returns result object to distinguish execution outcomes
   */
  playTrack?(track: Track): Promise<MusicActionResult>;

  /**
   * Search for tracks (if supported)
   */
  searchTracks?(query: string): Promise<Track[]>;
}

