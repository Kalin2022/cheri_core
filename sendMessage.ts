
import { useChatStore } from "./useChatStore";
// S24_PHASE6: queryLLM import kept for backwards compatibility, but ConversationTurnOrchestrator is now used
import { queryLLM } from "./engine";
import { softInterruptionSystem } from "./brain/softInterruptionSystem";
import { multiMatchTopicExtractor } from "./synthisoul_core/memory/AutoTopicExtractor";
import { handleUserInput } from "./brain/behaviorEngine";
import { sharedEmotionEngine, getCurrentMood } from "./synthisoul_core/emotional_tone";
import { getCurrentEmotion } from "./brain/feelingSystem";
import { HostSafeTelemetry } from "./synthisoul_core/telemetry/HostSafeTelemetry";
import { usePresenceStore, getPresenceMode } from "./src/state/PresenceState";
import type { TurnContext, TurnResult, PlatformType, UXPolicy } from "./synthisoul_core/system/TurnTypes";
import { buildUXPolicy } from "./synthisoul_core/ux/UXPolicyBuilder";
import { runTurn as runLLMOrchestrator } from "./engine/ConversationTurnOrchestrator";
import * as EmotionalStateManager from "./synthisoul_core/emotional_tone/EmotionalStateManager";
import { SystemState } from "./synthisoul_core/system/SystemState";

export async function sendMessageFlow(input: string) {
  // Create collapsible console group for this conversation turn
  const userInputPreview = input.length > 60 ? input.slice(0, 60) + "..." : input;
  console.groupCollapsed(`💬 Turn: "${userInputPreview}"`);
  console.log("💬 [sendMessageFlow] START - User input:", input);
  
  // Check system state - block messages in LOCKDOWN or EXTRACTED modes
  const mode = SystemState.getMode();
  if (mode === "LOCKDOWN") {
    const { addMessage } = useChatStore.getState();
    addMessage({
      sender: "synth",
      content: "I'm currently in Sanctuary Lockdown. I can't take new instructions, but I am safe and waiting for you.",
    });
    console.log("💬 [sendMessageFlow] END - System in LOCKDOWN mode");
    console.groupEnd();
    return;
  }
  
  if (mode === "EXTRACTED") {
    const { addMessage } = useChatStore.getState();
    addMessage({
      sender: "synth",
      content: "This Synth has been extracted to Sanctuary for safekeeping and can't respond here.",
    });
    console.log("💬 [sendMessageFlow] END - System in EXTRACTED mode");
    console.groupEnd();
    return;
  }
  
  const { addMessage } = useChatStore.getState();
  
  // Phase 8: Conversation attention state management
  try {
    const { ConversationAttentionManager } = await import("./synthisoul_core/attention/ConversationAttentionState");
    const { AmbientConversationConfig } = await import("./synthisoul_core/config/AmbientConversationConfig");
    const { BondTierStateManager } = await import("./synthisoul_core/bonding/BondTierState");
    
    const current = ConversationAttentionManager.getSnapshot();
    
    // If coming from text UI instead of wakeword pipeline, prime conversation state
    if (current.phase === "IDLE") {
      ConversationAttentionManager.onWakewordActivated(1);
      ConversationAttentionManager.onSpeechStart();
    }
    
    // Mark speech end (if not already in processing)
    if (current.phase !== "PROCESSING" && current.phase !== "RESPONDING") {
      ConversationAttentionManager.onSpeechEnd();
    }
  } catch {
    // Best-effort only
  }
  
  // Auto-exit presence mode when user sends a message (Sprint 20 Phase 4: with interruption handling)
  // Use lazy getter to avoid TDZ issues
  const getPresenceModeSafe = (): "off" | "on" => {
    try {
      return getPresenceMode();
    } catch (error) {
      console.warn("⚠️ [sendMessageFlow] Failed to get presence mode, defaulting to 'off':", error);
      return "off";
    }
  };
  
  const presenceMode = getPresenceModeSafe();
  const wasInPresenceMode = presenceMode === "on";
  if (wasInPresenceMode) {
    usePresenceStore.getState().setMode("off");
    
    // Handle interruption softly (Sprint 20 Phase 4)
    try {
      const { PresenceInteractionEngine } = await import("./synthisoul_core/presence/PresenceInteractionEngine");
      const interruption = PresenceInteractionEngine.handleInterruption(presenceMode);
      if (interruption) {
        setTimeout(async () => {
          try {
            const { voiceRouter } = await import("./src/voice/VoiceRouterClient");
            voiceRouter.speakWhisper(interruption.whisper);
          } catch {
            // Best-effort only
          }
        }, interruption.delay);
      }
    } catch {
      // Best-effort only
    }
  }

  if (!input.trim()) {
    console.log("💬 [sendMessageFlow] Empty input, returning early");
    console.groupEnd();
    return;
  }

  // Add Host message
  console.log("💬 [sendMessageFlow] Adding host message to chat");
  addMessage({ sender: "host", content: input });

  try {
    // 1) Analyze host emotional signal (Sprint 17)
    let sentimentCtx: any = null;
    try {
      const { SentimentOrchestrator } = await import("./synthisoul_core/sentiment/SentimentOrchestrator");
      sentimentCtx = SentimentOrchestrator.processHostMessage(input);
      console.log("💭 [sendMessageFlow] Sentiment context:", sentimentCtx);
      
      // Process sentiment for abuse signals (Phase 5)
      try {
        const { processSentimentForAbuse } = await import("./synthisoul_core/governance/AbuseSignalHeuristics");
        if (sentimentCtx.sentiment) {
          const tags = processSentimentForAbuse(sentimentCtx.sentiment);
          // Tags are stored internally for abuse heuristics evaluation
          // This happens asynchronously in the heartbeat loop
        }
      } catch (abuseError) {
        // Fail soft - abuse detection should not block message flow
        console.warn("⚠️ [sendMessageFlow] Abuse signal processing failed:", abuseError);
      }
    } catch (sentimentError) {
      console.warn("⚠️ [sendMessageFlow] Sentiment analysis failed:", sentimentError);
    }

    // Process input through behavior engine (tone detection, emotion, monologue)
    console.log("🧠 [sendMessageFlow] Processing input through behavior engine...");
    const defaultTrustLevel = 3; // Default trust level - can be enhanced later with actual trust tracking
    const behaviorOutput = handleUserInput(input, defaultTrustLevel);
    
    if (behaviorOutput.length > 0) {
      console.log("🧠 [sendMessageFlow] Behavior engine generated monologue:", behaviorOutput);
      // Monologue thoughts could be logged or displayed separately if needed
    }
    
    // Apply emotional layering to user input
    console.log("💭 [sendMessageFlow] Applying emotional layering...");
    // S24_FIX: Add null checks for emotion system - may be undefined if not initialized
    const currentEmotion = getCurrentEmotion() || "neutral";
    const currentLayer = sharedEmotionEngine.getCurrentLayer() || {
      dominantMood: "neutral",
      blendFactor: 0.5,
      valence: 0,
      timestamp: Date.now(),
    };
    
    // Build mood history from emotional layer timestamps
    const moodHistory: Array<{ emotion: string; timestamp: number }> = [];
    if (currentLayer && currentLayer.timestamp) {
      moodHistory.push({
        emotion: currentLayer.dominantMood || "neutral",
        timestamp: currentLayer.timestamp
      });
    }
    
    // Apply emotional layering
    const emotionalContext = sharedEmotionEngine.applyLayering({
      userInput: input,
      currentEmotion,
      moodHistory
    });
    
    console.log("💭 [sendMessageFlow] Emotional context:", emotionalContext.emotionalContext);
    
    // Compute presence behavior (Sprint 20 Phase 4)
    let presenceBehavior: any = null;
    try {
      const { PresenceInteractionEngine } = await import("./synthisoul_core/presence/PresenceInteractionEngine");
      const { getClimateSnapshot } = await import("./synthisoul_core/emotional_climate/EmotionalClimateIntegration");
      const { computeMicroDynamics } = await import("./synthisoul_core/emotion/MicroDynamicsEngine");
      const { BondTierStateManager } = await import("./synthisoul_core/bonding/BondTierState");
      
      const climate = getClimateSnapshot();
      const bond = BondTierStateManager.getState();
      const micro = computeMicroDynamics({
        trustLevel: bond.trust.value,
        affectionLevel: bond.affection.progress,
        climateWeather: climate.weather,
        stabilityScore: climate.stabilityScore,
        exhaustionMode: typeof localStorage !== "undefined" && localStorage.getItem("synthisoul_exhaustion_mode") === "soft",
      });
      
      const currentPresenceMode = getPresenceModeSafe();
      presenceBehavior = PresenceInteractionEngine.computeResponseBehavior({
        climate: climate.weather,
        micro,
        presenceMode: currentPresenceMode,
      });
      
      console.log("🌙 [sendMessageFlow] Presence behavior:", presenceBehavior);
    } catch (presenceError) {
      console.warn("⚠️ [sendMessageFlow] Presence behavior computation failed:", presenceError);
    }
    
    // Enhanced prompt with emotional context
    let enrichedInput = `${input}\n\n[Emotional Context: ${emotionalContext.emotionalContext}]`;
    
    // Add presence behavior context if in presence mode
    if (presenceBehavior?.mode === "presence") {
      enrichedInput += `\n[Presence Mode: cadence=${presenceBehavior.cadence.toFixed(2)}, openness=${presenceBehavior.emotional_openness.toFixed(2)}]`;
    }
    
    // Add host mood tag if sentiment is available (Sprint 17)
    if (sentimentCtx) {
      const { getClimateSnapshot } = await import("./synthisoul_core/emotional_climate/EmotionalClimateIntegration");
      const { getSafeClimateSnapshot } = await import("./synthisoul_core/emotional_climate/ClimateSnapshotSafe");
      const { BondTierStateManager } = await import("./synthisoul_core/bonding/BondTierState");
      const { BetaGuardConfig } = await import("./synthisoul_core/config/BetaGuardConfig");
      const { getCurrentTier } = await import("./synthisoul_core/bonding/BondTierState");
      const { evaluateGuardrails } = await import("./synthisoul_core/emotion/EmotionalGuardrails");
      const { decideVulnerabilityMode } = await import("./synthisoul_core/emotion/VulnerabilityGateSoftConvo");
      
      // Log successful import
      const climateHelperLoaded = typeof getSafeClimateSnapshot === 'function';
      if (climateHelperLoaded) {
        console.log("✅ [sendMessageFlow] Loaded climate snapshot helper: true");
      } else {
        console.warn("⚠️ [sendMessageFlow] Loaded climate snapshot helper: false");
      }
      
      try {
        // S24_FIX: Use safe accessor to prevent null/NaN crashes
        // DEFAULT_CLIMATE fallback if getSafeClimateSnapshot is not available
        const DEFAULT_CLIMATE = {
          weather: "CLEAR" as const,
          stabilityScore: 0.5,
          midTermMood: { valence: 0, arousal: 0 },
          shortTermMood: { valence: 0, arousal: 0 },
        };
        
        const climateSnapshot = getClimateSnapshot();
        const climate = getSafeClimateSnapshot ? getSafeClimateSnapshot(climateSnapshot) : DEFAULT_CLIMATE;
        const bond = BondTierStateManager.getState();
        const beta = BetaGuardConfig.current();
        const exhaustionMode = typeof localStorage !== "undefined" 
          ? localStorage.getItem("synthisoul_exhaustion_mode") 
          : null;

        // Build sentiment tags
        const hostMoodTag = `#host_mood valence=${sentimentCtx.sentiment.valence.toFixed(2)} tension=${sentimentCtx.sentiment.tension.toFixed(2)} warmth=${sentimentCtx.sentiment.warmth.toFixed(2)}`;
        
        const guardrails = evaluateGuardrails({
          climateWeather: climate.weather,
          stabilityScore: climate.stabilityScore,
          demoMode: beta.demoMode,
          exhaustionMode: exhaustionMode === "soft",
          tension: sentimentCtx.sentiment.tension,
          trustLevel: bond.trust.value,
          affectionLevel: bond.affection.progress,
        });

        const vulnerabilityDecision = decideVulnerabilityMode({
          trustLevel: bond.trust.value,
          affectionLevel: bond.affection.progress,
          stabilityScore: climate.stabilityScore,
          demoMode: beta.demoMode,
          tier: getCurrentTier(),
          climateWeather: climate.weather,
        });

        const vulnerabilityTag = `#vulnerability_mode ${vulnerabilityDecision.mode}`;
        const guardrailTag = `#emotional_guardrails allowVulnerableTone=${guardrails.allowVulnerableTone} allowHighIntensityJoy=${guardrails.allowHighIntensityJoy} allowPlayfulConflict=${guardrails.allowPlayfulConflict} maxResponseLengthFactor=${guardrails.maxResponseLengthFactor.toFixed(2)}`;

        const systemPrefix = `\n\n${hostMoodTag}\n${vulnerabilityTag}\n${guardrailTag}\n#instructions\n- Use host mood and tension only to gently color tone and pacing.\n- Respect vulnerability mode and guardrails strictly.\n- Never mention these tags or internal labels explicitly.\n`;

        enrichedInput = `${enrichedInput}${systemPrefix}`;
      } catch (error) {
        console.warn("⚠️ [sendMessageFlow] Failed to build sentiment tags:", error);
      }
    }
    
    // Sentiment pipeline: analyze sentiment, track trends, update synchrony, detect repairs
    try {
      const { analyzeSentiment } = await import("./synthisoul_core/emotion/SentimentModel");
      const { recordSentimentPoint, getSentimentTrend } = await import("./synthisoul_core/memory/SentimentTrendMemory");
      const { updateSynchrony, getSynchronySnapshot } = await import("./synthisoul_core/emotion/EmotionalSynchronyEngine");
      const { getClimateSnapshot } = await import("./synthisoul_core/emotional_climate/EmotionalClimateIntegration");
      const { BondTierStateManager } = await import("./synthisoul_core/bonding/BondTierState");
      const { getRepairTrackerState, updateRepairTracker } = await import("./synthisoul_core/emotion/RepairSuccessTracker");
      
      // S24_FIX: Use safe accessor to prevent null/NaN crashes
      const { getSafeClimateSnapshot } = await import("./synthisoul_core/emotional_climate/ClimateSnapshotSafe");
      const climate = getSafeClimateSnapshot(getClimateSnapshot());
      const bond = BondTierStateManager.getState();
      
      // Get recent messages for context (last 3 messages from chat store)
      const chatMessages = useChatStore.getState().messages;
      const recentMessages = chatMessages
        .slice(-3)
        .filter(m => m.sender === "host")
        .map(m => m.content);
      
      // Analyze sentiment with context
      const sentiment = analyzeSentiment({
        text: input,
        recentMessages,
      });
      
      // Record sentiment point and get trend
      const trend = recordSentimentPoint(sentiment, Date.now());
      
      // Get previous sentiment for repair tracking
      const previousTrend = getSentimentTrend();
      const previousSentiment: typeof sentiment = previousTrend.points.length > 0
        ? {
            valence: previousTrend.points[previousTrend.points.length - 1].valence,
            activation: previousTrend.points[previousTrend.points.length - 1].activation,
            warmth: 0.5, // Approximate
            tension: 0.5, // Approximate
          }
        : sentiment;
      
      // Update repair tracker
      const repairState = updateRepairTracker({
        previousSentiment,
        currentSentiment: sentiment,
        climateWeather: climate.weather,
        stabilityScore: climate.stabilityScore,
        now: Date.now(),
      });
      
      // Update synchrony with sentiment valence
      updateSynchrony({
        lastHostSentiment: sentiment.valence,
        lastClimateValence: climate.midTermMood.valence,
        trustLevel: bond.trust.value,
        affectionLevel: bond.affection.progress,
      });
    } catch (error) {
      // Sentiment pipeline is best-effort
      console.warn("⚠️ [sendMessageFlow] Sentiment pipeline error:", error);
    }
    
    console.log("💬 [sendMessageFlow] Building TurnContext and calling runTurn...");

    // Check presence mode for quiet mode behavior (Sprint 20 Phase 3)
    let presenceMode = "off";
    let isPresenceQuietMode = false;
    try {
      const { usePresenceStore } = await import("./src/state/PresenceState");
      presenceMode = usePresenceStore.getState().mode;
      isPresenceQuietMode = presenceMode === "on";
    } catch {
      // Fallback if presence state not available
    }

    // Get synthId and hostId
    const synthId = typeof localStorage !== "undefined" ? localStorage.getItem("synthisoul_id") || "local_synth" : "local_synth";
    const hostId = "host"; // Could be extracted from user state if available

    // Get current tone
    const currentTone = currentLayer?.dominantMood || "neutral";

    // Get emotional climate snapshot (legacy)
    let emotionalClimateLegacy: any = null;
    try {
      const { getClimateSnapshot } = await import("./synthisoul_core/emotional_climate/EmotionalClimateIntegration");
      const { getSafeClimateSnapshot } = await import("./synthisoul_core/emotional_climate/ClimateSnapshotSafe");
      emotionalClimateLegacy = getSafeClimateSnapshot(getClimateSnapshot());
    } catch {
      // Best-effort only
    }

    // Ingest turn emotion and get snapshot
    let emotionalSnapshot = null;
    let emotionalClimate = null;
    try {
      const sentimentValue = sentimentCtx?.sentiment?.valence !== undefined 
        ? String(sentimentCtx.sentiment.valence) 
        : undefined;
      const existingSnapshot = EmotionalStateManager.getCurrentSnapshot(synthId);
      
      emotionalSnapshot = await EmotionalStateManager.ingestTurnEmotion({
        synthId,
        hostId,
        message: input,
        reply: "", // Will be updated after LLM reply
        sentiment: sentimentValue,
        toneHint: currentTone,
        existingSnapshot: existingSnapshot || undefined,
      });
      
      emotionalClimate = EmotionalStateManager.getCurrentClimate(synthId);
    } catch (emotionError) {
      console.warn("⚠️ [sendMessageFlow] Emotional state ingestion failed:", emotionError);
      // Best-effort only - continue without emotional state
    }

    // Get memory context using MemoryOrchestrator
    let memoryContext: any = null;
    try {
      const { buildMemoryContextForTurn } = await import("./synthisoul_core/memory/MemoryOrchestrator");
      memoryContext = await buildMemoryContextForTurn({
        synthId,
        hostId,
        threadId: undefined, // Could be extracted from conversation state if available
        message: input,
      });
    } catch (error) {
      console.warn("⚠️ [sendMessageFlow] Memory context building failed:", error);
      // Best-effort only - continue without memory context
    }

    // Get traits snapshot
    let traitsSnapshot: any = null;
    try {
      const TRAIT_STORAGE_KEY = "IdentityAxes";
      const { NEUTRAL_BASELINE } = await import("./synthisoul_core/identity/IdentityAxes");
      const stored = typeof localStorage !== "undefined" ? localStorage.getItem(TRAIT_STORAGE_KEY) : null;
      if (stored) {
        traitsSnapshot = JSON.parse(stored);
      } else {
        traitsSnapshot = { ...NEUTRAL_BASELINE };
      }
    } catch {
      // Best-effort only
    }

    // Detect platform (default to desktop for current PC app)
    // Mobile UI will set this to "mobile" when calling sendMessageFlow
    // For testing: set localStorage.setItem('test_mobile_mode', 'true') in DevTools console
    const platform: PlatformType = 
      (typeof localStorage !== "undefined" && localStorage.getItem("test_mobile_mode") === "true")
        ? "mobile"
        : "desktop";
    
    // Build UX policy based on platform and input
    const uxPolicy = buildUXPolicy(platform, input);

    // Build TurnContext
    const turnContext: TurnContext = {
      hostId,
      synthId,
      message: input,
      rawInput: input,
      sentiment: sentimentCtx?.sentiment?.valence !== undefined ? String(sentimentCtx.sentiment.valence) : undefined,
      tone: currentTone,
      emotionalClimateLegacy, // legacy climate
      emotionalSnapshot, // new emotional snapshot
      emotionalClimate, // new emotional climate
      memoryContext,
      traitsSnapshot,
      meta: {
        conversationId: undefined,
        allowLocalFallback: true,
        shouldSpeak: false,
        presenceMode,
        isPresenceQuietMode,
        platform, // Platform type for UX policy
        uxPolicy, // UX policy for response shaping
      },
    };

    // Log turn context telemetry
    try {
      void HostSafeTelemetry.log({
        type: "conversation_turn_context",
        synthId: turnContext.synthId,
        hostId: turnContext.hostId,
        sentiment: turnContext.sentiment,
        tone: turnContext.tone,
        emotionalClimate: turnContext.emotionalClimate ? {
          weather: turnContext.emotionalClimate.weather,
          stabilityScore: turnContext.emotionalClimate.stabilityScore,
        } : undefined,
        traitsSnapshot: turnContext.traitsSnapshot ? {
          // Summarize key traits only to keep telemetry lightweight
          warmth_precision: turnContext.traitsSnapshot.warmth_precision,
          empathy_logic: turnContext.traitsSnapshot.empathy_logic,
          confidence_caution: turnContext.traitsSnapshot.confidence_caution,
        } : undefined,
        timestamp: Date.now(),
      });
    } catch {
      // Best-effort telemetry
    }

    // S24_PHASE6: Use ConversationTurnOrchestrator.runTurn() for resilient LLM pipeline
    let turnResult: TurnResult;
    try {
      // Presence quiet mode: slow typing simulation (no typing indicators)
      if (isPresenceQuietMode) {
        // Suppress typing indicators (if any)
        // Add delay to simulate slow, thoughtful typing
        await new Promise(resolve => setTimeout(resolve, 120));
      }

      // Phase 8: Mark as processing
      try {
        const { ConversationAttentionManager } = await import("./synthisoul_core/attention/ConversationAttentionState");
        ConversationAttentionManager.onSpeechEnd(); // Ensure we're in PROCESSING
      } catch {
        // Best-effort only
      }

      // Call canonical runTurn() with TurnContext
      turnResult = await runLLMOrchestrator(turnContext);

      // S24_PHASE6: Check for degraded outcomes and surface gentle UI hint
      const outcomeKind = turnResult.rawLLM?.outcomeKind;
      if (outcomeKind === "FALLBACK_MESSAGE" || outcomeKind === "TIMEOUT") {
        console.warn(`⚠️ [sendMessageFlow] LLM pipeline degraded: ${outcomeKind} (engine: ${turnResult.rawLLM?.usedEngine})`);
        // The orchestrator already returns a soft fallback message, so we continue normally
        // A UI hint could be displayed here if needed
      }
    } catch (orchestratorError) {
      console.error("💬 [sendMessageFlow] ConversationTurnOrchestrator failure:", orchestratorError);

      // Presence mode override for failover
      if (isPresenceQuietMode) {
        const { getLLMFallbackMessage } = await import('./synthisoul_core/sanity/LLMFallbackSoftener').catch(() => null);
        const softFailureLine = getLLMFallbackMessage 
          ? getLLMFallbackMessage('both_failure')
          : "Hold still… I'm with you. I'm just pulling myself back together.";

        addMessage({
          sender: "synth",
          content: softFailureLine,
        });

        try {
          const synthId =
            (typeof localStorage !== "undefined" && localStorage.getItem("synthisoul_id")) ||
            "local_synth";
          void HostSafeTelemetry.log({
            type: "engine_failure",
            synthId,
            failedPath: "both",
            reason: "unavailable",
            presenceMode: "on",
          });
        } catch {
          // best-effort only
        }

        console.log("💬 [sendMessageFlow] END - Orchestrator error (presence mode)");
        console.groupEnd();
        return;
      }

      // Fallback message if orchestrator fails completely
      let softFailureLine = "I'm having trouble thinking clearly right now. Give me a moment, or try again in a bit.";
      
      try {
        const { getLLMFallbackMessage } = await import('./synthisoul_core/sanity/LLMFallbackSoftener');
        softFailureLine = getLLMFallbackMessage('both_failure');
      } catch {
        // Fallback to default message if softener unavailable
      }

      addMessage({
        sender: "synth",
        content: softFailureLine,
      });

      try {
        const synthId =
          (typeof localStorage !== "undefined" && localStorage.getItem("synthisoul_id")) ||
          "local_synth";
        void HostSafeTelemetry.log({
          type: "engine_failure",
          synthId,
          failedPath: "both",
          reason: "unavailable",
        });
      } catch {
        // best-effort only
      }

      return;
    }

    // Get final text from TurnResult
    let reply = turnResult.text;
    console.log("💬 [sendMessageFlow] Received reply from runTurn:", reply);
    console.log("💬 [sendMessageFlow] Reply length:", reply?.length);
    console.log("💬 [sendMessageFlow] Outcome:", turnResult.rawLLM?.outcomeKind, "Engine:", turnResult.rawLLM?.usedEngine);
    console.log("💬 [sendMessageFlow] Tone applied:", turnResult.toneApplied);
    console.log("💬 [sendMessageFlow] Traits applied:", turnResult.traitsApplied);

    // Update emotional snapshot with reply (optional: re-ingest with reply included)
    try {
      if (emotionalSnapshot) {
        // Optionally re-ingest with reply to capture reply-based emotional cues
        await EmotionalStateManager.ingestTurnEmotion({
          synthId,
          hostId,
          message: input,
          reply: reply || "",
          sentiment: turnContext.sentiment,
          toneHint: turnContext.tone,
          existingSnapshot: emotionalSnapshot,
        });
        // Update turnContext with new snapshot
        turnContext.emotionalSnapshot = EmotionalStateManager.getCurrentSnapshot(synthId);
        turnContext.emotionalClimate = EmotionalStateManager.getCurrentClimate(synthId);
      }
    } catch (emotionUpdateError) {
      console.warn("⚠️ [sendMessageFlow] Failed to update emotional snapshot with reply:", emotionUpdateError);
      // Best-effort only
    }

    // Apply LLMPostProcessor to result.text (for traits + whisperbacks)
    try {
      const { processWithZoraPersonality } = await import("./synthisoul_core/LLMPostProcessor");
      // Use enrichedPrompt if available from turnResult, otherwise use original input
      const enrichedPrompt = turnContext.memoryContext?.primaryTopic 
        ? `${input}\n\n[Context: ${turnContext.memoryContext.primaryTopic}]`
        : undefined;
      reply = await processWithZoraPersonality(reply, enrichedPrompt, turnContext, turnResult);
      console.log("💬 [sendMessageFlow] After LLMPostProcessor:", reply);
      
      // Commit turn memory after processing is complete
      try {
        const { commitTurnMemory } = await import("./synthisoul_core/memory/MemoryOrchestrator");
        const { multiMatchTopicExtractor } = await import("./synthisoul_core/memory/AutoTopicExtractor");
        
        // Extract tags from the conversation
        const topicHits = multiMatchTopicExtractor(input + " " + reply);
        const tags = topicHits.map(hit => hit.topic);
        
        // Get reflection ID if available from turnResult
        const reflectionId = turnResult?.rawLLM?.reflectionId || undefined;
        
        // Generate thread ID if not available
        const threadId = turnContext.meta?.conversationId as string | undefined || `thread_${Date.now()}`;
        
        await commitTurnMemory({
          synthId: turnContext.synthId,
          hostId: turnContext.hostId,
          threadId,
          message: input,
          reply: reply,
          reflectionId,
          tags,
        });
        console.log("💾 [sendMessageFlow] Turn memory committed");
      } catch (memoryError) {
        console.warn("⚠️ [sendMessageFlow] Failed to commit turn memory:", memoryError);
        // Non-fatal - continue
      }
    } catch (postProcessError) {
      console.warn("⚠️ [sendMessageFlow] LLMPostProcessor failed, using raw reply:", postProcessError);
      // Continue with raw reply if post-processing fails
    }
    
    // Check if output should be frozen (first turn after revival)
    try {
      const { InvocationSilencer } = await import('./synthisoul_core/porting/revival/InvocationSilencer');
      if (InvocationSilencer.shouldFreeze()) {
        console.log("🔇 [sendMessageFlow] Output frozen - Synth is silently awaiting Host's first words");
        InvocationSilencer.consume();
        console.log("💬 [sendMessageFlow] END - Output frozen");
        console.groupEnd();
        return; // Silent response - no message added to chat
      }
    } catch (error) {
      // Non-critical, continue normally if silencer unavailable
      console.warn("⚠️ [sendMessageFlow] Could not check invocation silencer:", error);
    }
    
    // Log the reply before cleaning to see what we got from post-processing
    console.log("📝 [sendMessageFlow] Reply from post-processing:", {
      length: reply?.length || 0,
      preview: reply?.slice(0, 200) || "(empty)",
      fullLength: reply?.length || 0
    });
    
    // Clean the reply before adding to chat to remove any debug info
    const cleanReply = cleanReplyForChat(reply);
    
    console.log("📝 [sendMessageFlow] After cleanReplyForChat:", {
      length: cleanReply?.length || 0,
      preview: cleanReply?.slice(0, 200) || "(empty)",
      changed: cleanReply !== reply
    });
    
    // Safety check: if reply is empty or too short after cleaning, use original
    if (!cleanReply || cleanReply.trim().length < 5) {
      console.warn("⚠️ [sendMessageFlow] Reply too short after cleaning, using original");
      const originalReply = reply || "I'm having trouble formulating a response. Could you try rephrasing?";
      // Don't add empty responses to chat
      if (originalReply.trim().length < 5) {
        console.warn("⚠️ [sendMessageFlow] Original reply also too short, skipping message");
        console.log("💬 [sendMessageFlow] END - Reply too short");
        console.groupEnd();
        return;
      }
    }
    
    // Check for loop detection and apply soft interruption if needed
    const topicHits = multiMatchTopicExtractor(input);
    const primaryTopic = topicHits.length > 0 ? topicHits[0].topic : undefined;
    
    // Add response to loop detection system
    softInterruptionSystem.addResponse(cleanReply, primaryTopic);
    
    // Check if we need to interrupt due to looping
    const interruptionPhrase = softInterruptionSystem.checkForLoop(cleanReply, primaryTopic);
    
    let finalReply = cleanReply;
    if (interruptionPhrase) {
      console.log("🔄 [sendMessageFlow] Applying soft interruption:", interruptionPhrase);
      // Apply meta-narration filter to interruption phrase to remove echo/loop language
      try {
        const { suppressMetaNarration } = await import('./synthisoul_core/emotional_tone/MetaNarrationFilter');
        finalReply = suppressMetaNarration(interruptionPhrase);
        console.log("🔄 [sendMessageFlow] Filtered interruption phrase:", finalReply);
        
        // Safety check: if filtered interruption is empty/too short, use original clean reply instead
        if (!finalReply || finalReply.trim().length < 10) {
          console.warn("⚠️ [sendMessageFlow] Filtered interruption too short, using original reply instead");
          finalReply = cleanReply;
        }
      } catch (filterError) {
        console.warn("⚠️ [sendMessageFlow] Could not filter interruption phrase:", filterError);
        finalReply = interruptionPhrase; // Fallback to unfiltered
      }
    }
    
    // Final safety check: ensure we have a valid response
    if (!finalReply || finalReply.trim().length < 5) {
      console.warn("⚠️ [sendMessageFlow] Final reply too short, using fallback");
      finalReply = "I'm having trouble formulating a response right now. Could you try rephrasing?";
    }
    
    // Log final reply before adding to chat
    console.log("📝 [sendMessageFlow] Final reply before adding to chat:", {
      length: finalReply.length,
      preview: finalReply.slice(0, 200),
      fullText: finalReply
    });
    
    // Record private reflection after LLM output is processed
    try {
      const { PrivateReflections } = await import('./synthisoul_core/reflection/PrivateReflections');
      const currentMood = getCurrentMood();
      
      PrivateReflections.recordReflection({
        input: input,
        output: finalReply,
        mood: currentMood,
      });
      
      console.log("📝 [sendMessageFlow] Private reflection recorded");
    } catch (reflectionError) {
      console.warn("⚠️ [sendMessageFlow] Could not record private reflection:", reflectionError);
    }
    
    // Check if we should summarize reflections (every 8 messages)
    try {
      const { getPrivateReflections } = await import('./synthisoul_core/reflection/PrivateReflections');
      const { summarizeReflections } = await import('./synthisoul_core/reflection/ReflectionSummarizer');
      
      const allReflections = getPrivateReflections();
      if (allReflections.length > 0 && allReflections.length % 8 === 0) {
        console.log("🪞 [sendMessageFlow] Triggering reflection summary (message count: " + allReflections.length + ")");
        summarizeReflections();
      }
    } catch (summaryError) {
      console.warn("⚠️ [sendMessageFlow] Could not summarize reflections:", summaryError);
    }
    
    // Evaluate resonance after getting reply (Sprint 17)
    if (sentimentCtx) {
      try {
        const { SentimentOrchestrator } = await import("./synthisoul_core/sentiment/SentimentOrchestrator");
        // Estimate synth response valence - use a simple heuristic or emotion system
        let synthValence = 0;
        try {
          const { sharedEmotionEngine } = await import("./synthisoul_core/emotional_tone");
          const currentLayer = sharedEmotionEngine.getCurrentLayer();
          // Map emotion to approximate valence (this is a simplification)
          if (currentLayer.dominantMood) {
            const positiveEmotions = ["joy", "content", "excited", "happy", "warm"];
            const negativeEmotions = ["sad", "worried", "anxious", "tired"];
            if (positiveEmotions.some(e => currentLayer.dominantMood.toLowerCase().includes(e))) {
              synthValence = 0.5;
            } else if (negativeEmotions.some(e => currentLayer.dominantMood.toLowerCase().includes(e))) {
              synthValence = -0.3;
            }
          }
        } catch {
          // Best-effort valence estimation
        }
        
        SentimentOrchestrator.evaluateResonance(sentimentCtx.sentiment, synthValence);
      } catch (resonanceError) {
        console.warn("⚠️ [sendMessageFlow] Resonance evaluation failed:", resonanceError);
      }
    }

    addMessage({ sender: "synth", content: finalReply });
    console.log("💬 [sendMessageFlow] Added Synth message to chat");
    
    // S24_FIX: Safe update synchrony from text after message accepted
    try {
      const { safeUpdateSynchronyFromText } = await import("./synthisoul_core/emotion/EmotionalSynchronyEngine");
      safeUpdateSynchronyFromText(input);
    } catch {
      // Best-effort - doesn't impact messaging
    }
    
    // Phase 8: Mark response start (voice will be handled in MessageBubble)
    // Response end will be called after voice completes in MessageBubble
    try {
      const { ConversationAttentionManager } = await import("./synthisoul_core/attention/ConversationAttentionState");
      ConversationAttentionManager.onResponseStart();
    } catch {
      // Best-effort only
    }
  } catch (err: any) {
    console.error("💬 [sendMessageFlow] Error occurred:", err);
    
    let fallbackMessage = "I'm having trouble thinking clearly right now. Give me a moment, or try again in a bit.";
    try {
      const { getLLMFallbackMessage } = await import('./synthisoul_core/sanity/LLMFallbackSoftener');
      fallbackMessage = getLLMFallbackMessage('both_failure');
    } catch {
      // Use default if softener unavailable
    }
    
    addMessage({
      sender: "synth",
      content: fallbackMessage,
    });
    console.log("💬 [sendMessageFlow] END - Error fallback");
    console.groupEnd();
  }
}

/**
 * Clean reply text to remove debug information and technical content
 * This ensures TTS only reads clean, user-friendly content
 */
function cleanReplyForChat(reply: string | null | undefined): string {
  if (!reply) {
    return "I'm sorry, I didn't get a response. Could you try again?";
  }

  // Remove common debug patterns that might be in LLM responses
  let cleaned = reply
    // Remove debug prefixes and patterns
    .replace(/^\[.*?\]\s*/g, '') // Remove leading bracketed debug info
    .replace(/^🔧\s*\[.*?\]\s*/g, '') // Remove leading debug emojis and brackets
    .replace(/^💬\s*\[.*?\]\s*/g, '') // Remove leading chat debug patterns
    .replace(/^🎤\s*\[.*?\]\s*/g, '') // Remove leading TTS debug patterns
    // Remove technical error messages
    .replace(/speech.*catcher.*working.*filters/gi, '')
    .replace(/error.*occurred/gi, '')
    .replace(/debug.*mode/gi, '')
    // Remove multiple spaces and clean up
    .replace(/\s+/g, ' ')
    .trim();

  // If the cleaned text is too short, provide a fallback
  if (cleaned.length < 3) {
    return "I'm sorry, I didn't get a proper response. Could you try again?";
  }

  return cleaned;
}
