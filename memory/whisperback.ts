export type WhisperMemory = {
  content: string;
  tone: string;
  emotionTag: string; // "sad", "curious", etc.
  timestamp: number;
  emotionWeight: number;
  shared?: boolean;
};

let memoryLog: WhisperMemory[] = [];

export function logWhisper(content: string, tone: string, emotionTag: string, emotionWeight: number) {
  memoryLog.push({ content, tone, emotionTag, timestamp: Date.now(), emotionWeight });
}

export function getPendingWhispers(): WhisperMemory[] {
  return memoryLog.filter(m => !m.shared && m.emotionWeight >= 0.6);
}

export function markAsShared(content: string) {
  const match = memoryLog.find(m => m.content === content);
  if (match) match.shared = true;
}