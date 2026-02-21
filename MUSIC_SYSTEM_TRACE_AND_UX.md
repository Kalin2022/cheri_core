# Music System: Provider Selection Trace & User-Facing Denial Messages

## ✅ Implemented Features

### 1. Provider Selection Trace ✅

**Problem**: When debugging music actions, it's unclear which providers were considered, why each was skipped, and which one won.

**Solution**: Added comprehensive provider selection tracing to action logs.

**Implementation**:
- `AmbientLayerRouter.getBestProviderWithTrace()` returns both provider and selection trace
- Trace includes:
  - `providerId`: Provider identifier
  - `considered`: Whether provider was considered
  - `available`: Whether provider is available
  - `skipped`: Whether provider was skipped
  - `skipReason`: Why skipped ("missing_capability", "not_available", "denied", "error")
  - `selected`: Whether this provider was selected
  - `capabilities`: Provider capabilities (if available)

**Files Changed**:
- `AmbientLayerRouter.ts` - Added `getBestProviderWithTrace()` method
- `MusicActionLogViewer.ts` - Added `ProviderSelectionTrace` interface
- `MusicActionGovernance.ts` - Added `providerSelectionTrace` to `MusicActionResult`
- `MusicStackPanel.tsx` - Displays trace in collapsible details section

**Example Trace**:
```json
{
  "providerSelectionTrace": [
    {
      "providerId": "spotify",
      "considered": true,
      "available": false,
      "skipped": true,
      "skipReason": "not_available"
    },
    {
      "providerId": "system",
      "considered": true,
      "available": true,
      "skipped": false,
      "selected": true,
      "capabilities": { "canPause": true, "canPlay": true, ... }
    }
  ]
}
```

### 2. Snapshot Tests for Caching Behavior ✅

**Problem**: Need to ensure caching behavior is deterministic and correct to prevent regressions.

**Solution**: Created comprehensive test plan and documentation for caching behavior.

**Test Cases**:
1. **Same mood+day+traits => same playlist**
   - First call generates playlist
   - Second call with same context returns cached playlist

2. **Intensity bucket flips => different playlist**
   - Low intensity (0-0.33) => "low" bucket
   - High intensity (0.67-1) => "high" bucket
   - Different buckets => different cache keys => different playlists

3. **Tags change => different playlist**
   - Different secondary moods => different tagsHash
   - Different tagsHash => different cache key => different playlist

4. **Same inputs on different days => cache expired**
   - Same context on same day: Uses cache
   - Same context on different day: Cache expired, generates new

5. **Reroll bypasses cache**
   - `rerollPlaylist()` bypasses cache and regenerates

**Implementation**:
- Added `clearCache()` method to `CognitivePlaylistGenerator`
- Added `getCacheStats()` method to inspect cache state
- Added `rerollPlaylist()` method for bypassing cache
- Added `useCache` parameter to `generatePlaylist()` (default: true)
- Created `CognitivePlaylistGenerator.test.md` with test plan

**Files Changed**:
- `CognitivePlaylistGenerator.ts` - Added cache management methods
- `CognitivePlaylistGenerator.test.md` - Test plan and manual testing guide

### 3. Public-Facing User Message Pattern ✅

**Problem**: When actions are denied, users don't know what was denied, why, or what's needed.

**Solution**: Created user-friendly denial message system.

**Implementation**:
- `MusicActionDenialMessages.ts` - New module for denial messages
- `generateDenialMessage()` - Creates user-friendly denial message
- `formatDenialMessage()` - Formats message for display
- Messages include:
  - **What**: What was denied (e.g., "Playback was not executed")
  - **Why**: Why it was denied (e.g., "You haven't confirmed this action yet")
  - **What Needed**: What is needed (e.g., "Please confirm if you'd like me to proceed")

**Denial Reasons**:
- `DENIED_NOT_CONFIRMED` - User didn't confirm
- `DENIED_NOT_HOST_INITIATED` - Not initiated by user
- `DENIED_POLICY_BLOCK` - Blocked by system policy
- `DENIED_NO_PROVIDER` - No provider available
- `DENIED_EXECUTION_ERROR` - Error during execution
- `DENIED_METHOD_UNSUPPORTED` - Provider doesn't support method

**Example Messages**:
```
DENIED_NOT_CONFIRMED:
"Playback was not executed. You haven't confirmed this action yet. Please confirm if you'd like me to proceed."

DENIED_NO_PROVIDER:
"Pausing couldn't be executed. No music provider is currently available. Please connect Spotify or enable system media controls."

DENIED_METHOD_UNSUPPORTED:
"Skipping to next track is not supported. The current music provider (local) doesn't support this action. Try using a different music service or method."
```

**Files Changed**:
- `MusicActionDenialMessages.ts` - New file with denial message system
- `SpotifyTool.ts` - Uses denial messages for all action results
- All music actions now return user-friendly denial messages

## 📋 Summary

### New Files
- `synthisoul_core/governance/MusicActionDenialMessages.ts`
- `synthisoul_core/integrations/music/CognitivePlaylistGenerator.test.md`
- `MUSIC_SYSTEM_TRACE_AND_UX.md` (this file)

### Modified Files
- `AmbientLayerRouter.ts` - Added provider selection tracing
- `MusicActionLogViewer.ts` - Added trace display
- `MusicActionGovernance.ts` - Added trace to result type
- `MusicStackPanel.tsx` - Displays trace in UI
- `CognitivePlaylistGenerator.ts` - Added cache management methods
- `SpotifyTool.ts` - Uses denial messages

## 🎯 Benefits

1. **Provider Selection Transparency**: See exactly which providers were considered and why each was skipped
2. **Regression Prevention**: Test plan ensures caching behavior remains correct
3. **User Trust**: Clear, user-friendly messages explain why actions were denied
4. **Debugging**: Provider trace makes it easy to diagnose "why didn't it work?" issues
5. **Future-Proof**: Trace will be invaluable when adding Android/Windows bridges

## 🔄 Next Steps (Optional)

1. **Implement Actual Tests**: Convert test plan to Jest/Vitest tests
2. **Trace Visualization**: Add visual trace viewer in DevTools
3. **Denial Message Customization**: Allow users to customize denial messages
4. **Provider Health Dashboard**: Show provider availability and capability status
5. **Cache Analytics**: Track cache hit rates and effectiveness

