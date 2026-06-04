import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Scissors, Move, MousePointer, Split } from 'lucide-react';
import { useTimelineStore } from '../../packages/core/timeline-engine';
import { Clip as ClipType, Track } from '../../packages/core/timeline-engine';

const PIXELS_PER_SECOND = 100;
const SNAP_THRESHOLD_FRAMES = 5; // Snap threshold in frames (at 24fps = ~0.2s)

export default function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  
  const {
    tracks,
    clips,
    playheadFrame,
    fps,
    zoom,
    activeTool,
    rippleEnabled,
    setPlayhead,
    setActiveTool,
    splitClip,
    removeClip,
    updateClip,
    setRippleEnabled,
  } = useTimelineStore();

  // Calculate timeline dimensions
  const maxFrame = useMemo(() => {
    const maxClipEnd = Math.max(0, ...clips.map(c => c.startFrame + c.duration));
    return Math.max(maxClipEnd, playheadFrame);
  }, [clips, playheadFrame]);

  const timelineWidth = ((maxFrame / fps) * PIXELS_PER_SECOND * zoom);

  // Convert frame to pixel position
  const frameToPixels = useCallback((frame: number) => {
    return ((frame / fps) * PIXELS_PER_SECOND * zoom);
  }, [fps, zoom]);

  // Convert pixel position to frame
  const pixelsToFrame = useCallback((pixels: number) => {
    return Math.round((pixels / (PIXELS_PER_SECOND * zoom)) * fps);
  }, [fps, zoom]);

  // Snap to clip edges
  const getSnapPosition = useCallback((frame: number) => {
    for (const clip of clips) {
      if (Math.abs(frame - clip.startFrame) < SNAP_THRESHOLD_FRAMES) {
        return clip.startFrame;
      }
      if (Math.abs(frame - (clip.startFrame + clip.duration)) < SNAP_THRESHOLD_FRAMES) {
        return clip.startFrame + clip.duration;
      }
    }
    return frame;
  }, [clips]);

  // Handle timeline click to set playhead
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const frame = getSnapPosition(pixelsToFrame(clickX));
    
    setPlayhead(Math.max(0, frame));
  }, [pixelsToFrame, setPlayhead, getSnapPosition]);

  // Handle playhead drag
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingPlayhead || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    const frame = Math.max(0, getSnapPosition(pixelsToFrame(newX)));
    
    setPlayhead(frame);
  }, [isDraggingPlayhead, pixelsToFrame, setPlayhead, getSnapPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingPlayhead(false);
  }, []);

  // Handle clip trim/move with snap-to-grid
  const handleClipMouseDown = useCallback((e: React.MouseEvent, clip: ClipType, edge: 'left' | 'right' | 'center') => {
    e.stopPropagation();
    
    if (activeTool === 'select') {
      // Select clip
      return;
    }

    const startX = e.clientX;
    const startFrame = clip.startFrame;
    const startDuration = clip.duration;
    
    const handleClipMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let deltaFrames = Math.round((deltaX / (PIXELS_PER_SECOND * zoom)) * fps);
      
      // Apply snap-to-grid for trim/move
      if (edge !== 'center') {
        deltaFrames = Math.round(deltaFrames / SNAP_THRESHOLD_FRAMES) * SNAP_THRESHOLD_FRAMES;
      }
      
      if (edge === 'left' && clip.type === 'video') {
        // Trim start (in point)
        const newStartFrame = Math.max(0, startFrame + deltaFrames);
        const newDuration = startDuration - deltaFrames;
        if (newDuration > 0) {
          const snappedFrame = getSnapPosition(newStartFrame);
          updateClip(clip.id, { 
            startFrame: snappedFrame, 
            duration: startDuration - (snappedFrame - startFrame)
          });
        }
      } else if (edge === 'right' && clip.type === 'video') {
        // Trim end (out point)
        const newDuration = Math.max(1, startDuration + deltaFrames);
        const snappedDuration = getSnapPosition(startFrame + newDuration) - startFrame;
        updateClip(clip.id, { duration: Math.max(1, snappedDuration) });
      } else if (edge === 'center') {
        // Move clip with snap
        const newStartFrame = Math.max(0, startFrame + deltaFrames);
        const snappedFrame = getSnapPosition(newStartFrame);
        updateClip(clip.id, { startFrame: snappedFrame });
      }
    };

    const handleClipMouseUp = () => {
      document.removeEventListener('mousemove', handleClipMouseMove);
      document.removeEventListener('mouseup', handleClipMouseUp);
    };

    document.addEventListener('mousemove', handleClipMouseMove);
    document.addEventListener('mouseup', handleClipMouseUp);
  }, [activeTool, zoom, fps, updateClip, getSnapPosition]);

  return (
    <div className="bg-[#0A0A0F] border-t border-[#2A2430] flex flex-col">
      {/* Toolbar */}
      <div className="h-10 bg-[#141116] border-b border-[#2A2430] flex items-center px-3 gap-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-[#7A6E80] mr-2">Tools</span>
        
        <ToolButton 
          active={activeTool === 'select'} 
          onClick={() => setActiveTool('select')} 
          icon={MousePointer} 
          label="Select"
        />
        <ToolButton 
          active={activeTool === 'cut'} 
          onClick={() => setActiveTool('cut')} 
          icon={Scissors} 
          label="Cut"
        />
        <ToolButton 
          active={activeTool === 'trim'} 
          onClick={() => setActiveTool('trim')} 
          icon={Split} 
          label="Trim"
        />
        <ToolButton 
          active={activeTool === 'hand'} 
          onClick={() => setActiveTool('hand')} 
          icon={Move} 
          label="Hand"
        />
        
        <div className="w-px h-4 bg-[#2A2430] mx-2" />
        
        <button
          onClick={() => setRippleEnabled(!rippleEnabled)}
          className={`px-2 py-1 text-[9px] font-bold uppercase rounded transition-all ${
            rippleEnabled ? "bg-[#F5A623] text-black" : "bg-[#1A161C] text-[#7A6E80] hover:bg-[#2A2430]"
          }`}
        >
          Ripple
        </button>
        
        <div className="flex-1" />
        
        <span className="text-[9px] font-mono text-[#7A6E80]">
          Frame: {playheadFrame}
        </span>
      </div>

      {/* Timeline Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative cursor-crosshair"
        onClick={handleTimelineClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div 
          className="relative h-full min-h-[120px]"
          style={{ width: `${timelineWidth}px` }}
        >
          {/* Time markers */}
          <div className="absolute top-0 left-0 right-0 h-6 border-b border-[#2A2430]">
            {Array.from({ length: Math.ceil(maxFrame / fps / 10) + 1 }, (_, i) => {
              const frame = i * 10 * fps;
              return (
                <div
                  key={frame}
                  className="absolute top-0 text-[7px] text-[#7A6E80] font-mono"
                  style={{ left: `${frameToPixels(frame)}px` }}
                >
                  {Math.floor(frame / fps / 60).toString().padStart(2, '0')}:
                  {Math.floor((frame / fps) % 60).toString().padStart(2, '0')}
                </div>
              );
            })}
          </div>

          {/* Tracks */}
          <div className="absolute top-6 bottom-0 left-0 right-0">
            {tracks.map((track, index) => (
              <TrackLane
                key={track.id}
                track={track}
                clips={clips.filter(c => c.trackId === track.id)}
                index={index}
                frameToPixels={frameToPixels}
                onClipMouseDown={handleClipMouseDown}
              />
            ))}
          </div>

          {/* Playhead */}
          <div
            ref={playheadRef}
            className="absolute top-0 bottom-0 w-0.5 bg-[#F5A623] z-10 cursor-col-resize"
            style={{ left: `${frameToPixels(playheadFrame)}px` }}
            onMouseDown={handlePlayheadMouseDown}
          >
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#F5A623] rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface TrackLaneProps {
  track: Track;
  clips: ClipType[];
  index: number;
  frameToPixels: (frame: number) => number;
  onClipMouseDown: (e: React.MouseEvent, clip: ClipType, edge: 'left' | 'right' | 'center') => void;
}

/**
 * Generate a simple waveform visualization
 * In production, this would use actual audio data from Web Audio API
 */
function Waveform({ width, height }: { width: number; height: number }) {
  const bars = Math.floor(width / 4);
  return (
    <div className="absolute inset-0 flex items-end justify-center gap-px opacity-60">
      {Array.from({ length: bars }).map((_, i) => {
        const barHeight = Math.random() * 0.7 + 0.3; // 30-100% height
        return (
          <div
            key={i}
            className="bg-white/30 w-px"
            style={{ height: `${barHeight * 100}%` }}
          />
        );
      })}
    </div>
  );
}

function TrackLane({ track, clips, index, frameToPixels, onClipMouseDown }: TrackLaneProps) {
  return (
    <div 
      className={`h-12 border-b border-[#2A2430] flex items-center relative ${
        !track.isVisible ? "opacity-40" : ""
      }`}
    >
      <div className="absolute left-2 text-[8px] font-bold text-[#7A6E80] uppercase w-16 truncate">
        {track.name}
      </div>
      
      <div className="absolute left-20 right-0 top-0 bottom-0">
        {clips.map(clip => (
          <div
            key={clip.id}
            className="absolute h-8 top-2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-[#F5A623]/50 rounded cursor-pointer group overflow-hidden"
            style={{
              left: `${frameToPixels(clip.startFrame)}px`,
              width: `${frameToPixels(clip.duration)}px`,
            }}
            onMouseDown={(e) => onClipMouseDown(e, clip, 'center')}
          >
            {/* Waveform for audio clips */}
            {clip.type === 'audio' && (
              <Waveform width={frameToPixels(clip.duration)} height={32} />
            )}
            
            <div className="h-full px-2 flex items-center text-[8px] text-[#F0E8D8] truncate relative z-10">
              {clip.name}
            </div>
            
            {/* Trim handles */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 bg-[#F5A623]/50 opacity-0 group-hover:opacity-100 cursor-w-resize"
              onMouseDown={(e) => onClipMouseDown(e, clip, 'left')}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-1 bg-[#F5A623]/50 opacity-0 group-hover:opacity-100 cursor-e-resize"
              onMouseDown={(e) => onClipMouseDown(e, clip, 'right')}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolButton({ active, onClick, icon: Icon, label }: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string; 
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded transition-all ${
        active ? "bg-[#F5A623] text-black" : "text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F0E8D8]"
      }`}
      title={label}
    >
      <Icon size={12} />
    </button>
  );
}