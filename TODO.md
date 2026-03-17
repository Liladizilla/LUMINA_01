# Lumina Studio Fix & Feature Confirmation Plan

Status: [ ] In Progress | [x] Planned

## Breakdown Steps (Approved Plan)

1. [x] Update root `package.json`: Add turbo/monorepo scripts.
2. [x] Update apps/desktop `package.json`: Add tauri scripts/deps.
3. [ ] Guide/install Rust (PowerShell): `iwr -useb https://win.rustup.rs/ | iex`.
4. [ ] Install Rust/tauri-cli: `iwr -useb https://win.rustup.rs/ | iex` then `cargo install tauri-cli`.
5. [x] Fix desktop Vite: Added vite.config.ts, main.tsx, src/.

5. [ ] Complete `apps/mobile`: Init RN, android/ios, App.tsx.
6. [ ] Test APK: `npm run dev:mobile`.
7. [ ] Confirm all features working (timeline/AI/LUT/SmartCut/ColorNode).
8. [ ] Rust/C++ core roadmap (WASM/native perf).

**Next**: Install Rust: `iwr -useb https://win.rustup.rs/ | iex` (PowerShell). Restart terminal.

