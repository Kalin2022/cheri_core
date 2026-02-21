// synthisoul_core/ux/UXPolicyFilter.ts
/**
 * UX Policy Filter
 * 
 * Applies UX policy constraints to response text.
 * Shapes output for mobile (1-2 sentences, no paragraphs/bullets) 
 * while preserving personality and tone.
 */

import type { UXPolicy, TurnResult } from "../system/TurnTypes";
import { DEFAULT_DESKTOP_POLICY } from "./UXPolicyBuilder";

/**
 * Count sentences in text
 */
function countSentences(text: string): number {
  // Match sentence endings: . ! ? followed by space or end
  const matches = text.match(/[.!?]+(\s|$)/g);
  return matches ? matches.length : 1;
}

/**
 * Convert paragraphs to single paragraph
 */
function flattenParagraphs(text: string): string {
  // Replace double newlines (paragraph breaks) with space
  return text.replace(/\n\n+/g, " ").replace(/\n/g, " ");
}

/**
 * Remove or convert bullet/numbered lists
 */
function removeBullets(text: string): string {
  // Remove markdown bullets
  text = text.replace(/^[\s]*[-*+]\s+/gm, "");
  // Remove numbered lists
  text = text.replace(/^[\s]*\d+[.)]\s+/gm, "");
  // Remove HTML-style lists
  text = text.replace(/<li>.*?<\/li>/gi, "");
  // Clean up extra whitespace
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Truncate to max sentences
 * Only removes entire sentences - never deletes arbitrary substrings
 */
function truncateToMaxSentences(text: string, maxSentences: number): string {
  if (maxSentences <= 0) return text;

  // Split by sentence boundaries (preserve punctuation)
  // Match: sentence text + punctuation + optional whitespace
  const sentencePattern = /([^.!?]+[.!?]+)\s*/g;
  const sentences: string[] = [];
  let match;
  
  while ((match = sentencePattern.exec(text)) !== null) {
    sentences.push(match[1].trim());
  }
  
  // If no sentences found, return original (don't corrupt)
  if (sentences.length === 0) {
    return text;
  }

  // Take only the first maxSentences complete sentences
  const selectedSentences = sentences.slice(0, maxSentences);
  let truncated = selectedSentences.join(" ").trim();

  // If we truncated, ensure it doesn't end abruptly
  if (selectedSentences.length < sentences.length && truncated.length < text.length) {
    // Check if last sentence is complete
    if (!truncated.match(/[.!?]$/)) {
      // Add ellipsis if truncated mid-sentence
      truncated = truncated + "...";
    }
  }

  return truncated;
}

/**
 * Extract first sentence from text
 */
function getFirstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]+/);
  return match ? match[0].trim() : text.split(/[.!?]/)[0].trim() + ".";
}

/**
 * Check if text ends with approval cue
 */
function hasApprovalCue(text: string): boolean {
  const cues = [
    "want me to",
    "should i",
    "would you like me to",
    "shall i",
    "can i",
    "okay?",
    "sound good?",
    "work?",
  ];
  const lower = text.toLowerCase();
  return cues.some((cue) => lower.includes(cue));
}

/**
 * Apply UX policy constraints to response text
 * 
 * Rules:
 * - If userRequestedLongform: return unchanged
 * - If pendingToolIntents exist: preserve first sentence (approval lead-in)
 * - Else enforce: flatten paragraphs, remove bullets, cap sentences
 * - Preserve tone/persona, only shape structure
 */
export function applyUXPolicyConstraints(
  text: string,
  uxPolicy: UXPolicy | undefined,
  turnResult?: TurnResult
): string {
  // Use default desktop policy if not provided
  const policy = uxPolicy || DEFAULT_DESKTOP_POLICY;

  // If user explicitly requested longform, don't constrain
  if (policy.userRequestedLongform) {
    return text;
  }

  let result = text;
  let preservedFirstSentence: string | null = null;

  // If there are pending tool intents, preserve the first sentence (approval lead-in)
  // BUT: only add approval cue if there are NO executed results for those intents
  // (If tools were already executed, don't ask for approval again)
  if (turnResult?.pendingToolIntents && turnResult.pendingToolIntents.length > 0) {
    // Check if any of the pending intents have already been executed
    const executedIntentIds = new Set(
      (turnResult.toolResults || [])
        .map(tr => (tr as any).intentId)
        .filter((id): id is string => !!id)
    );
    
    // Only add approval cue if there are pending intents that haven't been executed
    const trulyPending = turnResult.pendingToolIntents.filter(
      intent => !executedIntentIds.has(intent.intentId)
    );
    
    if (trulyPending.length > 0) {
      preservedFirstSentence = getFirstSentence(result);
      
      // Ensure it ends with an approval cue if missing
      if (!hasApprovalCue(preservedFirstSentence)) {
        // Add a gentle approval cue
        if (!preservedFirstSentence.match(/[.!?]$/)) {
          preservedFirstSentence += ".";
        }
        preservedFirstSentence += " Want me to do that?";
      }
    }
  }

  // Flatten paragraphs if not allowed
  if (!policy.allowParagraphs) {
    result = flattenParagraphs(result);
  }

  // Remove bullets if not allowed
  if (!policy.allowBullets) {
    result = removeBullets(result);
  }

  // Cap by sentence count
  const currentSentenceCount = countSentences(result);
  const beforeTruncation = result;
  
  if (currentSentenceCount > policy.maxSentences) {
    console.log(`📏 [UXPolicyFilter] Truncating: ${currentSentenceCount} sentences -> ${policy.maxSentences} (policy: ${JSON.stringify(policy)})`);
    
    if (preservedFirstSentence) {
      // Preserve first sentence, then truncate the rest
      const remainingSentences = policy.maxSentences - 1;
      if (remainingSentences > 0) {
        // Get remaining text after first sentence - use sentence boundaries, not substring
        const firstSentenceEnd = result.indexOf(preservedFirstSentence) + preservedFirstSentence.length;
        const afterFirst = result.substring(firstSentenceEnd).trim();
        const truncatedRest = truncateToMaxSentences(afterFirst, remainingSentences);
        result = preservedFirstSentence + " " + truncatedRest;
      } else {
        // Only first sentence allowed
        result = preservedFirstSentence;
      }
    } else {
      result = truncateToMaxSentences(result, policy.maxSentences);
    }
    
    console.log(`📏 [UXPolicyFilter] Truncated: "${beforeTruncation.slice(0, 100)}..." -> "${result.slice(0, 100)}..."`);
  } else if (preservedFirstSentence && result !== preservedFirstSentence) {
    // If we preserved first sentence but didn't truncate, ensure it's still at the start
    // Use sentence boundary matching, not substring manipulation
    const firstSentenceMatch = result.match(/^([^.!?]+[.!?]+)/);
    if (firstSentenceMatch && firstSentenceMatch[0] !== preservedFirstSentence) {
      // Replace first sentence with preserved one
      result = preservedFirstSentence + " " + result.substring(firstSentenceMatch[0].length).trim();
    }
  }

  // Validation: Check for broken grammar (orphaned fragments)
  const finalResult = result.trim();
  const hasOrphanedFragments = /^\s*[a-z]|^\s*[,;:]|^\s*[.!?]{2,}/.test(finalResult) || 
    /\s+[a-z]\s*$/.test(finalResult) || // Word fragments at end
    /\b[a-z]{1,2}\s+[A-Z]/.test(finalResult); // Single/two-letter words before capitals (likely fragments)
  
  if (hasOrphanedFragments && beforeTruncation !== finalResult) {
    console.warn("⚠️ [UXPolicyFilter] Corruption detected: orphaned fragments found, reverting to pre-filter output");
    console.warn(`⚠️ [UXPolicyFilter] Corrupted: "${finalResult}"`);
    console.warn(`⚠️ [UXPolicyFilter] Reverting to: "${beforeTruncation}"`);
    return beforeTruncation.trim();
  }
  
  console.log(`📏 [UXPolicyFilter] Final: ${finalResult.length} chars, ${countSentences(finalResult)} sentences`);
  
  return finalResult;
}

