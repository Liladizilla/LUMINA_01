import { ThinkingLevel, Modality } from "@google/genai";

const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:3000";

// Centralized model configuration for Gemini API
// These are now used server-side; kept here for reference and potential client-side fallback
const MODEL_CONFIG = {
  PRO: "gemini-2.5-pro",
  FLASH: "gemini-3.5-flash",
  FLASH_LITE: "gemini-3.1-flash-lite",
  IMAGE_GEN: "gemini-2.5-flash-image",
  VIDEO: "veo-3.1-fast-generate-preview",
  TTS: "gemini-2.5-flash-preview-tts",
} as const;

async function callProxy<T>(endpoint: string, body: any): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.statusText}`);
  }

  return data as T;
}

async function pollOperation<T>(operationName: string, endpoint: string): Promise<T> {
  while (true) {
    const response = await fetch(`${API_BASE}${endpoint}/${encodeURIComponent(operationName)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Status check failed: ${response.statusText}`);
    }

    if (data.done) {
      return data;
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

export const AIService = {
  async analyzeImage(base64Image: string, prompt: string): Promise<string> {
    const { text } = await callProxy<{ text: string }>("/api/ai/analyze-image", {
      imageBase64: base64Image,
      prompt,
    });
    return text;
  },

  async generateImage(prompt: string, aspectRatio: string): Promise<string> {
    const { image } = await callProxy<{ image: string }>("/api/ai/generate-image", {
      prompt,
      aspectRatio,
    });
    return image;
  },

  async analyzeVideo(videoUrl: string, prompt: string): Promise<string> {
    const { text } = await callProxy<{ text: string }>("/api/ai/generate-text", {
      model: MODEL_CONFIG.PRO,
      contents: [{ parts: [{ text: `Analyze this video context: ${videoUrl}. Question: ${prompt}` }] }],
    });
    return text;
  },

  async transcribeAudio(audioBase64: string): Promise<string> {
    const { text } = await callProxy<{ text: string }>("/api/ai/transcribe-audio", {
      audioBase64,
    });
    return text;
  },

  async complexReasoning(prompt: string): Promise<string> {
    const { text } = await callProxy<{ text: string }>("/api/ai/generate-text", {
      model: MODEL_CONFIG.PRO,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        thinkingLevel: "HIGH",
      },
    });
    return text;
  },

  async generateVideo(prompt: string): Promise<string | null> {
    const { operation } = await callProxy<{ operation: string }>("/api/ai/generate-video", {
      prompt,
      config: {
        resolution: "720p",
        aspectRatio: "16:9",
      },
    });

    const data = await pollOperation<{
      done: boolean;
      response?: {
        generatedVideos?: Array<{
          video?: { uri?: string };
        }>;
      };
    }>(operation, "/api/ai/video-status");

    return data.response?.generatedVideos?.[0]?.video?.uri || null;
  },

  async generateSpeech(text: string, voice: string = "Kore"): Promise<string> {
    const { audio } = await callProxy<{ audio: string }>("/api/ai/generate-speech", {
      text: `Say cheerfully: ${text}`,
      voice,
    });
    return audio;
  },

  // Check if API is configured (server-side check)
  async isConfigured(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      const data = await response.json();
      return !!data.status;
    } catch {
      return false;
    }
  },
};