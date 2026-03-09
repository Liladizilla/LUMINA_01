import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

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

export interface Clip {
  id: string;
  assetId: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'ai';
  startFrame: number;
  duration: number; // in frames
  trackId: string;
  effects: Effect[];
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
  playheadFrame: number;
  fps: number;
  zoom: number;
  selectedClipId: string | null;
  
  // Actions
  setPlayhead: (frame: number) => void;
  setZoom: (zoom: number) => void;
  selectClip: (id: string | null) => void;
  addMedia: (asset: MediaAsset) => void;
  addClip: (clip: Clip) => void;
  removeClip: (id: string) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  addTrack: (track: Track) => void;
  toggleTrackVisibility: (id: string) => void;
  toggleTrackLock: (id: string) => void;
}

export const useTimelineStore = create<TimelineState>()(
  immer((set) => ({
    tracks: [
      { id: 'v1', name: 'Video 1', type: 'video', isLocked: false, isVisible: true },
      { id: 'a1', name: 'Audio 1', type: 'audio', isLocked: false, isVisible: true },
    ],
    clips: [],
    mediaPool: [],
    playheadFrame: 0,
    fps: 24,
    zoom: 2,
    selectedClipId: null,

    setPlayhead: (frame) => set((state) => { state.playheadFrame = frame; }),
    setZoom: (zoom) => set((state) => { state.zoom = zoom; }),
    selectClip: (id) => set((state) => { state.selectedClipId = id; }),
    addMedia: (asset) => set((state) => { state.mediaPool.push(asset); }),
    addClip: (clip) => set((state) => { state.clips.push(clip); }),
    removeClip: (id) => set((state) => { 
      state.clips = state.clips.filter(c => c.id !== id); 
    }),
    updateClip: (id, updates) => set((state) => {
      const clip = state.clips.find(c => c.id === id);
      if (clip) Object.assign(clip, updates);
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
  }))
);
