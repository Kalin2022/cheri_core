export type EmotionState = {
    current: string;
    intensity: number; // 0-100
    history: { emotion: string; timestamp: number }[];
  };
  
  export function initEmotion() {
    const state: EmotionState = {
      current: "neutral",
      intensity: 10,
      history: [],
    };
  
    function update(emotion: string, intensity: number = 50) {
      state.current = emotion;
      state.intensity = intensity;
      state.history.push({ emotion, timestamp: Date.now() });
    }
  
    function get() {
      return state;
    }
  
    return { update, get };
  }
  