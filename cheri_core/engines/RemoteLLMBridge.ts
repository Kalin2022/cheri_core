// RemoteLLMBridge.ts
import axios from 'axios';

interface GenerationConfig {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop?: string[];
}

// Configuration for different LLM endpoints
interface LLMConfig {
  endpoint: string;
  apiKey?: string;
  model?: string;
  requestFormat: 'openai' | 'localhost';
  responsePath: string; // Path to extract response from (e.g., 'text', 'choices[0].message.content')
}

// Default configurations
const OPENAI_CONFIG: LLMConfig = {
  endpoint: "https://api.openai.com/v1/chat/completions",
  requestFormat: 'openai',
  responsePath: 'choices[0].message.content'
};

const LOCALHOST_CONFIG: LLMConfig = {
  endpoint: "http://localhost:5173/api/generate",
  requestFormat: 'localhost',
  responsePath: 'text'
};

export async function callRemoteLLM(prompt: string, config: GenerationConfig = {}): Promise<string> {
  // For now, default to localhost - you can change this or make it configurable
  const useLocalhost = true; // Set to false to use OpenAI instead
  const llmConfig = useLocalhost ? LOCALHOST_CONFIG : OPENAI_CONFIG;
  
  if (llmConfig.requestFormat === 'openai') {
    return callOpenAI(prompt, config, llmConfig);
  } else {
    return callLocalhost(prompt, config, llmConfig);
  }
}

async function callOpenAI(prompt: string, config: GenerationConfig, llmConfig: LLMConfig): Promise<string> {
  const OPENAI_API_KEY = "your-openai-api-key-here"; // Replace with your actual API key
  const model = "gpt-3.5-turbo"; // You can make this configurable

  if (!OPENAI_API_KEY || OPENAI_API_KEY === "your-openai-api-key-here") {
    throw new Error("Please set your OpenAI API key in the RemoteLLMBridge.ts file.");
  }

  const response = await axios.post(
    llmConfig.endpoint,
    {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: config.temperature ?? 0.7,
      top_p: config.top_p ?? 0.95,
      max_tokens: config.max_tokens ?? 512,
      stop: config.stop,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message.content.trim();
}

async function callLocalhost(prompt: string, config: GenerationConfig, llmConfig: LLMConfig): Promise<string> {
  try {
    const response = await axios.post(
      llmConfig.endpoint,
      {
        prompt,
        temperature: config.temperature ?? 0.7,
        top_p: config.top_p ?? 0.95,
        max_tokens: config.max_tokens ?? 512,
        stop: config.stop,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Extract response using the configured path
    const responseText = getNestedValue(response.data, llmConfig.responsePath);
    return responseText?.trim() || "";
  } catch (error) {
    console.error("Localhost LLM call failed:", error);
    throw new Error(`Localhost LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to get nested object values by path string
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return current[key];
    }
    return undefined;
  }, obj);
}

// Export configurations for external use
export { OPENAI_CONFIG, LOCALHOST_CONFIG };
export type { LLMConfig };
