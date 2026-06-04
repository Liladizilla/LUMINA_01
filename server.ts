import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { Server } from "socket.io";
import * as Y from "yjs";

// Model configuration - centralized for consistency
const MODEL_CONFIG = {
  PRO: "gemini-2.5-pro",
  FLASH: "gemini-3.5-flash",
  FLASH_LITE: "gemini-3.1-flash-lite",
  IMAGE_GEN: "gemini-2.5-flash-image",
  VIDEO: "veo-3.1-fast-generate-preview",
  TTS: "gemini-2.5-flash-preview-tts",
} as const;

// Store for Yjs documents (project shared state)
const projectDocs: Map<string, Y.Doc> = new Map();

// Get or create a Yjs document for a project
function getYDoc(projectId: string): Y.Doc {
  if (!projectDocs.has(projectId)) {
    projectDocs.set(projectId, new Y.Doc());
  }
  return projectDocs.get(projectId)!;
}

interface GeminiRequest {
  model: string;
  contents: any[];
  config?: any;
}

// Rate limiting configuration
const QUOTAS: Record<string, { aiCallsPerHour: number; exportsPerDay: number }> = {
  free: { aiCallsPerHour: 10, exportsPerDay: 3 },
  pro: { aiCallsPerHour: 100, exportsPerDay: 20 },
  team: { aiCallsPerHour: 500, exportsPerDay: 100 },
};

// In-memory rate limiting store (use Redis in production)
const rateLimitStore: Record<string, { count: number; resetAt: number }> = {};

function checkRateLimit(userId: string, resource: string): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${userId}:${resource}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  if (!rateLimitStore[key] || rateLimitStore[key].resetAt < now) {
    rateLimitStore[key] = { count: 0, resetAt: now + windowMs };
  }
  
  const entry = rateLimitStore[key];
  const limit = QUOTAS.free.aiCallsPerHour; // Default to free tier
  
  return {
    allowed: entry.count < limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt
  };
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/ws",
  });
  
  const PORT = process.env.PORT || 3000;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // Middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Rate limiting middleware
  const rateLimitMiddleware = (req: any, res: any, next: any) => {
    const userId = (req as any).headers['x-user-id'] || 'anonymous';
    const resource = req.path;
    
    const limit = checkRateLimit(userId, resource);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', QUOTAS.free.aiCallsPerHour);
    res.setHeader('X-RateLimit-Remaining', limit.remaining);
    res.setHeader('X-RateLimit-Reset', limit.resetAt.toString());
    
    if (!limit.allowed) {
      return res.status(429).json({ 
        error: "Rate limit exceeded. Please upgrade your plan or try again later." 
      });
    }
    
    next();
  };

  // AI Image Generation Proxy
  app.post("/api/ai/generate-image", rateLimitMiddleware, async (req, res) => {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    try {
      const { prompt, aspectRatio } = req.body;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_CONFIG.IMAGE_GEN}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              imageSize: "1K",
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data.error || "Image generation failed" });
      }

      // Extract image data from response
      const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (imagePart?.inlineData) {
        res.json({ image: `data:image/png;base64,${imagePart.inlineData.data}` });
      } else {
        res.status(500).json({ error: "No image generated" });
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: error.message || "Image generation failed" });
    }
  });

  // AI Text Generation Proxy (for analyze, think, etc.)
  app.post("/api/ai/generate-text", rateLimitMiddleware, async (req, res) => {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    try {
      const { model = MODEL_CONFIG.PRO, contents, config } = req.body;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents, generationConfig: config }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data.error || "Text generation failed" });
      }

      res.json({ text: data.candidates?.[0]?.content?.parts?.[0]?.text });
    } catch (error: any) {
      console.error("Text generation error:", error);
      res.status(500).json({ error: error.message || "Text generation failed" });
    }
  });

  // AI Video Generation Proxy (Veo)
  app.post("/api/ai/generate-video", rateLimitMiddleware, async (req, res) => {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    try {
      const { prompt, config } = req.body;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_CONFIG.VIDEO}:generateVideo?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            config: {
              ...config,
              numberOfVideos: 1,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data.error || "Video generation failed" });
      }

      // Return operation name for polling
      res.json({ operation: data.name, status: data.status });
    } catch (error: any) {
      console.error("Video generation error:", error);
      res.status(500).json({ error: error.message || "Video generation failed" });
    }
  });

  // Poll video operation status
  app.get("/api/ai/video-status/:operationName", async (req, res) => {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    try {
      const { operationName } = req.params;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${GEMINI_API_KEY}`
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data.error || "Status check failed" });
      }

      res.json(data);
    } catch (error: any) {
      console.error("Status check error:", error);
      res.status(500).json({ error: error.message || "Status check failed" });
    }
  });

  // AI Audio/TTS Proxy
  app.post("/api/ai/generate-speech", rateLimitMiddleware, async (req, res) => {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    try {
      const { text, voice = "Kore" } = req.body;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_CONFIG.TTS}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
              },
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data.error || "Speech generation failed" });
      }

      const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (audioData) {
        res.json({ audio: `data:audio/wav;base64,${audioData}` });
      } else {
        res.status(500).json({ error: "No audio generated" });
      }
    } catch (error: any) {
      console.error("Speech generation error:", error);
      res.status(500).json({ error: error.message || "Speech generation failed" });
    }
  });

  // AI Image Analysis Proxy
  app.post("/api/ai/analyze-image", rateLimitMiddleware, async (req, res) => {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    try {
      const { imageBase64, prompt } = req.body;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_CONFIG.PRO}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
                  { text: prompt },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data.error || "Image analysis failed" });
      }

      res.json({ text: data.candidates?.[0]?.content?.parts?.[0]?.text });
    } catch (error: any) {
      console.error("Image analysis error:", error);
      res.status(500).json({ error: error.message || "Image analysis failed" });
    }
  });

  // AI Audio Transcription Proxy
  app.post("/api/ai/transcribe-audio", rateLimitMiddleware, async (req, res) => {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    try {
      const { audioBase64 } = req.body;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_CONFIG.FLASH}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inlineData: { data: audioBase64, mimeType: "audio/wav" } },
                  { text: "Transcribe this audio accurately." },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data.error || "Transcription failed" });
      }

      res.json({ text: data.candidates?.[0]?.content?.parts?.[0]?.text });
    } catch (error: any) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: error.message || "Transcription failed" });
    }
  });

  // Project save/load API routes
  app.post("/api/projects", async (req, res) => {
    const { projectId, timelineData, name } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: "Project ID required" });
    }
    
    const doc = getYDoc(projectId);
    const yTimeline = doc.getMap("timeline");
    yTimeline.set("data", timelineData);
    yTimeline.set("name", name || "Untitled");
    
    res.json({ success: true });
  });

  // Load project
  app.get("/api/projects/:projectId", async (req, res) => {
    const { projectId } = req.params;
    const doc = getYDoc(projectId);
    const yTimeline = doc.getMap("timeline");
    
    res.json({
      id: projectId,
      name: yTimeline.get("name") || "Untitled",
      timelineData: yTimeline.get("data"),
    });
  });

  // Socket.IO collaboration handlers
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    socket.on("join-project", ({ projectId, userId }) => {
      socket.join(`project:${projectId}`);
      
      const doc = getYDoc(projectId);
      const yTimeline = doc.getMap("timeline");
      
      // Notify others about the new collaborator
      socket.to(`project:${projectId}`).emit("collaborator-joined", { userId });
      
      // Send current state to joining client
      socket.emit("timeline-update", {
        clips: yTimeline.get("clips") || [],
        playheadFrame: yTimeline.get("playheadFrame") || 0,
      });
    });

    socket.on("cursor-move", ({ projectId, userId, cursor }) => {
      // Broadcast cursor position to other collaborators
      socket.to(`project:${projectId}`).emit("cursor-update", { userId, cursor });
    });

    socket.on("playhead-move", ({ projectId, frame, userId }) => {
      const doc = getYDoc(projectId);
      const yTimeline = doc.getMap("timeline");
      yTimeline.set("playheadFrame", frame);
      
      // Broadcast to other collaborators
      socket.to(`project:${projectId}`).emit("playhead-update", { frame, userId });
    });

    socket.on("clip-update", ({ projectId, clip, userId }) => {
      const doc = getYDoc(projectId);
      const yClips = doc.getArray("clips");
      
      // Find and update clip or add new one
      const clips = yClips.toArray();
      const clipIndex = clips.findIndex((c: any) => c.id === clip.id);
      if (clipIndex >= 0) {
        yClips.delete(clipIndex, 1);
        yClips.insert(clipIndex, [clip]);
      } else {
        yClips.push([clip]);
      }
      
      socket.to(`project:${projectId}`).emit("clip-updated", { clip, userId });
    });

socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Integration endpoint for y-websocket provider
  app.get("/api/collaboration/:projectId", (req, res) => {
    const { projectId } = req.params;
    const doc = getYDoc(projectId);
    
    // Return update endpoint for y-websocket
    res.json({
      projectId,
      wsUrl: `${req.protocol}://${req.get("host")}/ws`,
      message: "Connect via Socket.IO or y-websocket provider",
    });
  });

  // Export endpoint - queues video render job
  app.post("/api/export", async (req, res) => {
    const { timelineData, format = "mp4", quality = "medium", projectId } = req.body;
    
    if (!timelineData) {
      return res.status(400).json({ error: "Timeline data required" });
    }
    
    // Generate a unique export ID
    const exportId = Math.random().toString(36).substr(2, 9);
    
    // In production, this would queue a render job with actual FFmpeg processing
    // For now, return a mock response
    res.json({
      exportId,
      status: "queued",
      message: "Export job queued. Connect to WebSocket for progress updates.",
    });
    
    // Emit export progress via WebSocket (simulated)
    if (projectId) {
      io.to(`project:${projectId}`).emit("export-progress", {
        exportId,
        progress: 0,
        status: "starting",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`WebSocket server available at ws://0.0.0.0:${PORT}/ws`);
    if (!GEMINI_API_KEY) {
      console.warn("Warning: GEMINI_API_KEY not set - AI features will not work");
    }
  });
}

startServer();