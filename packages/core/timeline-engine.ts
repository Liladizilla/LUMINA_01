import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  duration: number; // in seconds
  width: number;
  height: number;
  type: 'video' | 'audio' | 'image';
}

export interface ColorNode {
  id: string;
  type: 'exposure' | 'white-balance' | 'curves' | 'lut' | 'color-wheel' | 'smh' | 'input' | 'output';
  params: Record<string, any>;
  position: { x: number; y: number };
}

export interface ColorConnection {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface Clip {
  id: string;
  assetId: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'ai';
  startFrame: number;
  duration: number; // in frames
  trackId: string;
  effects: Effect[];
  colorNodes?: ColorNode[];
  colorConnections?: ColorConnection[];
}

export interface Effect {
  id: string;
  type: string;
  params: Record<string, any>;
  keyframes: Keyframe[];
}

export interface Keyframe {
  frame: number;
  value: any;
  interpolation: 'linear' | 'ease-in' | 'ease-out' | 'bezier';
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio';
  isLocked: boolean;
  isVisible: boolean;
}

interface TimelineState {
  tracks: Track[];
  clips: Clip[];
  mediaPool: MediaAsset[];
  selectedMediaId: string | null;
  playheadFrame: number;
  fps: number;
  zoom: number;
  selectedClipId: string | null;
  activeTool: 'select' | 'cut' | 'trim' | 'hand';
  rippleEnabled: boolean;
  
  // Actions
  setPlayhead: (frame: number) => void;
  setZoom: (zoom: number) => void;
  setActiveTool: (tool: 'select' | 'cut' | 'trim' | 'hand') => void;
  setRippleEnabled: (enabled: boolean) => void;
  selectClip: (id: string | null) => void;
  selectMedia: (id: string | null) => void;
  addMedia: (asset: MediaAsset) => void;
  addClip: (clip: Clip) => void;
  removeClip: (id: string) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  addTrack: (track: Track) => void;
  toggleTrackVisibility: (id: string) => void;
  toggleTrackLock: (id: string) => void;
  splitClip: (id: string, frame: number) => void;
  updateClipColorNodes: (clipId: string, nodes: ColorNode[]) => void;
  updateClipColorConnections: (clipId: string, connections: ColorConnection[]) => void;
}

// Internal store with immer middleware
const useTimelineStoreWithoutHistory = create<TimelineState>()(
  immer((set, get) => ({
    tracks: [
      { id: 'v1', name: 'Video 1', type: 'video', isLocked: false, isVisible: true },
      { id: 'a1', name: 'Audio 1', type: 'audio', isLocked: false, isVisible: true },
    ],
    clips: [],
    mediaPool: [],
    selectedMediaId: null,
    playheadFrame: 0,
    fps: 24,
    zoom: 2,
    selectedClipId: null,
    activeTool: 'select',
    rippleEnabled: true,

    setPlayhead: (frame) => set({ playheadFrame: frame }),
    setZoom: (zoom) => set({ zoom }),
    setActiveTool: (tool) => set({ activeTool: tool }),
    setRippleEnabled: (enabled) => set({ rippleEnabled: enabled }),
    selectClip: (id) => set({ selectedClipId: id }),
    selectMedia: (id) => set({ selectedMediaId: id }),
    addMedia: (asset) => set((state) => { 
      const existingIndex = state.mediaPool.findIndex(m => m.id === asset.id);
      if (existingIndex >= 0) {
        Object.assign(state.mediaPool[existingIndex], asset);
      } else {
        state.mediaPool.push(asset);
        state.selectedMediaId = asset.id;
      }
    }),
    addClip: (clip) => set((state) => { state.clips.push(clip); }),
    removeClip: (id) => set((state) => { 
      const clip = state.clips.find(c => c.id === id);
      if (!clip) return;

      if (state.rippleEnabled) {
        const { startFrame, duration, trackId } = clip;
        state.clips.forEach(c => {
          if (c.trackId === trackId && c.startFrame > startFrame) {
            c.startFrame -= duration;
          }
        });
      }

      state.clips = state.clips.filter(c => c.id !== id); 
    }),
    updateClip: (id, updates) => set((state) => {
      const clip = state.clips.find(c => c.id === id);
      if (!clip) return;

      if (state.rippleEnabled && updates.duration !== undefined && updates.duration !== clip.duration) {
        const diff = updates.duration - clip.duration;
        const trackId = clip.trackId;
        const startFrame = clip.startFrame;
        
        state.clips.forEach(c => {
          if (c.trackId === trackId && c.startFrame > startFrame && c.id !== id) {
            c.startFrame += diff;
          }
        });
      }

      Object.assign(clip, updates);
    }),
    addTrack: (track) => set((state) => { state.tracks.push(track); }),
    toggleTrackVisibility: (id) => set((state) => {
      const track = state.tracks.find(t => t.id === id);
      if (track) track.isVisible = !track.isVisible;
    }),
    toggleTrackLock: (id) => set((state) => {
      const track = state.tracks.find(t => t.id === id);
      if (track) track.isLocked = !track.isLocked;
    }),
    splitClip: (id, frame) => set((state) => {
      const clipIndex = state.clips.findIndex(c => c.id === id);
      if (clipIndex === -1) return;
      
      const clip = state.clips[clipIndex];
      const relativeFrame = frame - clip.startFrame;
      
      if (relativeFrame <= 0 || relativeFrame >= clip.duration) return;
      
      const originalDuration = clip.duration;
      clip.duration = relativeFrame;
      
      const newClip: Clip = {
        ...clip,
        id: Math.random().toString(36).substr(2, 9),
        startFrame: frame,
        duration: originalDuration - relativeFrame,
      };
      
      state.clips.push(newClip);
    }),
    updateClipColorNodes: (clipId, nodes) => set((state) => {
      const clip = state.clips.find(c => c.id === clipId);
      if (clip) clip.colorNodes = nodes;
    }),
    updateClipColorConnections: (clipId, connections) => set((state) => {
      const clip = state.clips.find(c => c.id === clipId);
      if (clip) clip.colorConnections = connections;
    }),
  }))
);

// Export store with undo/redo support
export const useTimelineStore = temporal(useTimelineStoreWithoutHistory);

// Helper hooks for undo/redo
export const useTimelineHistoryIds = () => {
  const past = useTimelineStore((state: any) => state.temporal?.pastStates || []);
  const present = useTimelineStore((state: any) => state.temporal?.present || state);
  const future = useTimelineStore((state: any) => state.temporal?.futureStates || []);
  return { past, present, future };
};

export const undoTimeline = () => {
  const undo = useTimelineStore.getState().temporal?.undo;
  undo?.();
};

export const redoTimeline = () => {
  const redo = useTimelineStore.getState().temporal?.redo;
  redo?.();
};