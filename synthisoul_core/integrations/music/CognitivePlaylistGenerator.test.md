# CognitivePlaylistGenerator Caching Behavior Tests

## Test Plan (Snapshot Tests)

These tests ensure caching behavior is deterministic and correct. They are "future regression killers."

### Test 1: Same mood+day+traits => same playlist

**Setup:**
```typescript
const context: PlaylistGenerationContext = {
  mood: "focused",
  emotionalSnapshot: {
    intensities: { joy: 0.5, calm: 0.6, curiosity: 0.7 },
    tags: { primaryMood: "focused", secondaryMoods: ["curious"] },
  },
  cachedPreferences: { likedTracks: [...] },
};
```

**Expected:**
- First call: Generate new playlist
- Second call with same context: Return cached playlist (same name, tracks, reason)

**Cache Key Components:**
- mood: "focused"
- day: YYYY-MM-DD (local timezone)
- intensityBucket: "mid" (0.34-0.66)
- tagsHash: "curious,focused" (sorted)
- traitHash: (from traitBias)

### Test 2: Intensity bucket flips => different playlist

**Setup:**
```typescript
// Low intensity (0-0.33)
const lowContext = {
  mood: "melancholy",
  emotionalSnapshot: {
    intensities: { sadness: 0.2, calm: 0.3 },
    tags: { primaryMood: "melancholy", secondaryMoods: ["calm"] },
  },
};

// High intensity (0.67-1)
const highContext = {
  mood: "melancholy",
  emotionalSnapshot: {
    intensities: { sadness: 0.8, calm: 0.9 },
    tags: { primaryMood: "melancholy", secondaryMoods: ["calm"] },
  },
};
```

**Expected:**
- Low intensity: Cache key includes "low" bucket
- High intensity: Cache key includes "high" bucket
- Different cache keys => different playlists

### Test 3: Tags change => different playlist

**Setup:**
```typescript
// Base context
const baseContext = {
  mood: "focused",
  emotionalSnapshot: {
    intensities: { joy: 0.5, calm: 0.6 },
    tags: { primaryMood: "focused", secondaryMoods: ["curious"] },
  },
};

// Different tags
const differentTagsContext = {
  mood: "focused",
  emotionalSnapshot: {
    intensities: { joy: 0.5, calm: 0.6 },
    tags: { primaryMood: "focused", secondaryMoods: ["energetic", "determined"] },
  },
};
```

**Expected:**
- Base: Cache key includes tagsHash: "curious,focused"
- Different tags: Cache key includes tagsHash: "determined,energetic,focused"
- Different cache keys => different playlists

### Test 4: Same inputs on different days => different playlist (cache expired)

**Expected:**
- Same context on same day: Uses cache
- Same context on different day: Cache expired, generates new playlist

### Test 5: Reroll bypasses cache

**Expected:**
- First call: Generate and cache playlist
- Second call (useCache=true): Return cached playlist
- Third call (reroll=true): Bypass cache, generate new playlist

## Implementation Notes

To implement these tests:

1. Add `clearCache()` method to `CognitivePlaylistGenerator`
2. Add `getCacheStats()` method to inspect cache state
3. Add `rerollPlaylist()` method that calls `generatePlaylist()` with `reroll: true`
4. Use a test framework (Jest, Vitest, etc.) with snapshot testing
5. Mock date/time for consistent day-based cache keys

## Manual Testing

You can manually test these behaviors:

```typescript
import { getCognitivePlaylistGenerator } from "./CognitivePlaylistGenerator";

const generator = getCognitivePlaylistGenerator();

// Test 1: Same context => same playlist
const context1 = { mood: "focused", ... };
const playlist1 = generator.generatePlaylist(context1, true);
const playlist2 = generator.generatePlaylist(context1, true);
console.assert(playlist1.name === playlist2.name, "Should be cached");

// Test 2: Intensity change => different playlist
const lowContext = { mood: "melancholy", emotionalSnapshot: { intensities: { sadness: 0.2 } } };
const highContext = { mood: "melancholy", emotionalSnapshot: { intensities: { sadness: 0.8 } } };
const lowPlaylist = generator.generatePlaylist(lowContext, true);
generator.clearCache();
const highPlaylist = generator.generatePlaylist(highContext, true);
console.assert(lowPlaylist.name !== highPlaylist.name, "Should be different");

// Test 3: Tags change => different playlist
const baseContext = { mood: "focused", emotionalSnapshot: { tags: { secondaryMoods: ["curious"] } } };
const differentTagsContext = { mood: "focused", emotionalSnapshot: { tags: { secondaryMoods: ["energetic"] } } };
const basePlaylist = generator.generatePlaylist(baseContext, true);
generator.clearCache();
const differentPlaylist = generator.generatePlaylist(differentTagsContext, true);
console.assert(basePlaylist.name !== differentPlaylist.name, "Should be different");
```

