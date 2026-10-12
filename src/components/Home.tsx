import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Timeline from './Timeline';
import SmartCut, { CutPoint } from './SmartCut';
import { Play, Pause, Volume2, SlidersHorizontal, Film, Sparkles, Users } from 'lucide-react';
import { useTimelineStore } from '../../packages/core/timeline-engine';
import { useCollaboration } from '../utils/collaboration';
import { supabase } from '../lib/supabase';

const lutPresets: Record<string, string> = {
  none: 'none',
  cinematic: 'contrast(1.08) saturate(1.25) brightness(0.95)',
  vivid: 'saturate(1.4) contrast(1.08) brightness(1.03)',
  warm: 'sepia(0.15) saturate(1.2) contrast(1.03)',
};

const formatTimecode = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * 24);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
};

/**
 * Find the active clip at a given playhead frame
 * Returns the clip and the relative time offset within that clip
 */
function findActiveClip(playheadFrame: number, clips: any[], fps: number) {
  // Sort clips by start frame
  const sortedClips = [...clips].sort((a, b) => a.startFrame - b.startFrame);
  
  for (let i = sortedClips.length - 1; i >= 0; i--) {
    const clip = sortedClips[i];
    const clipEndFrame = clip.startFrame + clip.duration;
    
    if (playheadFrame >= clip.startFrame && playheadFrame < clipEndFrame) {
      // Found the active clip
      const relativeFrame = playheadFrame - clip.startFrame;
      return { clip, relativeFrame, isActive: true };
    }
  }
  
  // No clip found - check if playhead is before all clips (show first clip at start)
  const firstClip = sortedClips[0];
  if (firstClip && playheadFrame < firstClip.startFrame) {
    return { clip: firstClip, relativeFrame: 0, isActive: false };
  }
  
  // After all clips - show last clip at end
  const lastClip = sortedClips[sortedClips.length - 1];
  if (lastClip && playheadFrame >= lastClip.startFrame + lastClip.duration) {
    return { clip: lastClip, relativeFrame: lastClip.duration, isActive: false };
  }
  
  // Find clip that starts after playhead (for gaps)
  const nextClip = sortedClips.find(c => c.startFrame > playheadFrame);
  if (nextClip && nextClip.startFrame > 0) {
    const prevClip = sortedClips[sortedClips.indexOf(nextClip) - 1];
    if (prevClip) {
      return { clip: prevClip, relativeFrame: prevClip.duration, isActive: false };
    }
  }
  
  return { clip: null, relativeFrame: 0, isActive: false };
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [searchParams] = useSearchParams();
  
  // Get project ID from URL params
  const projectId = searchParams.get('project');
  
  // Local UI state
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(10);
  const [speed, setSpeed] = useState(1);
  const [gain, setGain] = useState(1);
  const [lut, setLut] = useState('none');
  const [cuts, setCuts] = useState<CutPoint[]>([]);
  const [userId, setUserId] = useState<string>('anonymous');

  // Timeline store state
  const timelineState = useTimelineStore();
  const mediaPool = (timelineState as any).mediaPool;
  const clips = (timelineState as any).clips;
  const selectedMediaId = (timelineState as any).selectedMediaId;
  const fps = (timelineState as any).fps;
  const playheadFrame = (timelineState as any).playheadFrame;
  const setPlayhead = (timelineState as any).setPlayhead;
  const addMedia = (timelineState as any).addMedia;
  const addClip = (timelineState as any).addClip;
  const selectMedia = (timelineState as any).selectMedia;
  const updateClip = (timelineState as any).updateClip;

  // Initialize user ID from Supabase
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted && user?.id) setUserId(user.id);
    }).catch(() => {
      // Public preview mode has no session; keep the editor usable as a guest.
    });
    return () => { mounted = false; };
  }, []);

// Collaboration hook
   const { isConnected, state: collabState } = useCollaboration(projectId, userId);

   // Get active clip based on playhead position for multi-clip preview
  const { clip: activeClip, relativeFrame } = findActiveClip(playheadFrame, clips, fps);
  const activeMedia = activeClip ? mediaPool.find(m => m.id === activeClip.assetId) : null;
  const videoSrc = activeMedia?.url || '';

  // Track which clip is currently playing for preview switching
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  // Handle video drop - add to timeline store
  const onDropVideo = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      const assetId = Math.random().toString(36).substr(2, 9);
      
      // Add to media pool and select it
      addMedia({
        id: assetId,
        name: file.name,
        url,
        duration: 0, // Will be updated on metadata load
        width: 1920,
        height: 1080,
        type: 'video',
      });
      selectMedia(assetId);
      
      // Also add a clip on track v1
      addClip({
        id: Math.random().toString(36).substr(2, 9),
        assetId,
        name: file.name,
        type: 'video',
        startFrame: 0,
        duration: 0, // Will be updated on metadata load
        trackId: 'v1',
        effects: [],
      });
    }
  }, [addMedia, selectMedia, addClip]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      const assetId = Math.random().toString(36).substr(2, 9);
      
      addMedia({
        id: assetId,
        name: file.name,
        url,
        duration: 0,
        width: 1920,
        height: 1080,
        type: 'video',
      });
      selectMedia(assetId);
      
      // Add a clip on track v1
      addClip({
        id: Math.random().toString(36).substr(2, 9),
        assetId,
        name: file.name,
        type: 'video',
        startFrame: 0,
        duration: 0,
        trackId: 'v1',
        effects: [],
      });
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    setPlayhead(Math.floor(time * fps));
    
    if (time >= outPoint) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const onSetIn = () => {
    setInPoint(currentTime);
    setPlayhead(Math.floor(currentTime * fps));
  };

  const onSetOut = () => {
    setOutPoint(currentTime);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      videoRef.current.volume = gain;
    }
  }, [speed, gain]);

  // Sync playhead to video
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - playheadFrame / fps) > 0.1) {
      videoRef.current.currentTime = playheadFrame / fps;
    }
  }, [playheadFrame, fps]);

  // Sync video source when active clip changes (multi-clip preview)
  useEffect(() => {
    if (!videoRef.current || !activeClip) return;
    
    const currentSrc = videoRef.current.src;
    const newSrc = activeMedia?.url || '';
    
    if (activeClip.id !== playingClipId && currentSrc !== newSrc) {
      setPlayingClipId(activeClip.id);
      videoRef.current.src = newSrc;
      // Set the time to the relative position within the clip
      videoRef.current.currentTime = relativeFrame / fps;
    } else if (playingClipId !== activeClip.id) {
      // Just update the time if we're still on the same video
      videoRef.current.currentTime = relativeFrame / fps;
    }
  }, [activeClip?.id, activeMedia?.url, playingClipId, relativeFrame, fps]);

  // Update onLoadedMetadata to work with active clip
  const onLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || 0;
    
    // Update media asset duration in store
    if (activeMedia) {
      addMedia({ ...activeMedia, duration: dur });
      
      // Update clip duration (find clip for this media asset)
      const clip = clips.find(c => c.assetId === activeMedia.id && c.id === activeClip?.id);
      if (clip) {
        updateClip(clip.id, { duration: Math.floor(dur * fps) });
      }
    }
    
    setDuration(dur);
    setOutPoint(dur);
  };

  // Keyboard shortcuts (industry standard: J/K/L for jog/shuttle, I/O for in/out)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Play/Pause - Space
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }

      // Frame step - Left/Right arrows
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime(prev => {
          const newTime = Math.max(0, prev - 1 / fps);
          setPlayhead(Math.floor(newTime * fps));
          return newTime;
        });
        return;
      }

      if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime(prev => {
          const newTime = Math.min(duration, prev + 1 / fps);
          setPlayhead(Math.floor(newTime * fps));
          return newTime;
        });
        return;
      }

      // Set In - I
      if (e.code === 'KeyI') {
        e.preventDefault();
        onSetIn();
        return;
      }

      // Set Out - O
      if (e.code === 'KeyO') {
        e.preventDefault();
        onSetOut();
        return;
      }

      // Jog/Shuttle - J (reverse), K (stop), L (forward)
      if (e.code === 'KeyJ') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.playbackRate = -4;
          videoRef.current.play();
          setIsPlaying(true);
        }
        return;
      }

      if (e.code === 'KeyK') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        return;
      }

      if (e.code === 'KeyL') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.playbackRate = 4;
          videoRef.current.play();
          setIsPlaying(true);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fps, duration, setPlayhead, togglePlay, onSetIn, onSetOut]);

  const rangeStart = duration > 0 ? (inPoint / duration) * 100 : 0;
  const rangeWidth = duration > 0 ? Math.max(1, ((outPoint - inPoint) / duration) * 100) : 0;
  const frameLabel = useMemo(() => Math.floor(currentTime * fps), [currentTime, fps]);

  const onApplyCuts = (newCuts: CutPoint[]) => {
    setCuts(newCuts);
  };

  const lutClass = lut === 'cinematic' ? 'filter-cinematic' : lut === 'vivid' ? 'filter-vivid' : lut === 'warm' ? 'filter-warm' : 'filter-default';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#08090c] text-[#f2f0eb]">
      {/* Compact workspace context: global navigation lives in EditorLayout */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0b0c10] px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#777982]">Editing workspace</p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold text-[#f1eee6]">Untitled sequence</h1>
            <span className="rounded border border-white/[0.08] px-1.5 py-0.5 text-[9px] text-[#777982]">24 FPS</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-2 text-[#a0a1a9]"><Film size={13} className="mr-1.5 inline text-[#f4b84a]"/>Browser editor</span>
          {projectId && <span className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 ${isConnected ? "border-emerald-400/20 text-emerald-300" : "border-white/[0.08] text-[#777982]"}`}><Users size={12}/>{isConnected ? `${collabState.collaborators.length + 1} online` : "Collaboration offline"}</span>}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left Panel - Preview & Controls */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-3 sm:p-4 lg:flex-row lg:overflow-hidden">
          {/* Preview Screen */}
          <div className="flex min-h-[420px] min-w-0 flex-1 flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#0e0f13] p-3 sm:p-4 lg:min-h-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#9E9CA8]">Play Screen</p>
                <h2 className="text-lg font-bold text-white">Preview & Playback</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#D8D3E5]">
                <span className="px-2 py-1 rounded bg-[#1E1A26] border border-[#323040]">Timecode: {formatTimecode(currentTime)}</span>
                <span className="px-2 py-1 rounded bg-[#1E1A26] border border-[#323040]">Frame: {frameLabel}</span>
              </div>
            </div>

            <div
              className="h-64 rounded-xl border border-[#2A2430] bg-[#0B0A10] flex items-center justify-center relative overflow-hidden"
              onDrop={onDropVideo}
              onDragOver={(e) => e.preventDefault()}
            >
              {videoSrc ? (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className={`h-full w-full object-contain ${lutClass}`}
                  onLoadedMetadata={onLoadedMetadata}
                  onTimeUpdate={onTimeUpdate}
                />
              ) : (
                <div className="text-center text-[#9B91A8]">
                  <p className="text-sm">Drop a video file here</p>
                  <p className="text-xs text-[#7A7288]">or use the upload button below.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={togglePlay} className="rounded-lg bg-[#F5A623] text-black py-2 font-bold flex items-center justify-center gap-2 hover:bg-[#f8c34b] transition">
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <label className="rounded-lg border border-[#2D2B3C] bg-[#171726] py-2 px-3 text-sm flex justify-between items-center gap-2 cursor-pointer text-[#E2DDED]">
                Upload
                <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-2 text-xs text-[#DDD]">
              <div className="rounded-lg border border-[#2A2430] p-2 bg-[#15141E]">
                <label htmlFor="speedRange" className="flex justify-between"><span>Playback Speed</span><span>{speed.toFixed(2)}x</span></label>
                <input id="speedRange" title="Playback speed" type="range" min="0.25" max="2" step="0.05" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full mt-1 accent-[#F5A623]" />
              </div>
              <div className="rounded-lg border border-[#2A2430] p-2 bg-[#15141E]">
                <label htmlFor="gainRange" className="flex justify-between"><span>Audio Gain</span><span>{(gain * 100).toFixed(0)}%</span></label>
                <input id="gainRange" title="Audio gain" type="range" min="0.2" max="2" step="0.05" value={gain} onChange={(e) => setGain(Number(e.target.value))} className="w-full mt-1 accent-[#F5A623]" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center text-xs mt-2">
              {['none', 'cinematic', 'vivid', 'warm'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setLut(preset)}
                  className={`rounded-full px-3 py-1 border ${lut === preset ? 'bg-[#F5A623] border-[#F5A623] text-black' : 'border-[#2D2A3B] text-[#DDD]'}`}
                >
                  {preset === 'none' ? 'Default' : preset}
                </button>
              ))}
            </div>
          </div>

          {/* In/Out Controls */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0e0f13] p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-[#B2A8C2]">Editor</p>
                <h2 className="text-lg font-semibold">Timeline & Stretch</h2>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-[#1E1A27] px-2 py-1 text-xs border border-[#2D2B3B]">
                <SlidersHorizontal size={14} /> Live edits
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-[#2B2A37] bg-[#14141D] p-3">
              <div className="flex justify-between text-xs text-[#C4C0CE] mb-1">
                <span>In: {formatTimecode(inPoint)}</span>
                <span>Out: {formatTimecode(outPoint)}</span>
                <span>Range: {formatTimecode(Math.max(0, outPoint - inPoint))}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#2A2937] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#F5A623]/40 to-[#FF7A7A]/30" />
                <div
                  className="absolute top-0 h-full bg-[#F5A623] rounded-full"
                  style={{ left: `${rangeStart}%`, width: `${rangeWidth}%` }}
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <button className="rounded-md bg-[#252032] p-2 text-left" onClick={onSetIn}>Set In @ current</button>
                <button className="rounded-md bg-[#252032] p-2 text-left" onClick={onSetOut}>Set Out @ current</button>
                <div className="rounded-md bg-[#252032] p-2">
                  Frame: {frameLabel} | {formatTimecode(currentTime)}
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-[#CCC]">
              <p className="font-semibold mb-1">Editing Features</p>
              <ul className="list-disc list-inside space-y-1 text-[#B8B0C8]">
                <li>Drop video in preview area to load.</li>
                <li>Use In/Out to mark perfect edit frames.</li>
                <li>Adjust playback speed to stretch/slow motion.</li>
                <li>Add LUT filters for color grading.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Panel - SmartCut */}
        <div className="flex max-h-[42vh] w-full shrink-0 flex-col overflow-y-auto border-t border-white/[0.07] bg-[#0b0c10] lg:max-h-none lg:w-[300px] lg:border-l lg:border-t-0">
          <SmartCut onApply={onApplyCuts} fps={24} videoRef={videoRef} />
          <div className="p-3 sm:p-4">
            <p className="text-xs uppercase text-[#B0A7BF] mb-2">Applied cuts</p>
            {cuts.length === 0 ? (
              <p className="text-[#9B91A8] text-sm">No cuts applied yet.</p>
            ) : (
              <ul className="space-y-1 text-sm text-[#E5E0EA]">
                {cuts.map((cut) => (
                  <li key={cut.id} className="rounded-md bg-[#1A1824] p-2 border border-[#2D2A3F]">
                    {cut.type} | {formatTimecode(cut.startFrame / 24)} - {formatTimecode(cut.endFrame / 24)} | {Math.round(cut.confidence * 100)}%
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-[#9A8FB5]">Frame stretching is done using playback speed and in/out marking.</p>
          </div>
        </div>
      </div>

      {/* Timeline Bar */}
      <div className="h-[190px] min-h-[160px] shrink-0 border-t border-white/[0.07] bg-[#0b0c10] sm:h-[220px]"><Timeline /></div>
    </div>
  );
}