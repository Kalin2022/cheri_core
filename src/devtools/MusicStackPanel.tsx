// src/devtools/MusicStackPanel.tsx
/**
 * Music Stack DevTools Panel
 * 
 * Provides:
 * - Smoke test button
 * - Governance log viewer
 * - Provider status
 */

import React, { useState, useEffect } from "react";
import { runMusicSmokeTests, formatSmokeTestResults, type SmokeTestResult } from "../../synthisoul_core/integrations/music/MusicSmokeTest";
import { getMusicActionLog, clearMusicActionLog, formatLogEntry, type MusicActionLogEntry } from "../../synthisoul_core/governance/MusicActionLogViewer";
import { getAmbientLayerRouter } from "../../synthisoul_core/integrations/AmbientLayerRouter";

export const MusicStackPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<SmokeTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [actionLog, setActionLog] = useState<MusicActionLogEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load action log on mount and when auto-refresh is enabled
  useEffect(() => {
    const loadLog = () => {
      setActionLog(getMusicActionLog());
    };

    loadLog();

    if (autoRefresh) {
      const interval = setInterval(loadLog, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await runMusicSmokeTests();
      setTestResults(results);
      console.log(formatSmokeTestResults(results));
    } catch (error) {
      console.error("[MusicStackPanel] Test error:", error);
      setTestResults([{
        test: "TEST_ERROR",
        passed: false,
        message: `Failed to run tests: ${error instanceof Error ? error.message : "Unknown error"}`,
      }]);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleClearLog = () => {
    clearMusicActionLog();
    setActionLog([]);
  };

  return (
    <div className="p-4 text-sm space-y-6">
      <h2 className="text-lg font-semibold mb-2">🎵 Music Stack</h2>

      {/* Smoke Tests */}
      <section>
        <h3 className="text-md font-semibold mb-2">Smoke Tests</h3>
        <button
          onClick={handleRunTests}
          disabled={isRunningTests}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunningTests ? "Running..." : "Test Music Stack"}
        </button>

        {testResults.length > 0 && (
          <div className="mt-4 p-3 bg-gray-100 rounded border">
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {formatSmokeTestResults(testResults)}
            </pre>
          </div>
        )}
      </section>

      {/* Governance Log Viewer */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-semibold">Governance Log (Last 25 Actions)</h3>
          <div className="flex gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs">Auto-refresh</span>
            </label>
            <button
              onClick={handleClearLog}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear
            </button>
          </div>
        </div>

        {actionLog.length === 0 ? (
          <div className="opacity-60 text-xs">
            No music actions logged yet. Trigger music actions to see them here.
          </div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-auto border rounded-md p-2 bg-gray-50">
            {actionLog.map((entry, idx) => (
              <div
                key={`${entry.timestamp}-${idx}`}
                className="text-xs p-2 bg-white rounded border-b last:border-b-0"
              >
                <div className="font-mono">{formatLogEntry(entry)}</div>
                {entry.error && (
                  <div className="text-red-600 mt-1">Error: {entry.error}</div>
                )}
                {entry.fallbackUsed && (
                  <div className="text-yellow-600 mt-1">Fallback provider used</div>
                )}
                {entry.denialReason && (
                  <div className="text-orange-600 mt-1">Denied: {entry.denialReason}</div>
                )}
                {entry.providerSelectionTrace && entry.providerSelectionTrace.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600">Provider Selection Trace</summary>
                    <div className="ml-4 mt-1 space-y-1">
                      {entry.providerSelectionTrace.map((trace, tIdx) => (
                        <div key={tIdx} className="text-xs">
                          <span className={trace.selected ? "font-bold text-green-600" : trace.skipped ? "text-gray-500" : ""}>
                            {trace.selected ? "✓ " : trace.skipped ? "✗ " : "○ "}
                            {trace.providerId}
                          </span>
                          {trace.skipped && trace.skipReason && (
                            <span className="text-gray-500"> - {trace.skipReason}</span>
                          )}
                          {trace.available === false && (
                            <span className="text-gray-500"> (not available)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Provider Status */}
      <section>
        <h3 className="text-md font-semibold mb-2">Provider Status</h3>
        <ProviderStatusDisplay />
      </section>
    </div>
  );
}

const ProviderStatusDisplay: React.FC = () => {
  const [capabilities, setCapabilities] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        const { getAmbientLayerRouter } = await import("../../synthisoul_core/integrations/AmbientLayerRouter");
        const router = getAmbientLayerRouter();
        const caps = router.getProviderCapabilities();
        setCapabilities(caps);
      } catch (error) {
        console.error("[MusicStackPanel] Failed to load capabilities:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCapabilities();
  }, []);

  if (loading) {
    return <div className="text-xs opacity-60">Loading provider status...</div>;
  }

  return (
    <div className="space-y-2 text-xs">
      {Array.from(capabilities.entries()).map(([id, caps]) => (
        <div key={id} className="p-2 bg-gray-100 rounded border">
          <div className="font-semibold">{id}</div>
          <div className="mt-1 space-y-1">
            {caps.canPause && <div>✓ Pause</div>}
            {caps.canPlay && <div>✓ Play</div>}
            {caps.canSkip && <div>✓ Skip</div>}
            {caps.canPrevious && <div>✓ Previous</div>}
            {caps.canGetNowPlaying && <div>✓ Get Now Playing</div>}
            {caps.canCreatePlaylist && <div>✓ Create Playlist</div>}
            {caps.canGetLikedTracks && <div>✓ Get Liked Tracks</div>}
            {caps.canSearchTracks && <div>✓ Search Tracks</div>}
            {caps.canPlayTrack && <div>✓ Play Track</div>}
            {caps.canDeepLink && <div>✓ Deep Link</div>}
          </div>
        </div>
      ))}
    </div>
  );
    </div>
  );
};

