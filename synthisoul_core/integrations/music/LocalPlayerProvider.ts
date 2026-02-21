// synthisoul_core/integrations/music/LocalPlayerProvider.ts
/**
 * Local Player Provider
 * 
 * Minimal in-app music player for development and testing.
 * Makes the music system testable end-to-end without external apps.
 * 
 * This ensures the "music actuator" is never dead in development.
 */

import type { AbstractMusicProvider, Track, Playlist, ProviderCapabilities, MusicActionResult } from "./AbstractMusicProvider";
import { LocalPlayerBridge } from "../../music/LocalPlayerBridge";

export class LocalPlayerProvider implements AbstractMusicProvider {
  readonly providerId = "local";
  private player: LocalPlayerBridge;
  private currentTrack: Track | null = null;
  private isPlaying = false;

  constructor() {
    this.player = new LocalPlayerBridge();
  }

  async isAvailable(): Promise<boolean> {
    // Local player is always available (in-memory)
    return true;
  }

  /**
   * Get explicit capabilities of this provider
   */
  getCapabilities(): ProviderCapabilities {
    return {
      canPause: true,
      canPlay: true,
      canSkip: false, // Local player doesn't have queue
      canPrevious: false,
      canGetNowPlaying: true,
      canCreatePlaylist: false, // Would need to implement playlist storage
      canGetLikedTracks: false,
      canSearchTracks: false,
      canPlayTrack: true,
      canDeepLink: false,
    };
  }

  async play(): Promise<MusicActionResult> {
    if (!this.currentTrack) {
      return { status: "OK_NOOP_METHOD_UNSUPPORTED", method: "play" }; // No track to play
    }
    this.isPlaying = true;
    this.player.play(this.convertToTrackInfo(this.currentTrack));
    return { status: "OK_EXECUTED" };
  }

  async pause(): Promise<MusicActionResult> {
    if (!this.isPlaying) {
      return { status: "OK_NOOP_METHOD_UNSUPPORTED", method: "pause" }; // Not playing
    }
    this.isPlaying = false;
    // LocalPlayerBridge doesn't have pause, but we track state
    return { status: "OK_EXECUTED" };
  }

  async skip(): Promise<MusicActionResult> {
    // Local player doesn't support skip (no queue)
    return { status: "OK_NOOP_METHOD_UNSUPPORTED", method: "skip" };
  }

  async previous(): Promise<MusicActionResult> {
    // Local player doesn't support previous (no queue)
    return { status: "OK_NOOP_METHOD_UNSUPPORTED", method: "previous" };
  }

  async getNowPlaying(): Promise<Track | null> {
    return this.currentTrack;
  }

  async playTrack(track: Track): Promise<MusicActionResult> {
    this.currentTrack = track;
    this.isPlaying = true;
    this.player.play(this.convertToTrackInfo(track));
    return { status: "OK_EXECUTED" };
  }

  async getLikedTracks?(): Promise<Track[]> {
    return []; // Local player doesn't have liked tracks
  }

  async createPlaylist?(): Promise<null> {
    return null; // Local player doesn't support playlist creation
  }

  async searchTracks?(): Promise<Track[]> {
    return []; // Local player doesn't support search
  }

  /**
   * Convert Track to TrackInfo for LocalPlayerBridge
   */
  private convertToTrackInfo(track: Track): any {
    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      durationMs: track.durationMs,
      source: track.source,
    };
  }
}

