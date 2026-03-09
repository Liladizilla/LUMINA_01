# LUMINA STUDIO - Professional AI Video Editor

Lumina Studio is a high-performance, cross-platform video editing application built with a modern tech stack for professional creators.

## 🚀 Tech Stack

- **Desktop**: Tauri 2.0 (Rust) + React + WebGPU
- **Mobile**: React Native 0.74 (New Architecture) + Skia
- **Core Engine**: FFmpeg (Decoding/Encoding) + ONNX Runtime (AI)
- **State**: Zustand + Immer
- **Styling**: Tailwind CSS (Cinematic Black + Gold)

## 📁 Monorepo Structure

```text
/apps
  /desktop        - Tauri application (Windows/Linux)
  /mobile         - React Native application (Android/iOS)
/packages
  /core           - Shared timeline engine & editing logic
  /ui             - Shared design system & components
  /ffmpeg-bridge  - Rust-based video processing bindings
  /ai-models      - ONNX inference tools & model management
```

## 🛠 Prerequisites

### 1. Install Node.js
Download from [nodejs.org](https://nodejs.org/). Use version 20+.

### 2. Install Rust (for Desktop)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 3. Install Android Studio (for Mobile)
- Install Android SDK, Build Tools, and NDK.
- Set `ANDROID_HOME` environment variable.

### 4. Install FFmpeg
Ensure `ffmpeg` is available in your system PATH.

## 🏃 Running the Project

### Install Dependencies
```bash
npm install
```

### Start Desktop (Tauri)
```bash
npm run dev:desktop
```

### Start Mobile (React Native)
```bash
npm run dev:mobile
```

## 🏗 Build & Release

### Build Desktop
```bash
npm run build:desktop
```

### Build Android (APK)
```bash
npm run android
```

### Build iOS
```bash
npm run ios
```

## 🎨 Design System
- **Background**: `#070608`
- **Primary Accent**: `#F5A623` (Gold)
- **Secondary Accent**: `#FF8C00` (Amber)
- **Typography**: Cinzel (Headings), Nunito Sans (UI), JetBrains Mono (Data)

## 🤖 AI Integration
Lumina Studio integrates open-source models via ONNX Runtime:
- **Stable Video Diffusion**: For AI clip generation.
- **Whisper**: For automatic subtitle generation.
- **RMBG**: For real-time background removal.
- **Real-ESRGAN**: For 4K video upscaling.
