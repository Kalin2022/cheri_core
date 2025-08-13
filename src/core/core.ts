import { initMemory } from "./memory";
import { initEmotion } from "./emotion";
import { createCoreFabric } from "./fabric";

export function initCore() {
  const memory = initMemory();
  const emotion = initEmotion();
  const fabric = createCoreFabric({ memory, emotion });

  return {
    memory,
    emotion,
    fabric,
    processInput: fabric.processInput,
  };
}
