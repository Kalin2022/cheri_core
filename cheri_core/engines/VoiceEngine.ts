// VoiceEngine.ts
import { speakWithPiper } from './TTSBridge';
import path from 'path';

export async function speak(text: string): Promise<void> {
  try {
    console.log(`[Cheri voice]: ${text}`);
    await speakWithPiper(text);
  } catch (error) {
    console.error("VoiceEngine failed:", error);
  }
}
