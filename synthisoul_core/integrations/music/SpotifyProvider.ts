// synthisoul_core/integrations/music/SpotifyProvider.ts
/**
 * Spotify Provider Adapter
 * 
 * Implements AbstractMusicProvider for Spotify.
 * This makes Spotify an implementation detail, not the system spine.
 */

import type { AbstractMusicProvider, Track, Playlist, ProviderCapabilities, MusicActionResult } from "./AbstractMusicProvider";
import { SpotifyClient } from "../../music/SpotifyClient";

export class SpotifyProvider implements AbstractMusicProvider {
  readonly providerId = "spotify";
  private client: SpotifyClient | null = null;

  constructor(accessToken?: string) {
    if (accessToken) {
      this.client = new SpotifyClient(accessToken);
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.client !== null;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      canPause: true,
      canPlay: false, // Spotify needs playTrack or playContext
      canSkip: true,
      canPrevious: true,
      canGetNowPlaying: true,
      canCreatePlaylist: true,
      canGetLikedTracks: true,
      canSearchTracks: true,
      canPlayTrack: true,
      canDeepLink: true, // Spotify supports deep links
    };
  }

  async getLikedTracks(): Promise<Track[]> {
    if (!this.client) {
      return [];
    }

    try {
      // TODO: Implement actual Spotify API call for liked tracks
      // const response = await fetch("https://api.spotify.com/v1/me/tracks", {
      //   headers: { Authorization: `Bearer ${this.accessToken}` }
      // });
      // const data = await response.json();
      // return data.items.map(item => this.convertToTrack(item.track));

      // For now, return empty array
      return [];
    } catch (error) {
      console.error("[SpotifyProvider] Error fetching liked tracks:", error);
      return [];
    }
  }

  async createPlaylist(name: string, tracks: Track[]): Promise<Playlist | null> {
    if (!this.client) {
      return null;
    }

    try {
      // TODO: Implement actual Spotify API call for playlist creation
      // const response = await fetch("https://api.spotify.com/v1/me/playlists", {
      //   method: "POST",
      //   headers: {
      //     Authorization: `Bearer ${this.accessToken}`,
      //     "Content-Type": "application/json"
      //   },
      //   body: JSON.stringify({ name, public: false })
      // });
      // const playlist = await response.json();
      // Then add tracks to playlist...

      // For now, return null (not implemented)
      return null;
    } catch (error) {
      console.error("[SpotifyProvider] Error creating playlist:", error);
      return null;
    }
  }

  async play(): Promise<MusicActionResult> {
    // Spotify doesn't have a generic "play" - need to use playTrack or playContext
    return { status: "OK_NOOP_METHOD_UNSUPPORTED", method: "play" };
  }

  async pause(): Promise<MusicActionResult> {
    if (!this.client) {
      return { status: "OK_NOOP_NO_PROVIDER" };
    }

    try {
      // TODO: Implement Spotify pause API call
      // await fetch("https://api.spotify.com/v1/me/player/pause", {
      //   method: "PUT",
      //   headers: { Authorization: `Bearer ${this.accessToken}` }
      // });
      return { status: "OK_EXECUTED" };
    } catch (error) {
      console.error("[SpotifyProvider] Error pausing:", error);
      return { status: "ERROR", error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async skip(): Promise<MusicActionResult> {
    if (!this.client) {
      return { status: "OK_NOOP_NO_PROVIDER" };
    }

    try {
      // TODO: Implement Spotify skip API call
      // await fetch("https://api.spotify.com/v1/me/player/next", {
      //   method: "POST",
      //   headers: { Authorization: `Bearer ${this.accessToken}` }
      // });
      return { status: "OK_EXECUTED" };
    } catch (error) {
      console.error("[SpotifyProvider] Error skipping:", error);
      return { status: "ERROR", error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async previous(): Promise<MusicActionResult> {
    if (!this.client) {
      return { status: "OK_NOOP_NO_PROVIDER" };
    }

    try {
      // TODO: Implement Spotify previous API call
      // await fetch("https://api.spotify.com/v1/me/player/previous", {
      //   method: "POST",
      //   headers: { Authorization: `Bearer ${this.accessToken}` }
      // });
      return { status: "OK_EXECUTED" };
    } catch (error) {
      console.error("[SpotifyProvider] Error going to previous:", error);
      return { status: "ERROR", error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async getNowPlaying(): Promise<Track | null> {
    if (!this.client) {
      return null;
    }

    try {
      const trackInfo = await this.client.getCurrentTrack();
      if (!trackInfo) {
        return null;
      }

      return this.convertToTrack(trackInfo);
    } catch (error) {
      console.error("[SpotifyProvider] Error getting now playing:", error);
      return null;
    }
  }

  async playTrack(track: Track): Promise<MusicActionResult> {
    if (!this.client) {
      return { status: "OK_NOOP_NO_PROVIDER" };
    }

    try {
      await this.client.playTrack(track.id);
      return { status: "OK_EXECUTED" };
    } catch (error) {
      console.error("[SpotifyProvider] Error playing track:", error);
      return { status: "ERROR", error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    if (!this.client) {
      return [];
    }

    try {
      // TODO: Implement Spotify search API call
      // const response = await fetch(
      //   `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`,
      //   { headers: { Authorization: `Bearer ${this.accessToken}` } }
      // );
      // const data = await response.json();
      // return data.tracks.items.map(item => this.convertToTrack(item));

      // For now, return empty array
      return [];
    } catch (error) {
      console.error("[SpotifyProvider] Error searching tracks:", error);
      return [];
    }
  }

  /**
   * Update access token (for OAuth refresh)
   */
  updateAccessToken(accessToken: string): void {
    this.client = new SpotifyClient(accessToken);
  }

  /**
   * Convert TrackInfo to Track
   */
  private convertToTrack(trackInfo: any): Track {
    return {
      id: trackInfo.id,
      title: trackInfo.title,
      artist: trackInfo.artist,
      album: trackInfo.album,
      durationMs: trackInfo.durationMs,
      source: "spotify",
      uri: `spotify:track:${trackInfo.id}`,
    };
  }
}

