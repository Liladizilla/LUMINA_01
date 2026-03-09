# LUMINA STUDIO - Professional AI Video Editor

Lumina Studio is a high-performance, cross-platform video editing application designed for the next generation of content creators. By combining a professional-grade timeline engine with cutting-edge AI capabilities, Lumina Studio simplifies complex editing tasks while maintaining the precision required for high-end production.

## 🌟 Key Features

### 🎬 Professional Timeline Engine
- **Multi-Track Editing**: Support for unlimited video and audio tracks with independent locking and visibility controls.
- **Precision Tools**: Frame-accurate cutting, trimming, and sliding tools for total control over your edit.
- **Real-Time Preview**: High-performance preview monitor with GPU acceleration for smooth playback of complex projects.
- **Inspector Panel**: Detailed control over clip properties, transforms, and color grading.

### 🤖 AI-Powered Workflow
- **AI Clip Generation**: Generate high-quality video clips from text descriptions using Stable Video Diffusion.
- **Smart Subtitles**: Automatic transcription and subtitle generation powered by OpenAI's Whisper.
- **Background Removal**: Instant, high-quality background removal for video subjects without green screens.
- **4K Upscaling**: Enhance low-resolution footage to crisp 4K using advanced AI upscaling models.

### 📁 Media Management
- **Automated Thumbnails**: Instant thumbnail generation for all imported media assets.
- **Metadata Extraction**: Automatic detection of resolution, frame rate, and duration.
- **Organized Media Pool**: A clean, searchable interface for managing all your project assets.

## 🚀 Tech Stack

- **Desktop**: [Tauri 2.0](https://tauri.app/) (Rust) + React + WebGPU
- **Mobile**: [React Native 0.74](https://reactnative.dev/) (New Architecture) + Skia
- **Core Engine**: Zustand + Immer for high-performance state management
- **Video Processing**: FFmpeg (via Rust bindings) for robust encoding/decoding
- **AI Inference**: ONNX Runtime for cross-platform AI model execution
- **Styling**: Tailwind CSS with a custom "Cinematic Black + Gold" design system

## 📁 Monorepo Structure

```text
/apps
  /desktop        - Tauri application (Windows/Linux/macOS)
  /mobile         - React Native application (Android/iOS)
/packages
  /core           - Shared timeline engine, state management, and editing logic
  /ui             - Shared design system, primitive components, and icons
  /ffmpeg-bridge  - Rust-based video processing bindings for FFmpeg
  /ai-models      - ONNX inference tools and AI model management
```

## 🛠 Getting Started

### Prerequisites
1. **Node.js**: Version 20 or higher.
2. **Rust**: Required for desktop builds (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`).
3. **Android Studio / Xcode**: Required for mobile development.
4. **FFmpeg**: Must be installed and available in your system PATH.

### Installation
```bash
npm install
```

### Development
```bash
# Start Desktop (Tauri)
npm run dev:desktop

# Start Mobile (React Native)
npm run dev:mobile
```

## 🎨 Design Philosophy
Lumina Studio follows a **"Cinematic Brutalist"** aesthetic.
- **Color Palette**: Deep Obsidian (`#070608`), Lumina Gold (`#F5A623`), and Amber accents.
- **Typography**: 
  - *Cinzel*: For bold, cinematic headings.
  - *Nunito Sans*: For clean, legible UI elements.
  - *JetBrains Mono*: For technical data and timecodes.

## 🗺 Roadmap
- [ ] **Cloud Collaboration**: Real-time multi-user editing sessions.
- [ ] **Advanced Color Grading**: Support for LUTs and professional color wheels.
- [ ] **AI Voiceover**: Text-to-speech with emotional inflection.
- [ ] **Plugin System**: Community-driven effects and transitions.

---
Built with ❤️ for creators by the Lumina Team.
