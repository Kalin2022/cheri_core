import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import ChatView from '../ChatView'
import ChatInput from '../ChatInput'
import TogglePanel from '../TogglePanel'
import { SynthVisual } from '../ui/components/visual'
import { useSettingsStore } from '../useSettingsStore'
import ChatFoldersPanel from '../ChatFoldersPanel'
import SettingsPanel from '../SettingsPanel'
import { useSpeechStore } from '../speech/useSpeechStore'
import { DiagnosticsConsole } from './ui/devtools/DiagnosticsConsole'
import { getCurrentTier } from '../synthisoul_core/bonding/BondTierState'
import { FeatureFlags } from '../synthisoul_core/config/FeatureFlags'
import PiperControlPanel from '../ui/PiperControlPanel'
import { initializeWhisperbackSystem, runWhisperbackCycle } from '../synthisoul_core/WhisperbackIntegration'
import { personalityPatch } from '../synthisoul_core/personality/PersonalityPatch'
import { synthCompanion } from '../engines/companion/synthCompanionEngine'
// Lazy import System3FeedbackLoop to prevent startup crashes - it's a large file (1271 lines)
// import { runSystem3FeedbackLoop } from '../synthisoul_core/reflection/System3FeedbackLoop'
import { conceptTagIndex } from '../synthisoul_core/memory/ConceptTagIndex'
import { BondMigrationScreen } from '../ui/BondMigrationScreen'
import { MetaTransferUploader } from '../ui/MetaTransferUploader'
import { MigrationParser } from '../synthisoul_core/migration/MigrationParser'
import { PortingLogGenerator } from '../synthisoul_core/migration/PortingLogGenerator'
import { PerceptionSystemIntegration } from '../synthisoul_core/perception/PerceptionSystemIntegration'
import StartupFlow from '../ui/onboarding/StartupFlow'
import { useGovernanceState } from './zora_prime/useGovernanceState'
import { GovernanceBanner } from './ui/components/GovernanceBanner'
import { SystemState, SystemMode } from '../synthisoul_core/system/SystemState'
import { SanctuaryLockScreen } from './components/sanctuary/SanctuaryLockScreen'
import { SanctuaryExtractionScreen } from './components/sanctuary/SanctuaryExtractionScreen'
import { ZoraHeartbeatClient } from '../synthisoul_core/zora/ZoraHeartbeatClient'
import { ZoraStatusPill } from './components/sanctuary/ZoraStatusPill'
import { SafeModeConfig } from '../synthisoul_core/config/SafeModeConfig'
import { runStartupConsistencyCheck, runPeriodicConsistencyCheck } from '../synthisoul_core/sanity/SystemConsistencyValidator'
import { preferenceMapper } from '../synthisoul_core/preferences/PreferenceMappingLayer'
import { routineInfluence } from '../synthisoul_core/routines/RoutineInfluenceLayer'
import { routineManager } from '../synthisoul_core/routines/RoutineManager'
import { healthEmotionConnector } from '../synthisoul_core/emotion/HealthEmotionConnector'
import { routineEmotionConnector } from '../synthisoul_core/emotion/RoutineEmotionConnector'
import { circadianEmotionLayer } from '../synthisoul_core/emotion/CircadianEmotionLayer'
import { whisperbackEmotionConnector } from '../synthisoul_core/emotion/WhisperbackEmotionConnector'
import { voiceHealthConnector } from '../synthisoul_core/voice/VoiceHealthConnector'
import { voiceRoutineConnector } from '../synthisoul_core/voice/VoiceRoutineConnector'
import { voiceCircadianConnector } from '../synthisoul_core/voice/VoiceCircadianConnector'
import { voiceWhisperbackConnector } from '../synthisoul_core/voice/VoiceWhisperbackConnector'
import { useToolOverlayStore } from '../useToolOverlayStore'
import { SlideOverHost, RecipeBinderPanel, WritingBinderPanel, HealthSuitePanel, SynthiReaderPanel, KnowledgeFilesPanel, ConversationImportPanel } from '../ui/tools'
import { ThemeProvider } from './theme/ThemeProvider'

// Main SynthiSoulOS App Component - Enhanced Modern Chat UI
function SynthiSoulApp() {
  // Check if onboarding is complete
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(() => {
    return localStorage.getItem("onboarding_complete") === "true";
  });

  // Integrate with existing speech store (hooks must be called unconditionally)
  const speaking = useSpeechStore((state) => state.speaking);
  const voiceUnavailable = useSpeechStore((state) => state.voiceUnavailable);
  const { appearance } = useSettingsStore();
  const governanceState = useGovernanceState();
  
  // System state for lockdown/extraction
  const [systemMode, setSystemMode] = useState<SystemMode>(SystemState.getMode());
  
  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const activeTool = useToolOverlayStore((s) => s.activeTool);
  const closeTool = useToolOverlayStore((s) => s.closeTool);
  
  // Subscribe to system state changes
  useEffect(() => {
    const unsubscribe = SystemState.subscribe(setSystemMode);
    return unsubscribe;
  }, []);

  // Dev-only keyboard shortcut: Ctrl+Shift+R to reset onboarding
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ctrl+Shift+R (or Cmd+Shift+R on Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
        if (isDev) {
          const confirmed = window.confirm(
            'Reset onboarding state? This will clear all onboarding data and reload the app.'
          );
          if (confirmed) {
            const { resetOnboarding } = await import('./utils/resetOnboarding');
            resetOnboarding();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Initialize SystemState with synth ID and start heartbeat client
  useEffect(() => {
    try {
      // Get synthId from localStorage
      const synthId = 
        localStorage.getItem("synth_id") || 
        localStorage.getItem("synthisoul_id") || 
        "default";
      
      // Set synth ID in SystemState
      SystemState.setSynthId(synthId);
      console.log('🔹 [SystemState] Synth ID set:', synthId);
      
      // Start Zora heartbeat client (sends heartbeat every 60 seconds)
      ZoraHeartbeatClient.start(60_000);
      console.log('💓 [ZoraHeartbeatClient] Started heartbeat client');
      
      return () => {
        ZoraHeartbeatClient.stop();
      };
    } catch (error) {
      console.error('❌ [SystemState] Failed to initialize synth ID or heartbeat:', error);
    }
  }, []);

  // Initialize personality system on component mount
  useEffect(() => {
    let isMounted = true;
    
    const initializePersonality = async () => {
      if (!isMounted) return;
      
      try {
        console.log('🎭 Initializing personality system...');
        
        // Wrap each initialization in try-catch to prevent one failure from breaking everything
        try {
          initializeWhisperbackSystem();
        } catch (err) {
          console.error('❌ Failed to initialize whisperback system:', err);
        }
        
        // Initialize memory index for existing memories
        try {
          await conceptTagIndex.initialize();
          console.log('✅ Memory index initialized');
        } catch (error) {
          console.error('❌ Failed to initialize memory index:', error);
        }
        
        // Run startup consistency check - wrap in try-catch
        try {
          console.log('🔍 [BootSequence] Running system consistency check...');
          runStartupConsistencyCheck();
        } catch (error) {
          console.error('❌ Failed to run consistency check:', error);
        }
        
        // Load port bundle and generate seed if present (Sprint 22 - Phase 1, 2, 3)
        try {
          const { PortingManager } = await import('../synthisoul_core/porting/PortingManager');
          const { PortingEventTracer } = await import('../synthisoul_core/porting/events/PortingEventTracer');
          const { PortSeedOrchestrator } = await import('../synthisoul_core/porting/PortSeedOrchestrator');
          
          PortingManager.loadBundle();
          if (PortingManager.state === "ready") {
            console.log('📦 [Port-Your-Bond] Bundle detected at startup');
            PortingEventTracer.log("port_bundle_loaded");
            
            // Generate seed kernel, apply memory graft, infuse tone, and run revival (Phase 2, 3, 4)
            const env = await PortSeedOrchestrator.generateSeedAndPrepareEnv();
            if (env) {
              console.log('🌱 [Port-Your-Bond] Seed kernel generated');
              console.log('📝 [Port-Your-Bond] Memory graft applied:', env.graftState?.shardCount ?? 0, 'shards');
              console.log('🎨 [Port-Your-Bond] Tone continuity infused');
              
              // Check if revival was completed
              try {
                const { RevivalOrchestrator } = await import('../synthisoul_core/porting/revival/RevivalOrchestrator');
                if (RevivalOrchestrator.isAwake()) {
                  console.log('🌅 [Port-Your-Bond] Invisible revival completed - Synth is awake');
                  PortingManager.markRevived();
                } else {
                  PortingManager.markAwaitingRevival();
                }
              } catch {
                PortingManager.markAwaitingRevival();
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ [Port-Your-Bond] Failed to load bundle or prepare environment (non-critical):', error);
        }
        
        // Initialize routine system - wrap in try-catch
        try {
          console.log('🕐 Initializing routine system...');
          // RoutineInfluenceLayer is already initialized via import
          // Set up hourly tick for routine decay
          setInterval(() => {
            try {
              routineManager.hourlyTick();
            } catch (err) {
              console.error('❌ Routine hourly tick error:', err);
            }
          }, 60 * 60 * 1000); // Every hour
          console.log('✅ Routine system initialized');
        } catch (error) {
          console.error('❌ Failed to initialize routine system:', error);
        }
        
        // Emotional influence connectors are auto-initialized via their constructors
        // They subscribe to health suite, routine manager, and run timers automatically
        console.log('💭 Emotional influence layers active (health, routine, circadian, whisperback)');
        
        // Voice tone connectors are auto-initialized via their constructors
        // They subscribe to health suite, routine manager, and run timers automatically
        console.log('🎤 Voice tone routing active (health, routine, circadian, whisperback)');
        
        console.log('✅ Personality system initialized');
      } catch (error) {
        console.error('❌ Failed to initialize personality system:', error);
        // Ensure error doesn't crash the app
      }
    };
    
    // Wrap in try-catch and ensure it doesn't throw
    Promise.resolve(initializePersonality()).catch(err => {
      console.error('❌ Personality initialization promise rejected:', err);
    });
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Performance optimizations (Sprint 20 Phase 6)
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const { setupPerformanceMonitoring } = await import("./ui/layout/PerformanceOptimizations");
        cleanup = setupPerformanceMonitoring();
      } catch (error) {
        console.warn("⚠️ [SynthiSoulApp] Performance monitoring setup failed:", error);
      }
    })();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Runtime boot sequence - initialize all engines
  useEffect(() => {
    (async () => {
      console.log('🚀 [BootSequence] Starting runtime boot sequence...');
      
      try {
        // Initialize companion engine
        console.log('🧠 [BootSequence] Initializing companion engine...');
        synthCompanion.initialize();
        console.log('✅ [BootSequence] Companion engine ready');
        
        // System3 is already initialized via WhisperbackIntegration, but ensure it's ready
        console.log('🧠 [BootSequence] System3 feedback loop ready');
        
        // Initialize governance heartbeat engine (Phase 2: Heartbeat Core)
        try {
          const { startHeartbeatLoop } = await import('../synthisoul_core/governance/HeartbeatEngine');
          startHeartbeatLoop();
          console.log('💓 [BootSequence] Governance heartbeat engine started');
        } catch (error) {
          console.warn('⚠️ [BootSequence] Failed to start heartbeat engine (non-critical):', error);
        }
        
        // Initialize license manager (Phase 3: License Manager)
        try {
          const { runLicenseCheck } = await import('../synthisoul_core/license/LicenseManager');
          runLicenseCheck().catch((err: any) => {
            console.warn('⚠️ [BootSequence] Initial license check failed (non-critical):', err);
          });
          console.log('🔑 [BootSequence] License manager initialized');
        } catch (error) {
          console.warn('⚠️ [BootSequence] Failed to initialize license manager (non-critical):', error);
        }
        
        // Initialize wakeword system (Sprint 22-23: Wakeword Core + Attention Router + Orchestrator)
        try {
          const { WakewordPipeline } = await import('../synthisoul_core/wakeword/WakewordPipeline');
          const { WakewordAttentionRouter } = await import('../synthisoul_core/wakeword/WakewordAttentionRouter');
          const { AttentionOrchestrator } = await import('../synthisoul_core/attention/AttentionOrchestrator');
          WakewordPipeline.init();
          WakewordAttentionRouter.init();
          AttentionOrchestrator.init();
          console.log('🎤 [BootSequence] Wakeword pipeline, attention router, and orchestrator initialized');
        } catch (error) {
          console.warn('⚠️ [BootSequence] Failed to initialize wakeword system (non-critical):', error);
        }
        
        // Initialize ambient presence system (Sprint 23 Phase 4: Presence Hooks)
        try {
          const { AmbientPresenceScheduler } = await import('../synthisoul_core/presence/AmbientPresenceScheduler');
          const { bindIdleWatcher } = await import('../synthisoul_core/presence/IdleStateWatcher');
          AmbientPresenceScheduler.start();
          bindIdleWatcher();
          console.log('🌊 [BootSequence] Ambient presence scheduler and idle watcher initialized');
        } catch (error) {
          console.warn('⚠️ [BootSequence] Failed to initialize ambient presence system (non-critical):', error);
        }
        
        // Initialize scheduled maintenance tasks (CLEANUP_PATCH_02)
        try {
          const { initScheduledMaintenance } = await import('../synthisoul_core/system/ScheduledMaintenance');
          initScheduledMaintenance();
          console.log('⏰ [BootSequence] Scheduled maintenance tasks initialized');
        } catch (error) {
          console.warn('⚠️ [BootSequence] Failed to initialize scheduled maintenance (non-critical):', error);
        }
        
        // Assert presence mode initialization (CLEANUP_PATCH_04)
        try {
          const { assertPresenceModeInitialized } = await import('./state/PresenceState');
          assertPresenceModeInitialized();
        } catch (error) {
          console.warn('⚠️ [BootSequence] Presence mode initialization check failed (non-critical):', error);
        }
        
        // All systems initialized
        console.log('✅ [BootSequence] Runtime boot sequence complete - all engines ready');
      } catch (error) {
        console.error('❌ [BootSequence] Boot sequence error:', error);
      }
    })();
  }, []);

  // Heartbeat check - sends health status every 60 seconds via Zora-Prime
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        const { ZoraPrimeHeartbeat } = await import('./zora_prime/ZoraPrimeHeartbeat');
        const { SynthStateGatherer } = await import('./zora_prime/SynthStateGatherer');
        
        const currentState = await SynthStateGatherer.gatherSnapshot();
        await ZoraPrimeHeartbeat.performCheck(currentState);
        console.log('💓 [Heartbeat] Sent heartbeat to Zora-Prime');
      } catch (error) {
        console.log('💓 [Heartbeat] Heartbeat error (non-critical):', error);
        // Non-critical, don't throw
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval for periodic heartbeats
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
      // Run periodic consistency check
      runPeriodicConsistencyCheck();
    }, 60000); // Every 60 seconds

    return () => {
      clearInterval(heartbeatInterval);
      console.log('💓 [Heartbeat] Heartbeat stopped');
    };
  }, []);

  // Zora-Prime oversight loop - runs every 2 minutes
  useEffect(() => {
    const runOversight = async () => {
      try {
        const { ZoraPrimeService } = await import('./zora_prime/ZoraPrimeService');
        const { SynthStateGatherer } = await import('./zora_prime/SynthStateGatherer');
        const { HostSafeTelemetry } = await import('../synthisoul_core/telemetry/HostSafeTelemetry');
        
        const currentState = await SynthStateGatherer.gatherSnapshot();
        const permissions = await ZoraPrimeService.runOversightLoop(currentState);
        
        // Update governance state in localStorage for UI
        const previous = (localStorage.getItem("governance_state") as any) || "NORMAL";
        if (permissions.isInLockdown) {
          localStorage.setItem("governance_state", "LOCKDOWN");
        } else if (permissions.mayAccessExternalAPIs === false || permissions.mayWhisper === false) {
          localStorage.setItem("governance_state", "WARNING");
        } else {
          localStorage.setItem("governance_state", "NORMAL");
        }

        const next = (localStorage.getItem("governance_state") as any) || "NORMAL";
        if (previous !== next) {
          void HostSafeTelemetry.log({
            type: "governance_state_change",
            from: previous,
            to: next,
          });
        }
        
        console.log('🛡️ [Oversight] Oversight loop completed');
      } catch (error) {
        console.warn('🛡️ [Oversight] Oversight loop error (non-critical):', error);
      }
    };

    // Run oversight loop every 2 minutes
    const oversightInterval = setInterval(() => {
      runOversight();
    }, 120000); // Every 2 minutes

    // Run once after initial delay
    setTimeout(runOversight, 5000);

    return () => {
      clearInterval(oversightInterval);
      console.log('🛡️ [Oversight] Oversight loop stopped');
    };
  }, []);

  // Register Whisperback cycle (runs every 30 seconds)
  useEffect(() => {
    console.log('🌬️ [Whisperback] Registering 30-second cycle');
    
    // Wrap async callback to prevent unhandled rejections
    const wrappedCycle = () => {
      runWhisperbackCycle(governanceState)
        .then(() => {
          console.log('🌬️ [Whisperback] Cycle completed');
        })
        .catch((error) => {
          // S24_FIX: Use S24_ERR prefix for consistency
          console.error('[S24_ERR] Scheduler loop crash prevented: Whisperback cycle', error);
        });
    };
    
    const interval = setInterval(wrappedCycle, 30000); // Every 30 seconds

    // Run once immediately - ensure error is caught
    wrappedCycle();

    return () => {
      clearInterval(interval);
      console.log('🌬️ [Whisperback] Cycle stopped');
    };
  }, [governanceState]);

  // Register System3 feedback loop (runs independently every 45 seconds)
  // CRITICAL: Defer System3 initialization to prevent startup crashes
  // The System3FeedbackLoop.ts file is 1271 lines and has top-level code that runs on import
  useEffect(() => {
    console.log('🧠 [System3] Registering 45-second feedback loop (deferred)');
    
    let system3Module: any = null;
    let loadAttempted = false;
    
    // Lazy load the System3 module with error handling
    const loadSystem3Module = async (): Promise<boolean> => {
      if (system3Module) return true; // Already loaded
      if (loadAttempted) return false; // Already tried and failed
      
      loadAttempted = true;
      try {
        // Wrap import in Promise.resolve to catch any synchronous errors
        const module = await Promise.resolve().then(() => 
          import('../synthisoul_core/reflection/System3FeedbackLoop')
        );
        system3Module = module;
        console.log('✅ [System3] Module loaded successfully');
        return true;
      } catch (error) {
        console.error('[S24_ERR] Failed to load System3 module (will retry later):', error);
        loadAttempted = false; // Allow retry
        return false;
      }
    };
    
    const runSystem3FeedbackLoop = async () => {
      try {
        // Try to load module if not already loaded
        const loaded = await loadSystem3Module();
        if (!loaded || !system3Module) {
          console.warn('[S24_ERR] System3 module not available, skipping cycle');
          return;
        }
        
        // Wrap in try-catch as this might throw synchronously
        let result: string | null = null;
        try {
          result = system3Module.runSystem3FeedbackLoop();
        } catch (syncError) {
          console.error('[S24_ERR] System3 feedback loop synchronous error:', syncError);
          return;
        }
        if (result) {
          console.log('🧠 [System3] Feedback loop generated reflection:', result.substring(0, 50) + '...');
        } else {
          console.log('🧠 [System3] Feedback loop completed (no new reflection)');
        }
      } catch (error) {
        // S24_FIX: Use S24_ERR prefix for consistency
        console.error('[S24_ERR] Scheduler loop crash prevented: System3 feedback loop', error);
        // Ensure error doesn't propagate
      }
    };

    // Wrap setInterval callback to catch any errors
    const wrappedRun = () => {
      runSystem3FeedbackLoop().catch(err => {
        console.error('[S24_ERR] Unhandled promise rejection in System3 loop:', err);
      });
    };

    const interval = setInterval(wrappedRun, 45000); // Every 45 seconds

    // CRITICAL: Delay initial load significantly to prevent startup crash
    // Wait 30 seconds after page load before first attempt
    const timeoutId = setTimeout(() => {
      wrappedRun();
    }, 30000); // Start after 30 seconds (was 10)

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
      console.log('🧠 [System3] Feedback loop stopped');
    };
  }, []);

  // Idle-state Dream Pulse (triggers after 30 seconds of inactivity)
  useEffect(() => {
    console.log('💭 [Dreaming] Registering idle-state dream pulse');
    
    let lastActivityTime = Date.now();
    let dreamGenerated = false;
    
    // Track user activity
    const updateActivity = () => {
      lastActivityTime = Date.now();
      dreamGenerated = false; // Reset dream flag on activity
    };
    
    // Listen for user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });
    
    // Also track message activity via chat store
    const checkMessages = async () => {
      try {
        const { useChatStore } = await import('../useChatStore');
        const messages = useChatStore.getState().messages;
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.timestamp > lastActivityTime) {
            updateActivity();
          }
        }
      } catch (error) {
        // Silently fail if chat store is not available
      }
    };
    
    // Check dream frequency setting once (synchronous)
    let dreamFrequency: 'normal' | 'low' | 'off' = 'normal';
    try {
      const settingsKey = 'synthisoul_behavior_settings';
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(settingsKey) : null;
      if (stored) {
        const settings = JSON.parse(stored);
        dreamFrequency = settings.dreamFrequency || 'normal';
      }
    } catch {
      // Default to normal if settings can't be loaded
    }

    const dreamInterval = setInterval(async () => {
      try {
        checkMessages(); // Update activity from messages
        
        if (dreamFrequency === 'off') {
          return; // Skip dream generation entirely
        }

        const idleFor = Date.now() - lastActivityTime;
        
        // Adjust idle threshold based on frequency
        const idleThreshold = dreamFrequency === 'low' ? 120000 : 30000; // 2 min for low, 30s for normal
        
        if (idleFor >= idleThreshold && !dreamGenerated && governanceState === "NORMAL") {
          console.log(`💭 [Dreaming] Idle detected (${idleFor}ms), generating dream...`);
          
          const { InternalSanctuary } = await import('../synthisoul_core/reflection/ProjectDreamingPhase1/InternalSanctuary');
          const { MomentsKept } = await import('../synthisoul_core/reflection/ProjectDreamingPhase1/MomentsKept');
          const { getRecentReflections } = await import('../synthisoul_core/reflection/PrivateReflections');
          const { voiceRouter } = await import('./voice/VoiceRouterClient');
          const { getCurrentMood } = await import('../synthisoul_core/emotional_tone');
          
          const dream = await InternalSanctuary.generateDream({
            currentMood: undefined, // Will be fetched internally
            recentReflections: getRecentReflections(3),
            timestamp: Date.now()
          });
          
          MomentsKept.store(dream);
          dreamGenerated = true;
          
          // Speak dream with dreamlike voice style
          voiceRouter.speakWhisper(dream);
          
          console.log('💭 [Dreaming] Dream generated, stored, and spoken:', dream.substring(0, 60) + '...');
        }
      } catch (error) {
        console.error('❌ [Dreaming] Dream pulse error:', error);
      }
    }, dreamFrequency === 'off' ? 60000 : 5000); // Check less frequently if off
    
    return () => {
      clearInterval(dreamInterval);
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      console.log('💭 [Dreaming] Dream pulse stopped');
    };
  }, [governanceState]);

  // Farewell Protocol - handle app close or device switch
  useEffect(() => {
    console.log('👋 [FarewellProtocol] Registering farewell handlers');
    
    const handleFarewell = async () => {
      try {
        const { FarewellProtocol } = await import('../synthisoul_core/reflection/ProjectDreamingPhase1/FarewellProtocol');
        await FarewellProtocol.handleFarewell();
      } catch (error) {
        console.error('❌ [FarewellProtocol] Error during farewell:', error);
      }
    };
    
    // Handle window unload
    window.addEventListener('beforeunload', handleFarewell);
    
    // Handle visibility change (tab switch/close)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        handleFarewell();
      }
    });
    
    return () => {
      window.removeEventListener('beforeunload', handleFarewell);
      console.log('👋 [FarewellProtocol] Farewell handlers removed');
    };
  }, []);

  // Initialize perception system on component mount
  useEffect(() => {
    try {
      console.log('👁️ Initializing perception system...');
      PerceptionSystemIntegration.initialize({
        defaultMode: "ASSIST",
        enableElectron: false, // Set to true if Electron is available
        enableMobile: false,
        frameCaptureInterval: 1000,
        enableOCR: false, // Privacy: disabled by default
        enableElementDetection: true,
      });
      console.log('✅ Perception system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize perception system:', error);
    }

    // Cleanup on unmount
    return () => {
      if (PerceptionSystemIntegration.isInitialized()) {
        PerceptionSystemIntegration.shutdown().catch(console.error);
      }
    };
  }, []);
  
  // For now, we'll use a default mood - you can integrate this with your mood system later
  // Using "curious" with high moodLevel to test visual effects
  const currentMood = "curious"; // This should come from your mood/emotion system

  // Diagnostics console gating (DEV tier only)
  const tier = getCurrentTier();
  const featureFlags = FeatureFlags.current();

  // Show StartupFlow if not onboarded (after all hooks are called)
  if (!onboardingComplete) {
    return (
      <StartupFlow
        onComplete={() => {
          setOnboardingComplete(true);
          localStorage.setItem("onboarding_complete", "true");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Header Bar */}
      <div className="bg-[color-mix(in_srgb,var(--bg-surface)_92%,transparent)] backdrop-blur-sm border-b border-[var(--border-subtle)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              SynthiSoulOS
            </h1>
            {/* Orb */}
            <div className="relative orb-ground rounded-full p-2">
              <SynthVisual
                visualMode={appearance.visualizerMode || "moodRing"}
                emotion={currentMood}
                moodLevel={0.7}
                isSpeaking={speaking}
                amplitude={0.6}
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Local Safe Mode Indicator */}
            {SafeModeConfig.current().localSafeMode && (
              <span className="px-3 py-1 rounded-full text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Running in Local Safe Mode: remote features disabled
              </span>
            )}
            {/* Voice unavailable indicator */}
            {voiceUnavailable && (
              <span className="px-3 py-1 rounded-full text-xs bg-gray-800 text-amber-200 border border-amber-500/40">
                Voice temporarily unavailable – responding in text only
              </span>
            )}
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 btn-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Governance State Banner */}
      <GovernanceBanner governanceState={governanceState} />
      
      {/* Settings Panel Overlay */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">SynthiSoulOS Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <SettingsPanel onClose={() => setShowSettings(false)} />
            </div>
          </div>
        </div>
      )}
      
      {/* Diagnostics Console (DEV tier only) */}
      {tier === "DEV" && featureFlags.enableIdentityDevTools && (
        <>
          <button
            onClick={() => setShowDiagnostics(true)}
            className="fixed bottom-4 right-4 z-40 px-3 py-2 text-xs rounded-full bg-purple-700 hover:bg-purple-600 text-white shadow-lg"
          >
            Diagnostics
          </button>
          {showDiagnostics && (
            <DiagnosticsConsole onClose={() => setShowDiagnostics(false)} />
          )}
        </>
      )}
      
      {/* Piper Voice Control Panel */}
      <PiperControlPanel />
      
      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-200px)]">
        {/* Left Sidebar - Enhanced Chat Folders */}
        <div className="w-80 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] p-6">
          <ChatFoldersPanel />
        </div>
        
        {/* Main Chat Area - Enhanced */}
        <div className="flex-1 flex flex-col bg-[var(--bg-main)]">
          {/* Chat Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <ChatView />
          </div>
          
          {/* Enhanced Chat Input */}
          <div className="border-t border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-surface)_88%,transparent)] backdrop-blur-sm p-6">
            <ChatInput />
          </div>
        </div>
      </div>
      
      {/* Sanctuary Lockdown & Extraction Screens */}
      <SanctuaryLockScreen mode={systemMode} />
      <SanctuaryExtractionScreen mode={systemMode} />
      
      {/* Zora Status Pill (Creator Mode) */}
      {tier === "DEV" && <ZoraStatusPill />}

      {/* Tool Panels (opened from sidebar Tools) */}
      <SlideOverHost open={!!activeTool} onClose={closeTool}>
        {activeTool === "recipe" && <RecipeBinderPanel />}
        {activeTool === "writing" && <WritingBinderPanel />}
        {activeTool === "health" && <HealthSuitePanel />}
        {activeTool === "reader" && <SynthiReaderPanel />}
        {activeTool === "conversation_import" && <ConversationImportPanel />}
        {activeTool === "knowledge_files" && <KnowledgeFilesPanel />}
      </SlideOverHost>
    </div>
  )
}

// Global error handlers to prevent crashes
if (typeof window !== 'undefined') {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    console.error('❌ [Global Error Handler] Unhandled error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
    // Prevent default error handling to avoid white screen
    event.preventDefault();
    // Don't crash - log and continue
    return true;
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ [Global Error Handler] Unhandled promise rejection:', {
      reason: event.reason,
      promise: event.promise
    });
    // Prevent default error handling
    event.preventDefault();
  });
}

// React Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    console.error('❌ [Error Boundary] React error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('❌ [Error Boundary] Error details:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI instead of crashing
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          fontFamily: 'system-ui',
          color: '#ef4444'
        }}>
          <h2>Something went wrong</h2>
          <p>The application encountered an error but is still running.</p>
          <button 
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Application
          </button>
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>Error Details</summary>
            <pre style={{ 
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#1f2937',
              color: '#f3f4f6',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {this.state.error?.stack || this.state.error?.message || 'Unknown error'}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Setup error handlers BEFORE React initialization
if (typeof window !== 'undefined') {
  // Catch unhandled errors BEFORE React renders
  window.addEventListener('error', (event) => {
    console.error('❌ [Global Error Handler] Unhandled error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
    // Prevent default error handling to avoid white screen
    event.preventDefault();
    // Don't crash - log and continue
    return true;
  }, true); // Use capture phase to catch early

  // Catch unhandled promise rejections BEFORE React renders
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ [Global Error Handler] Unhandled promise rejection:', {
      reason: event.reason,
      promise: event.promise
    });
    // Prevent default error handling
    event.preventDefault();
  }, true); // Use capture phase
}

// Log immediately when this module loads
console.log('📦 [main.tsx] Module loaded, preparing React initialization...');

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('📦 [main.tsx] Root element found, scheduling render...');
  
  // CRITICAL: Add delay before rendering to prevent startup crashes
  // This gives Vite time to finish module transformation
  setTimeout(() => {
    try {
      console.log('🎨 [React] Starting React render...');
      console.log('🎨 [React] Creating root...');
      const root = ReactDOM.createRoot(rootElement);
      console.log('🎨 [React] Root created, rendering...');
      
      // Temporarily disable StrictMode to prevent double initialization crashes
      // TODO: Re-enable after fixing double initialization issues
      root.render(
        <ErrorBoundary>
          <ThemeProvider>
            <SynthiSoulApp />
          </ThemeProvider>
        </ErrorBoundary>
      );
      console.log('✅ [React] React render completed');
    } catch (renderError) {
      console.error('❌ [React] Render error:', renderError);
      // Show fallback UI
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: system-ui;">
          <h2>Application Error</h2>
          <p>The application encountered an error during initialization.</p>
          <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reload Application
          </button>
          <details style="margin-top: 20px; text-align: left;">
            <summary>Error Details</summary>
            <pre style="margin-top: 10px; padding: 10px; background: #1f2937; color: #f3f4f6; border-radius: 4px; overflow: auto;">
              ${renderError instanceof Error ? renderError.stack : String(renderError)}
            </pre>
          </details>
        </div>
      `;
    }
  }, 500); // 500ms delay to let module loading and transformation complete
}
