// synthisoul_core/integrations/music/CognitivePlaylistGenerator.ts
/**
 * Cognitive Playlist Generator
 * 
 * Generates playlists based on cognitive state (mood, traits, preferences)
 * rather than direct API calls. This preserves the experience even if
 * the provider disappears.
 * 
 * Split into two responsibilities:
 * 1. Cognitive Layer: Generates track list from memory/preferences
 * 2. Execution Layer: Exports to provider or fallback format
 */

import type { Track, Playlist } from "./AbstractMusicProvider";
import type { EmotionalSnapshot } from "../../emotional_tone/EmotionalTypes";

// TraitBias type (if not available, use any for now)
type TraitBias = any;

export interface PlaylistGenerationContext {
  mood: string;
  emotionalSnapshot?: EmotionalSnapshot;
  traitBias?: TraitBias;
  timeOfDay?: string;
  activity?: string;
  reroll?: boolean; // If true, bypass cache and regenerate
  cachedPreferences?: {
    likedTracks?: Track[];
    moodAssociations?: Array<{ mood: string; trackIds: string[] }>;
    genrePreferences?: string[];
  };
}

export interface GeneratedPlaylist {
  name: string;
  tracks: Track[];
  reason: string; // Why these tracks were selected
  metadata: {
    mood: string;
    intensity: number;
    generatedAt: number;
  };
}

export interface PlaylistExport {
  format: "json" | "text" | "m3u" | "deep_link";
  content: string;
  metadata?: Record<string, any>;
}

interface CachedPlaylist {
  playlist: GeneratedPlaylist;
  cacheKey: string;
  cachedAt: number;
}

export class CognitivePlaylistGenerator {
  private playlistCache: Map<string, CachedPlaylist> = new Map();
  private readonly MAX_CACHED = 10;

  /**
   * Generate cache key from context
   * Key components: mood + day (local timezone) + intensityBucket + tagsHash + traitHash
   */
  private generateCacheKey(context: PlaylistGenerationContext): string {
    // Use local timezone for day (YYYY-MM-DD format)
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    const day = localDate.toISOString().split('T')[0]; // YYYY-MM-DD in local timezone
    
    // Intensity bucket (0-0.33, 0.34-0.66, 0.67-1)
    const intensity = context.emotionalSnapshot?.intensities
      ? Math.max(...(Object.values(context.emotionalSnapshot.intensities).filter(v => typeof v === 'number') as number[]))
      : 0.5;
    const intensityBucket = intensity < 0.34 ? "low" : intensity < 0.67 ? "mid" : "high";
    
    // Tags hash (sorted and hashed)
    const tags = context.emotionalSnapshot?.tags 
      ? [...(context.emotionalSnapshot.tags.secondaryMoods || []), context.emotionalSnapshot.tags.primaryMood]
      : [];
    const tagsHash = tags.length > 0 
      ? tags.sort().join(",").slice(0, 30) // First 30 chars of sorted tags
      : "default";
    
    // Trait hash
    const traitHash = context.traitBias 
      ? JSON.stringify(context.traitBias).slice(0, 20) // First 20 chars as hash
      : "default";
    
    return `${context.mood}_${day}_${intensityBucket}_${tagsHash}_${traitHash}`;
  }

  /**
   * Get cached playlist if available
   */
  private getCachedPlaylist(cacheKey: string): GeneratedPlaylist | null {
    const cached = this.playlistCache.get(cacheKey);
    if (cached) {
      // Cache is valid for same day (using local timezone)
      const now = new Date();
      const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      const today = localDate.toISOString().split('T')[0];
      
      const cachedDate = new Date(cached.cachedAt);
      const cachedLocalDate = new Date(cachedDate.getTime() - (cachedDate.getTimezoneOffset() * 60000));
      const cachedDay = cachedLocalDate.toISOString().split('T')[0];
      
      if (today === cachedDay) {
        return cached.playlist;
      } else {
        // Expired, remove from cache
        this.playlistCache.delete(cacheKey);
      }
    }
    return null;
  }

  /**
   * Cache a generated playlist
   */
  private cachePlaylist(cacheKey: string, playlist: GeneratedPlaylist): void {
    // Remove oldest if at max capacity
    if (this.playlistCache.size >= this.MAX_CACHED) {
      const oldestKey = Array.from(this.playlistCache.entries())
        .sort((a, b) => a[1].cachedAt - b[1].cachedAt)[0]?.[0];
      if (oldestKey) {
        this.playlistCache.delete(oldestKey);
      }
    }

    this.playlistCache.set(cacheKey, {
      playlist,
      cacheKey,
      cachedAt: Date.now(),
    });
  }

  /**
   * Generate a playlist from cognitive state
   * 
   * Uses:
   * - Cached preference memory (not live API)
   * - Mood state
   * - TraitBias
   * - Time of day / activity context
   * - Playlist cache (by mood + day + traitHash)
   */
  generatePlaylist(context: PlaylistGenerationContext, useCache: boolean = true): GeneratedPlaylist {
    // Check cache first unless reroll is requested or useCache is false
    if (!context.reroll && useCache) {
      const cacheKey = this.generateCacheKey(context);
      const cached = this.getCachedPlaylist(cacheKey);
      if (cached) {
        console.log(`[CognitivePlaylistGenerator] Using cached playlist for key: ${cacheKey}`);
        return cached;
      }
    }
    const { mood, cachedPreferences, emotionalSnapshot, traitBias, timeOfDay, activity } = context;

    // Start with cached liked tracks if available
    let candidateTracks: Track[] = cachedPreferences?.likedTracks || [];

    // Filter by mood associations if available
    if (cachedPreferences?.moodAssociations) {
      const moodTracks = cachedPreferences.moodAssociations
        .find(ma => ma.mood === mood)
        ?.trackIds || [];
      
      if (moodTracks.length > 0) {
        // Filter candidate tracks to mood-associated ones
        candidateTracks = candidateTracks.filter(t => moodTracks.includes(t.id));
      }
    }

    // Apply trait bias if available
    if (traitBias && candidateTracks.length > 0) {
      // Trait bias could influence track selection (e.g., prefer energetic tracks if high energy trait)
      // For now, we'll use a simple filter based on trait intensity
      const energyLevel = traitBias.energy || 0.5;
      if (energyLevel > 0.7) {
        // High energy: prefer upbeat tracks (could filter by genre if available)
        candidateTracks = candidateTracks.slice(0, Math.min(20, candidateTracks.length));
      } else if (energyLevel < 0.3) {
        // Low energy: prefer calm tracks
        candidateTracks = candidateTracks.slice(0, Math.min(15, candidateTracks.length));
      }
    }

    // Limit to reasonable playlist size (10-20 tracks)
    const maxTracks = 15;
    const selectedTracks = candidateTracks.slice(0, maxTracks);

    // Generate playlist name based on context
    const playlistName = this.generatePlaylistName(mood, timeOfDay, activity);

    // Generate reason for selection
    const reason = this.generateReason(mood, selectedTracks.length, cachedPreferences);

    // Calculate intensity from emotional snapshot
    let intensity = 0.5;
    if (emotionalSnapshot?.intensities) {
      const intensityValues = Object.values(emotionalSnapshot.intensities).filter(v => typeof v === 'number') as number[];
      if (intensityValues.length > 0) {
        intensity = Math.max(...intensityValues);
      }
    }

    return {
      name: playlistName,
      tracks: selectedTracks,
      reason,
      metadata: {
        mood,
        intensity,
        generatedAt: Date.now(),
      },
    };
  }

  /**
   * Export playlist to various formats
   */
  exportPlaylist(playlist: GeneratedPlaylist, format: PlaylistExport["format"]): PlaylistExport {
    switch (format) {
      case "json":
        return {
          format: "json",
          content: JSON.stringify(playlist, null, 2),
          metadata: {
            trackCount: playlist.tracks.length,
            generatedAt: playlist.metadata.generatedAt,
          },
        };

      case "text":
        const textLines = [
          `Playlist: ${playlist.name}`,
          `Reason: ${playlist.reason}`,
          "",
          "Tracks:",
          ...playlist.tracks.map((t, i) => `${i + 1}. ${t.artist} - ${t.title}`),
        ];
        return {
          format: "text",
          content: textLines.join("\n"),
        };

      case "m3u":
        const m3uLines = [
          "#EXTM3U",
          `#EXTINF:-1,${playlist.name}`,
          ...playlist.tracks.map(t => {
            const title = `${t.artist} - ${t.title}`;
            const uri = t.uri || `spotify:track:${t.id}`;
            return `#EXTINF:-1,${title}\n${uri}`;
          }),
        ];
        return {
          format: "m3u",
          content: m3uLines.join("\n"),
        };

      case "deep_link":
        // Generate normalized deep link structure (provider-agnostic)
        // Format: provider://search?q=... or provider://playlist?id=...
        const deepLinks = playlist.tracks.slice(0, 5).map(t => {
          const provider = t.source || "unknown";
          const searchQuery = encodeURIComponent(`${t.artist} ${t.title}`);
          
          // Normalized structure
          return {
            search: `${provider}://search?q=${searchQuery}`,
            track: t.uri ? `${provider}://track?id=${t.id}` : undefined,
            // Legacy format for backward compatibility
            legacy: t.uri || `${provider}:track:${t.id}`,
          };
        });
        return {
          format: "deep_link",
          content: JSON.stringify(deepLinks, null, 2),
          metadata: {
            provider: "multiple",
            normalized: true, // Indicates normalized structure
          },
        };
    }
  }

  private generatePlaylistName(mood: string, timeOfDay?: string, activity?: string): string {
    const parts: string[] = [];

    if (timeOfDay) {
      parts.push(timeOfDay);
    }

    if (activity) {
      parts.push(activity);
    }

    parts.push(mood);

    return parts.length > 0
      ? `${parts.join(" ")} vibes`.replace(/\b\w/g, l => l.toUpperCase())
      : `${mood} playlist`.replace(/\b\w/g, l => l.toUpperCase());
  }

  private generateReason(mood: string, trackCount: number, preferences?: PlaylistGenerationContext["cachedPreferences"]): string {
    if (preferences?.likedTracks && preferences.likedTracks.length > 0) {
      return `Generated ${trackCount} tracks from your liked songs, filtered for ${mood} mood`;
    } else if (preferences?.moodAssociations) {
      return `Selected ${trackCount} tracks based on your ${mood} mood associations`;
    } else {
      return `Generated ${trackCount} tracks for ${mood} mood based on available preferences`;
    }
  }

  /**
   * Get current cache statistics
   */
  getCacheStats() {
    return {
      size: this.playlistCache.size,
      maxSize: this.MAX_CACHED,
      keys: Array.from(this.playlistCache.keys()),
    };
  }

  /**
   * Clear the playlist cache (for testing)
   */
  clearCache(): void {
    this.playlistCache.clear();
  }

  /**
   * Reroll a playlist (bypass cache and regenerate)
   */
  rerollPlaylist(context: PlaylistGenerationContext): GeneratedPlaylist {
    return this.generatePlaylist({ ...context, reroll: true }, false);
  }
}

// Singleton instance
let generatorInstance: CognitivePlaylistGenerator | null = null;

/**
 * Get the global CognitivePlaylistGenerator instance
 */
export function getCognitivePlaylistGenerator(): CognitivePlaylistGenerator {
  if (!generatorInstance) {
    generatorInstance = new CognitivePlaylistGenerator();
  }
  return generatorInstance;
}

