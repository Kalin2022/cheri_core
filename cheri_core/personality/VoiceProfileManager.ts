import voiceStyles from "./voice_styles.json";
import { SoulframeConfig } from "./SoulframeCore";

export interface VoiceStyle {
  length_scale: number;
  espeak_voice: string;
  whisper?: boolean;
  description?: string;
}

export class VoiceProfileManager {
  private styleMap: Record<string, VoiceStyle>;

  constructor() {
    this.styleMap = voiceStyles;
  }

  getStyle(profileName: string): VoiceStyle {
    const style = this.styleMap[profileName];

    if (!style) {
      console.warn(`[VoiceProfileManager] Unknown voice profile: ${profileName}. Falling back to 'cheri-rogue-v1'`);
      return this.styleMap["cheri-rogue-v1"];
    }

    return style;
  }

  getStyleFromSoulframe(config: SoulframeConfig): VoiceStyle {
    const profileName = config.voiceProfile || "cheri-rogue-v1";
    return this.getStyle(profileName);
  }

  listAvailableProfiles(): string[] {
    return Object.keys(this.styleMap);
  }
}