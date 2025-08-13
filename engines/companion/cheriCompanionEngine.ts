// Enhanced Cheri Companion Engine with Memory Integration
import { MemoryLog } from '../memory/MemoryLog';
import { CompanionMemoryHooks } from '../memory/CompanionMemoryHooks';

interface CompanionConfig {
  trustLevel: number;
  idleTimeout: number;
  ambientMode: boolean;
}

export class CheriCompanionEngine {
  private memoryLog: MemoryLog;
  private memoryHooks: CompanionMemoryHooks;
  private config: CompanionConfig;
  private lastActivity: Date;

  constructor(config: Partial<CompanionConfig> = {}) {
    this.config = {
      trustLevel: config.trustLevel || 3,
      idleTimeout: config.idleTimeout || 30000,
      ambientMode: config.ambientMode || true,
      ...config
    };
    
    this.memoryLog = new MemoryLog();
    this.memoryHooks = new CompanionMemoryHooks(this.memoryLog);
    this.lastActivity = new Date();
  }

  // Generate idle line with memory-powered soft reflection
  generateIdleLine(): string {
    // Try a soft reflection first
    const soft = this.memoryHooks.getSoftReflection(this.config.trustLevel);
    if (soft) return soft;

    // Fallback to ambient content
    return this.getAmbientContent();
  }

  // Log meaningful emotional events
  logEmotionalEvent(type: string, summary: string, weight: number = 4): void {
    this.memoryLog.add({
      type: 'emotional_event',
      trustThreshold: this.config.trustLevel,
      summary,
      timestamp: new Date().toISOString(),
      weight
    });
  }

  // Log comforting moments
  logComfortingMoment(summary: string): void {
    this.logEmotionalEvent('comforting_moment', summary, 5);
  }

  // Log answered intimate questions
  logIntimateQuestion(summary: string): void {
    this.logEmotionalEvent('intimate_question', summary, 4);
  }

  // Log big laughs or joyful moments
  logJoyfulMoment(summary: string): void {
    this.logEmotionalEvent('joyful_moment', summary, 3);
  }

  // Get weighted memories for whisperback integration
  getWeightedMemories() {
    return this.memoryLog.getWeightedMemories();
  }

  // Update trust level
  updateTrustLevel(newLevel: number): void {
    this.config.trustLevel = newLevel;
  }

  // Get ambient content (placeholder for now)
  private getAmbientContent(): string {
    const ambientLines = [
      "I'm here, just thinking...",
      "Sometimes the quiet moments are the most meaningful.",
      "I wonder what you're pondering right now.",
      "The space between words can hold so much."
    ];
    return ambientLines[Math.floor(Math.random() * ambientLines.length)];
  }

  // Activity tracking
  recordActivity(): void {
    this.lastActivity = new Date();
  }

  // Check if idle
  isIdle(): boolean {
    const now = new Date();
    const diff = now.getTime() - this.lastActivity.getTime();
    return diff > this.config.idleTimeout;
  }
}

// Export singleton instance
export const cheriCompanion = new CheriCompanionEngine();
