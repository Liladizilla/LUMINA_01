import { GoogleGenAI, ThinkingLevel, Modality } from "@google/genai";

// Secure API key handling - API key should be set via environment variable
// In production, this should be handled server-side to protect the API key
// For client-side, we recommend using a backend proxy

const getApiKey = (): string => {
  // Try to get from import.meta.env (Vite)
  const envKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (envKey) return envKey;
  
  // Fallback: Check if there's a globally available key (not recommended for production)
  // @ts-ignore
  const globalKey = typeof window !== 'undefined' ? (window as any).__GEMINI_API_KEY : undefined;
  if (globalKey) return globalKey;
  
  // Return empty string - service will show appropriate error
  return '';
};

export const AIService = {
  async analyzeImage(base64Image: string, prompt: string) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          parts: [
            { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
            { text: prompt }
          ]
        }
      ]
    });
    return response.text;
  },

  async generateImage(prompt: string, aspectRatio: string) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  },

  async analyzeVideo(videoUrl: string, prompt: string) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    // Note: In a real app, we'd need to upload the video to Gemini File API
    // For this demo, we'll assume the user provides a prompt about the video
    // and we use the gemini-3.1-pro-preview model.
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: `Analyze this video context: ${videoUrl}. Question: ${prompt}` }] }]
    });
    return response.text;
  },

  async transcribeAudio(audioBase64: string) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { data: audioBase64, mimeType: "audio/wav" } },
            { text: "Transcribe this audio accurately." }
          ]
        }
      ]
    });
    return response.text;
  },

  async complexReasoning(prompt: string) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });
    return response.text;
  },

  async generateVideo(prompt: string) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    return operation.response?.generatedVideos?.[0]?.video?.uri;
  },

  async generateSpeech(text: string, voice: string = 'Kore') {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice as any },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/wav;base64,${base64Audio}`;
    }
    throw new Error("No audio generated");
  },
  
  // Check if API is configured
  isConfigured(): boolean {
    return !!getApiKey();
  }
};

