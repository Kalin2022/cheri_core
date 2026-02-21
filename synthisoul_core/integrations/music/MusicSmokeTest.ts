// synthisoul_core/integrations/music/MusicSmokeTest.ts
/**
 * Music Stack Smoke Test Harness
 * 
 * Dev-only test suite for music system.
 * Run via: npm run test:music or DevTools "Test music stack" button
 */

import { getAmbientLayerRouter } from "../AmbientLayerRouter";
import { getCognitivePlaylistGenerator } from "./CognitivePlaylistGenerator";
import { approveMusicAction, createMusicActionIntent } from "../../governance/MusicActionGovernance";

export interface SmokeTestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

/**
 * Run all smoke tests
 */
export async function runMusicSmokeTests(): Promise<SmokeTestResult[]> {
  const results: SmokeTestResult[] = [];

  // Test 1: Create playlist from state (no providers needed)
  results.push(await testCreatePlaylistFromState());

  // Test 2: Pause with confirmed=false → DENIED
  results.push(await testPauseDenied());

  // Test 3: Pause with confirmed=true → OK (NOOP allowed if provider missing)
  results.push(await testPauseApproved());

  return results;
}

/**
 * Test: Create playlist from cognitive state
 * Should return export text/JSON even with no providers
 */
async function testCreatePlaylistFromState(): Promise<SmokeTestResult> {
  try {
    const generator = getCognitivePlaylistGenerator();
    
    const playlist = generator.generatePlaylist({
      mood: "focused",
      emotionalSnapshot: undefined,
      cachedPreferences: {
        likedTracks: [
          {
            id: "test-1",
            title: "Test Track 1",
            artist: "Test Artist",
            source: "test",
          },
          {
            id: "test-2",
            title: "Test Track 2",
            artist: "Test Artist",
            source: "test",
          },
        ],
        moodAssociations: [],
      },
    });

    // Export to JSON
    const jsonExport = generator.exportPlaylist(playlist, "json");
    
    // Export to text
    const textExport = generator.exportPlaylist(playlist, "text");

    return {
      test: "MUSIC_CREATE_PLAYLIST_FROM_STATE",
      passed: true,
      message: "Playlist generated and exported successfully",
      data: {
        playlistName: playlist.name,
        trackCount: playlist.tracks.length,
        jsonLength: jsonExport.content.length,
        textLength: textExport.content.length,
      },
    };
  } catch (error) {
    return {
      test: "MUSIC_CREATE_PLAYLIST_FROM_STATE",
      passed: false,
      message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Test: Pause with confirmed=false → DENIED by governance
 */
async function testPauseDenied(): Promise<SmokeTestResult> {
  try {
    const intent = createMusicActionIntent(
      "pause",
      "system",
      false, // hostInitiated
      "denied", // confirmationStatus
      {
        mood: "neutral",
        emotionalWeight: 0.5,
      }
    );

    const approved = await approveMusicAction(intent);

    if (approved) {
      return {
        test: "MUSIC_PAUSE_DENIED",
        passed: false,
        message: "Expected denial but action was approved",
      };
    }

    return {
      test: "MUSIC_PAUSE_DENIED",
      passed: true,
      message: "Action correctly denied by governance",
    };
  } catch (error) {
    return {
      test: "MUSIC_PAUSE_DENIED",
      passed: false,
      message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Test: Pause with confirmed=true → OK (NOOP allowed if provider missing)
 */
async function testPauseApproved(): Promise<SmokeTestResult> {
  try {
    const router = getAmbientLayerRouter();
    
    const intent = createMusicActionIntent(
      "pause",
      "system",
      true, // hostInitiated
      "approved", // confirmationStatus
      {
        mood: "neutral",
        emotionalWeight: 0.5,
      }
    );

    const approved = await approveMusicAction(intent);
    
    if (!approved) {
      return {
        test: "MUSIC_PAUSE_APPROVED",
        passed: false,
        message: "Expected approval but action was denied",
      };
    }

    // Try to execute (may fail if no provider, but that's OK - NOOP allowed)
    const result = await router.executeMusicAction("pause", {
      mood: "neutral",
      intensity: 0.5,
      context: "test",
      hostInitiated: true,
    });

    return {
      test: "MUSIC_PAUSE_APPROVED",
      passed: true,
      message: result 
        ? "Action approved and executed successfully" 
        : "Action approved but no provider available (NOOP - acceptable)",
      data: {
        executed: result,
      },
    };
  } catch (error) {
    return {
      test: "MUSIC_PAUSE_APPROVED",
      passed: false,
      message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Format test results for console output
 */
export function formatSmokeTestResults(results: SmokeTestResult[]): string {
  const lines = ["🎵 Music Stack Smoke Test Results", "=".repeat(50)];
  
  for (const result of results) {
    const icon = result.passed ? "✅" : "❌";
    lines.push(`${icon} ${result.test}`);
    lines.push(`   ${result.message}`);
    if (result.data) {
      lines.push(`   Data: ${JSON.stringify(result.data, null, 2)}`);
    }
    lines.push("");
  }

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  lines.push(`Summary: ${passed}/${total} tests passed`);

  return lines.join("\n");
}

