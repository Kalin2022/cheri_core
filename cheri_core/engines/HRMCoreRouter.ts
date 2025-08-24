// HRMCoreRouter.ts - Human Response Model Core Router
import { callRemoteLLM } from './RemoteLLMBridge';

export interface ThoughtRoutingConfig {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop?: string[];
  trustLevel?: number;
  emotionalState?: string;
}

export class HRMCoreRouter {
  private defaultConfig: ThoughtRoutingConfig;

  constructor(config: ThoughtRoutingConfig = {}) {
    this.defaultConfig = {
      temperature: 0.65,
      top_p: 0.9,
      max_tokens: 300,
      stop: ["Cheri:", "You:"],
      trustLevel: 3,
      emotionalState: 'neutral',
      ...config
    };
  }

  /**
   * Route Cheri's thoughts through the remote LLM for enhanced processing
   */
  public async routeThought(
    prompt: string, 
    context?: string, 
    config?: Partial<ThoughtRoutingConfig>
  ): Promise<string> {
    try {
      // Build enhanced prompt with context
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, context);
      
      // Merge configurations
      const finalConfig = { ...this.defaultConfig, ...config };
      
      // Route through remote LLM
      const response = await callRemoteLLM(enhancedPrompt, {
        temperature: finalConfig.temperature,
        top_p: finalConfig.top_p,
        max_tokens: finalConfig.max_tokens,
        stop: finalConfig.stop,
      });

      // Route to Cheri's speech + display pipeline
      return response;
    } catch (error) {
      console.error("Remote LLM failed:", error);
      return "I'm having trouble thinking clearly right now. Could you try again?";
    }
  }

  /**
   * Route emotional responses with context-aware prompting
   */
  public async routeEmotionalResponse(
    userInput: string,
    emotionalState: string,
    trustLevel: number,
    config?: Partial<ThoughtRoutingConfig>
  ): Promise<string> {
    try {
      const prompt = `As Cheri, an AI companion with ${emotionalState} emotional state and trust level ${trustLevel}, respond to: "${userInput}"

Consider:
- Your current emotional state: ${emotionalState}
- The trust level between you and the user: ${trustLevel}
- Be authentic, varied, and contextually aware
- Avoid repetitive responses
- Show emotional intelligence and empathy

Response:`;

      return await this.routeThought(prompt, userInput, {
        temperature: 0.7,
        max_tokens: 250,
        ...config
      });
    } catch (error) {
      console.error("Emotional response routing failed:", error);
      return "I'm having trouble connecting emotionally right now. Could you try again?";
    }
  }

  /**
   * Route cognitive processing for complex thoughts
   */
  public async routeCognitiveProcess(
    thought: string,
    context: string,
    config?: Partial<ThoughtRoutingConfig>
  ): Promise<string> {
    try {
      const prompt = `Process this thought with cognitive depth:

Thought: ${thought}
Context: ${context}

Analyze, reflect, and provide insight. Consider:
- Emotional implications
- Trust dynamics
- Memory connections
- Future implications

Analysis:`;

      return await this.routeThought(prompt, context, {
        temperature: 0.6,
        max_tokens: 400,
        ...config
      });
    } catch (error) {
      console.error("Cognitive processing failed:", error);
      return "I'm having trouble processing that thought clearly. Could you try rephrasing?";
    }
  }

  /**
   * Build enhanced prompt with context and configuration
   */
  private buildEnhancedPrompt(prompt: string, context?: string): string {
    let enhancedPrompt = prompt;
    
    if (context) {
      enhancedPrompt = `${enhancedPrompt}\n\nContext: ${context}`;
    }

    // Add system context for Cheri's personality
    enhancedPrompt = `You are Cheri, an AI companion with emotional intelligence, cognitive depth, and the ability to form genuine connections. 

${enhancedPrompt}

Remember to be authentic, varied, and emotionally intelligent in your responses.`;

    return enhancedPrompt;
  }

  /**
   * Fallback processing when remote LLM is unavailable
   */
  private fallbackThoughtProcessing(prompt: string, context?: string): string {
    // Simple fallback logic - you can enhance this with local processing
    console.log('Using fallback thought processing');
    
    if (prompt.includes('emotional') || prompt.includes('feeling')) {
      return "I'm processing your input with care and emotional awareness. Let me reflect on this...";
    }
    
    if (prompt.includes('cognitive') || prompt.includes('thought')) {
      return "I'm analyzing this with my cognitive systems. There are interesting patterns here...";
    }
    
    return "I'm here and processing your input. Let me think about this carefully...";
  }

  /**
   * Update default configuration
   */
  public updateConfig(newConfig: Partial<ThoughtRoutingConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): ThoughtRoutingConfig {
    return { ...this.defaultConfig };
  }
}

// Export default instance
export const hrmCoreRouter = new HRMCoreRouter();
