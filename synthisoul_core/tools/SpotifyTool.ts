// synthisoul_core/tools/SpotifyTool.ts
/**
 * 🌑 SynthiSoulOS — Music Tool (Provider-Agnostic)
 *
 * Handles music playback control and mood-aware recommendations.
 * Uses AmbientLayerRouter and AbstractMusicProvider abstraction.
 * Spotify is now an implementation detail, not the system spine.
 */

import type {
  SpotifyIntent,
  ToolHandler,
  ToolResult,
  ToolContext,
} from "./ToolTypes";
import { getCurrentSnapshot } from "../emotional_tone/EmotionalStateManager";
import { HostSafeTelemetry } from "../telemetry/HostSafeTelemetry";
import { getAmbientLayerRouter } from "../integrations/AmbientLayerRouter";
import { getCognitivePlaylistGenerator } from "../integrations/music/CognitivePlaylistGenerator";
import { getCurrentClimate } from "../emotional_tone/EmotionalStateManager";
import { generateDenialMessage, formatDenialMessage } from "../governance/MusicActionDenialMessages";

export const SpotifyTool = {
  handleIntent: async (
    intent: SpotifyIntent,
    context: ToolContext
  ): Promise<ToolResult> => {
    const { turnContext } = context;
    const synthId = turnContext.synthId;

    // Get emotional state for context
    const snapshot = getCurrentSnapshot(synthId);
    const climate = getCurrentClimate(synthId);
    const mood = snapshot?.tags?.primaryMood || "neutral";
    // Get primary intensity from snapshot (first non-zero intensity or default)
    const intensityValues = snapshot?.intensities ? Object.values(snapshot.intensities).filter(v => typeof v === 'number') as number[] : [];
    const intensity = intensityValues.length > 0 ? Math.max(...intensityValues) : 0.5;

    // Get ambient router and playlist generator
    const ambientRouter = getAmbientLayerRouter();
    const playlistGenerator = getCognitivePlaylistGenerator();

    let success = false;
    let message = "";
    let data: any = {};

    try {
      switch (intent.action) {
        case "play":
          const playResult = await ambientRouter.executeMusicAction("play", {
            mood,
            intensity,
            context: typeof turnContext.meta?.timeOfDay === "string" ? turnContext.meta.timeOfDay : "unknown",
            hostInitiated: true,
          });
          success = playResult.status === "OK_EXECUTED";
          if (playResult.status === "OK_EXECUTED") {
            message = "Playback started";
          } else if (playResult.status === "OK_NOOP_NO_PROVIDER") {
            const denialMsg = generateDenialMessage("play", "DENIED_NO_PROVIDER");
            message = formatDenialMessage(denialMsg);
          } else if (playResult.status === "OK_NOOP_METHOD_UNSUPPORTED") {
            const denialMsg = generateDenialMessage("play", "DENIED_METHOD_UNSUPPORTED");
            message = formatDenialMessage(denialMsg);
          } else {
            const denialMsg = generateDenialMessage("play", "DENIED_EXECUTION_ERROR");
            message = formatDenialMessage(denialMsg);
          }
          break;

        case "pause":
          const pauseResult = await ambientRouter.executeMusicAction("pause", {
            mood,
            intensity,
            context: typeof turnContext.meta?.timeOfDay === "string" ? turnContext.meta.timeOfDay : "unknown",
            hostInitiated: true,
          });
          success = pauseResult.status === "OK_EXECUTED";
          if (pauseResult.status === "OK_EXECUTED") {
            message = "Playback paused";
          } else if (pauseResult.status === "OK_NOOP_NO_PROVIDER") {
            const denialMsg = generateDenialMessage("pause", "DENIED_NO_PROVIDER");
            message = formatDenialMessage(denialMsg);
          } else if (pauseResult.status === "OK_NOOP_METHOD_UNSUPPORTED") {
            const denialMsg = generateDenialMessage("pause", "DENIED_METHOD_UNSUPPORTED");
            message = formatDenialMessage(denialMsg);
          } else {
            const denialMsg = generateDenialMessage("pause", "DENIED_EXECUTION_ERROR");
            message = formatDenialMessage(denialMsg);
          }
          break;

        case "next":
          const skipResult = await ambientRouter.executeMusicAction("skip", {
            mood,
            intensity,
            context: typeof turnContext.meta?.timeOfDay === "string" ? turnContext.meta.timeOfDay : "unknown",
            hostInitiated: true,
          });
          success = skipResult.status === "OK_EXECUTED";
          if (skipResult.status === "OK_EXECUTED") {
            message = "Skipped to next track";
          } else if (skipResult.status === "OK_NOOP_NO_PROVIDER") {
            const denialMsg = generateDenialMessage("skip", "DENIED_NO_PROVIDER");
            message = formatDenialMessage(denialMsg);
          } else if (skipResult.status === "OK_NOOP_METHOD_UNSUPPORTED") {
            const denialMsg = generateDenialMessage("skip", "DENIED_METHOD_UNSUPPORTED");
            message = formatDenialMessage(denialMsg);
          } else {
            const denialMsg = generateDenialMessage("skip", "DENIED_EXECUTION_ERROR");
            message = formatDenialMessage(denialMsg);
          }
          break;

        case "previous":
          const previousResult = await ambientRouter.executeMusicAction("previous", {
            mood,
            intensity,
            context: typeof turnContext.meta?.timeOfDay === "string" ? turnContext.meta.timeOfDay : "unknown",
            hostInitiated: true,
          });
          success = previousResult.status === "OK_EXECUTED";
          if (previousResult.status === "OK_EXECUTED") {
            message = "Went to previous track";
          } else if (previousResult.status === "OK_NOOP_NO_PROVIDER") {
            const denialMsg = generateDenialMessage("previous", "DENIED_NO_PROVIDER");
            message = formatDenialMessage(denialMsg);
          } else if (previousResult.status === "OK_NOOP_METHOD_UNSUPPORTED") {
            const denialMsg = generateDenialMessage("previous", "DENIED_METHOD_UNSUPPORTED");
            message = formatDenialMessage(denialMsg);
          } else {
            const denialMsg = generateDenialMessage("previous", "DENIED_EXECUTION_ERROR");
            message = formatDenialMessage(denialMsg);
          }
          break;

        case "play_playlist":
          // Generate playlist cognitively, then export
          const playlistContext = {
            mood,
            emotionalSnapshot: snapshot || undefined,
            timeOfDay: typeof turnContext.meta?.timeOfDay === "string" ? turnContext.meta.timeOfDay : undefined,
            cachedPreferences: {
              // TODO: Load from memory/cache
              likedTracks: [],
              moodAssociations: [],
            },
          };

          const generatedPlaylist = playlistGenerator.generatePlaylist(playlistContext);
          
          // Try to create playlist via provider, or export as fallback
          const exportFormat = intent.query?.includes("m3u") ? "m3u" : "json";
          const exportResult = playlistGenerator.exportPlaylist(generatedPlaylist, exportFormat);

          success = true;
          message = `Generated playlist: ${generatedPlaylist.name}`;
          data = {
            playlist: generatedPlaylist,
            export: exportResult,
            providerUsed: "cognitive", // Generated, not from provider API
          };
          break;

        case "recommend_for_mood":
          // Use ambient router to suggest music based on mood
          const adjustments = await ambientRouter.adjustAtmosphere({
            mood,
            intensity,
            context: typeof turnContext.meta?.timeOfDay === "string" ? turnContext.meta.timeOfDay : "unknown",
            hostInitiated: true,
          });

          success = adjustments.length > 0;
          message = success
            ? `Suggested ${adjustments.length} atmosphere adjustment(s)`
            : "No adjustments suggested";
          data = {
            adjustments,
            mood,
            intensity,
          };
          break;

        case "search":
          // Search is provider-specific, would need to route through provider
          message = "Search not yet implemented via provider abstraction";
          success = false;
          break;

        case "play_track":
          // Would need track info from intent
          message = "Play track requires track information";
          success = false;
          break;

        default:
          message = `Unknown action: ${(intent as any).action}`;
          success = false;
      }
    } catch (error) {
      console.error("[SpotifyTool] Error handling intent:", error);
      message = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
      success = false;
    }

    // Log intent for telemetry
    HostSafeTelemetry.log({
      type: "tool_music_intent",
      synthId,
      intent,
      emotionalSnapshot: snapshot,
      success,
      timestamp: Date.now(),
    } as any);

    return {
      kind: "spotify",
      success,
      message,
      data: {
        ...data,
        intent,
        mood,
        intensity,
      },
      memoryShards: [
        {
          kind: "tool_event",
          text: `Music action: ${intent.action}${
            intent.query ? ` (${intent.query})` : ""
          } - ${message}`,
          tags: ["music", "tool_event", mood],
          importance: 0.4,
        },
      ],
    };
  },
};
