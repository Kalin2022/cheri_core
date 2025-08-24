// TTSBridge.ts
import { exec } from 'child_process';
import path from 'path';

// Example using Piper TTS
export function speakWithPiper(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const escaped = text.replace(/"/g, '\\"');
    const command = `echo "${escaped}" | piper --model ./models/en_US-amy-low.onnx --output_file output.wav && aplay output.wav`;

    exec(command, (error) => {
      if (error) {
        console.error("Piper failed:", error);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
