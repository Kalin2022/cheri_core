import { useEffect, useState } from "react";
import { generateWhisper } from "@/engines/whisperbackEngine";

export function useWhisperback(idleTrigger: boolean, sessionResume: boolean) {
  const [whisper, setWhisper] = useState<string | null>(null);

  useEffect(() => {
    if (idleTrigger || sessionResume) {
      const response = generateWhisper();
      if (response) setWhisper(response);
    }
  }, [idleTrigger, sessionResume]);

  return whisper;
}