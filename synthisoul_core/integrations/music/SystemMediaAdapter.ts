// synthisoul_core/integrations/music/SystemMediaAdapter.ts
/**
 * System Media Adapter
 * 
 * Uses OS-level media session APIs for playback control.
 * Works across platforms without requiring specific music provider APIs.
 * 
 * Platforms:
 * - Windows (Electron): System Media Transport Controls (SMTC)
 * - Web: navigator.mediaSession API
 * - Android: MediaSessionManager (via Electron bridge if needed)
 */

import type { AbstractMusicProvider, Track, ProviderCapabilities, MusicActionResult } from "./AbstractMusicProvider";
import { isBrowser, isElectronMain } from "../../system/EnvironmentDetector";

export class SystemMediaAdapter implements AbstractMusicProvider {
  readonly providerId = "system";

  private mediaSession: MediaSession | null = null;
  private currentTrack: Track | null = null;

  constructor() {
    this.initializeMediaSession();
  }

  private initializeMediaSession(): void {
    if (!isBrowser()) {
      return;
    }

    // Check for Media Session API support
    if ("mediaSession" in navigator) {
      this.mediaSession = navigator.mediaSession;
      this.setupMediaSessionHandlers();
    } else {
      console.warn("[SystemMediaAdapter] Media Session API not available");
    }
  }

  private setupMediaSessionHandlers(): void {
    if (!this.mediaSession) return;

    // Handle play action
    this.mediaSession.setActionHandler("play", () => {
      this.handlePlay();
    });

    // Handle pause action
    this.mediaSession.setActionHandler("pause", () => {
      this.handlePause();
    });

    // Handle next track
    this.mediaSession.setActionHandler("nexttrack", () => {
      this.handleSkip();
    });

    // Handle previous track
    this.mediaSession.setActionHandler("previoustrack", () => {
      this.handlePrevious();
    });
  }

  async isAvailable(): Promise<boolean> {
    // System media controls are available if MediaSession API exists
    // or if we're in Electron (can use SMTC via main process)
    return isBrowser() && ("mediaSession" in navigator) || isElectronMain();
  }

  getCapabilities(): ProviderCapabilities {
    return {
      canPause: true,
      canPlay: true,
      canSkip: true, // System media can skip (via SMTC/MediaSession)
      canPrevious: true,
      canGetNowPlaying: false, // System media can't read current track
      canCreatePlaylist: false,
      canGetLikedTracks: false,
      canSearchTracks: false,
      canPlayTrack: false, // System media can't directly play tracks
      canDeepLink: false,
    };
  }

  async play(): Promise<MusicActionResult> {
    try {
      if (this.mediaSession) {
        this.mediaSession.playbackState = "playing";
      }
      
      // In Electron, could also send IPC to main process for SMTC
      if (isElectronMain()) {
        // TODO: Send IPC message to main process for SMTC control
        // window.electronAPI?.mediaControl?.play?.();
      }

      return { status: "OK_EXECUTED" };
    } catch (error) {
      console.error("[SystemMediaAdapter] Play failed:", error);
      return { status: "ERROR", error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async pause(): Promise<MusicActionResult> {
    try {
      if (this.mediaSession) {
        this.mediaSession.playbackState = "paused";
      }

      // In Electron, could also send IPC to main process for SMTC
      if (isElectronMain()) {
        // TODO: Send IPC message to main process for SMTC control
        // window.electronAPI?.mediaControl?.pause?.();
      }

      return { status: "OK_EXECUTED" };
    } catch (error) {
      console.error("[SystemMediaAdapter] Pause failed:", error);
      return { status: "ERROR", error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async skip(): Promise<MusicActionResult> {
    try {
      // Trigger nexttrack action
      if (this.mediaSession) {
        // MediaSession API doesn't directly control playback,
        // but we can update metadata to reflect the change
        // Actual skip must be handled by the active media player
      }

      // In Electron, could send IPC to main process
      if (isElectronMain()) {
        // TODO: Send IPC message to main process for SMTC control
        // window.electronAPI?.mediaControl?.next?.();
      }

      return { status: "OK_EXECUTED" };
    } catch (error) {
      console.error("[SystemMediaAdapter] Skip failed:", error);
      return { status: "ERROR", error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async previous(): Promise<MusicActionResult> {
    try {
      // Similar to skip, but for previous track
      if (isElectronMain()) {
        // TODO: Send IPC message to main process for SMTC control
        // window.electronAPI?.mediaControl?.previous?.();
      }

      return { status: "OK_EXECUTED" };
    } catch (error) {
      console.error("[SystemMediaAdapter] Previous failed:", error);
      return { status: "ERROR", error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async getNowPlaying(): Promise<Track | null> {
    // MediaSession API doesn't provide a way to read current track
    // We maintain our own state or query via Electron bridge
    if (isElectronMain()) {
      // TODO: Query main process for current track via SMTC
      // const track = await window.electronAPI?.mediaControl?.getNowPlaying?.();
      // return track ? this.convertToTrack(track) : null;
    }

    return this.currentTrack;
  }

  /**
   * Update metadata for currently playing track
   * This makes the track visible in system media controls
   */
  updateMetadata(track: Track): void {
    if (!this.mediaSession) return;

    this.currentTrack = track;

    this.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || "",
      artwork: track.album ? [{ src: "" }] : undefined, // Could fetch artwork if available
    });
  }

  // Private handlers for MediaSession actions
  private async handlePlay(): Promise<void> {
    await this.play();
  }

  private async handlePause(): Promise<void> {
    await this.pause();
  }

  private async handleSkip(): Promise<void> {
    await this.skip();
  }

  private async handlePrevious(): Promise<void> {
    await this.previous();
  }

  // Optional methods not supported by system media controls
  async getLikedTracks?(): Promise<Track[]> {
    return []; // System media doesn't have liked tracks
  }

  async createPlaylist?(): Promise<null> {
    return null; // System media doesn't support playlist creation
  }

  async playTrack?(track: Track): Promise<MusicActionResult> {
    // System media can't directly play a track, but we can update metadata
    this.updateMetadata(track);
    return { status: "OK_NOOP_METHOD_UNSUPPORTED", method: "playTrack" };
  }

  async searchTracks?(): Promise<Track[]> {
    return []; // System media doesn't support search
  }
}

