import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, SkipBack, SkipForward, Scissors, MousePointer2, 
  Hand, Search, Plus, Layers, Video, Music, Type, Sparkles, 
  Settings, Download, Maximize2, Volume2, Clock, ChevronRight, 
  ChevronDown, ChevronUp, MoreVertical, Trash2, Palette, Monitor, Smartphone, 
  Cpu, Globe, Zap, Box, Activity, Terminal, Eye, EyeOff, Lock, Unlock, ArrowRightLeft,
  X, Move, Circle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Core Logic Simulation ---
import { useTimelineStore } from "../packages/core/timeline-engine";
import ColorNodeEditor from "./components/ColorNodeEditor";
import AICommandCenter from "./components/AICommandCenter";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Theme ---
const THEME = {
  bg: "#070608",
  surface: "#141116",
  panel: "#1A161C",
  border: "#2A2430",
  gold: "#F5A623",
  amber: "#FF8C00",
  text: "#F0E8D8",
  muted: "#7A6E80",
};

export default function App() {
  const { 
    tracks, clips, mediaPool, playheadFrame, zoom, selectedClipId, activeTool,
    rippleEnabled, setRippleEnabled,
    setPlayhead, setZoom, selectClip, updateClip, removeClip, addMedia, addClip, 
    toggleTrackVisibility, toggleTrackLock, setActiveTool, splitClip,
    updateClipColorNodes, updateClipColorConnections
  } = useTimelineStore();
  const [activeTab, setActiveTab] = useState<'media' | 'ai' | 'effects'>('media');
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showColorNodeEditor, setShowColorNodeEditor] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        // Only delete if not typing in an input
        if (document.activeElement?.tagName !== "INPUT" && selectedClipId) {
          removeClip(selectedClipId);
          selectClip(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedClipId, removeClip, selectClip]);

  // Layout state
  const [timelineHeight, setTimelineHeight] = useState(320);
  const [isResizingTimeline, setIsResizingTimeline] = useState(false);
  const [showSidePanels, setShowSidePanels] = useState(true);

  // Dragging state
  const [dragState, setDragState] = useState<{
    clipId: string;
    type: 'move' | 'trim-start' | 'trim-end';
    startMouseX: number;
    startFrame: number;
    startDuration: number;
  } | null>(null);

  const selectedClip = clips.find(c => c.id === selectedClipId);
  
  // Animation loop for playhead
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayhead(playheadFrame + 1);
      }, 1000 / 24);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playheadFrame, setPlayhead]);

  // Global drag handlers
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startMouseX;
      const deltaFrames = Math.round(deltaX / zoom);

      if (dragState.type === 'move') {
        const newStartFrame = Math.max(0, dragState.startFrame + deltaFrames);
        updateClip(dragState.clipId, { startFrame: newStartFrame });
      } else if (dragState.type === 'trim-start') {
        const newStartFrame = Math.max(0, Math.min(dragState.startFrame + dragState.startDuration - 1, dragState.startFrame + deltaFrames));
        const newDuration = dragState.startDuration - (newStartFrame - dragState.startFrame);
        updateClip(dragState.clipId, { startFrame: newStartFrame, duration: newDuration });
      } else if (dragState.type === 'trim-end') {
        const newDuration = Math.max(1, dragState.startDuration + deltaFrames);
        updateClip(dragState.clipId, { duration: newDuration });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, zoom, updateClip]);

  // Timeline resize handler
  useEffect(() => {
    if (!isResizingTimeline) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      setTimelineHeight(Math.max(150, Math.min(window.innerHeight - 200, newHeight)));
    };

    const handleMouseUp = () => {
      setIsResizingTimeline(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingTimeline]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    
    // Extract metadata and generate thumbnail
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      // Seek to 0.5 seconds for a representative frame
      video.currentTime = Math.min(0.5, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);

      const asset = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: url,
        thumbnailUrl: thumbnailUrl,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        type: 'video' as const
      };
      
      addMedia(asset);
      
      // Automatically add to timeline for demonstration as requested
      const newClip = {
        id: Math.random().toString(36).substr(2, 9),
        assetId: asset.id,
        name: asset.name,
        type: 'video' as const,
        startFrame: playheadFrame,
        duration: Math.floor(video.duration * 24),
        trackId: 'v1',
        effects: []
      };
      addClip(newClip);
    };
  };

  const formatTimecode = (frames: number) => {
    const f = frames % 24;
    const s = Math.floor(frames / 24) % 60;
    const m = Math.floor(frames / (24 * 60)) % 60;
    const h = Math.floor(frames / (24 * 60 * 60));
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-[#070608] text-[#F0E8D8] font-sans flex flex-col overflow-hidden selection:bg-[#F5A623] selection:text-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=JetBrains+Mono:wght@400;500&family=Nunito+Sans:wght@400;600;700&display=swap');
        ::-webkit-scrollbar { width: 4px; height: 4px; background: #0E0B0F; }
        ::-webkit-scrollbar-thumb { background: #2A2430; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3D3545; }
        .timeline-grid {
          background-image: linear-gradient(to right, #2A2430 1px, transparent 1px);
          background-size: ${zoom * 20}px 100%;
        }
      `}</style>

      {/* --- Top Navbar --- */}
      <header className="h-12 border-b border-[#2A2430] bg-[#0E0B0F] flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-[#F5A623] flex items-center justify-center text-[#F5A623] font-black text-xs">L</div>
            <span className="font-['Cinzel'] font-black text-sm tracking-widest text-[#F5A623]">LUMINA STUDIO</span>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#7A6E80]">
            <button className="text-[#F0E8D8] hover:text-[#F5A623] transition-colors">Project</button>
            <button className="hover:text-[#F5A623] transition-colors">Edit</button>
            <button className="hover:text-[#F5A623] transition-colors">AI Tools</button>
            <button className="hover:text-[#F5A623] transition-colors">Render</button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#1A161C] border border-[#2A2430] rounded-full">
            <Cpu size={12} className="text-[#F5A623]" />
            <span className="text-[9px] font-mono text-[#F5A623]">GPU ACCELERATED</span>
          </div>
          <button className="bg-[#F5A623] text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#FF8C00] transition-colors shadow-[0_0_15px_rgba(245,166,35,0.2)]">
            <Download size={14} />
            Export .LUMINA
          </button>
        </div>
      </header>

      {/* --- Main Workspace --- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Assets */}
        {showSidePanels && (
          <div className="w-[300px] border-r border-[#2A2430] flex flex-col shrink-0 bg-[#0E0B0F]">
          <div className="flex border-b border-[#2A2430]">
            <TabBtn active={activeTab === 'media'} onClick={() => setActiveTab('media')} label="Media" icon={<Video size={14} />} />
            <TabBtn active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} label="AI Studio" icon={<Sparkles size={14} />} />
          </div>

          <div className="flex-1 overflow-y-auto p-3">
             {activeTab === 'media' ? (
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <span className="text-[10px] font-bold text-[#7A6E80] uppercase tracking-widest">Media Pool</span>
                   <button onClick={handleImportClick} className="p-1 hover:bg-[#1A161C] rounded transition-colors">
                     <Plus size={14} className="text-[#F5A623]" />
                   </button>
                   <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="video/*" 
                    className="hidden" 
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   {mediaPool.length === 0 && (
                     <div className="col-span-2 py-8 border-2 border-dashed border-[#2A2430] rounded-xl flex flex-col items-center justify-center gap-2 opacity-40">
                       <Video size={24} />
                       <span className="text-[8px] uppercase tracking-widest font-bold">No media imported</span>
                     </div>
                   )}
                   {mediaPool.map(asset => (
                     <div key={asset.id} className="aspect-video bg-[#141116] border border-[#2A2430] rounded-lg overflow-hidden relative group cursor-pointer hover:border-[#F5A623]">
                       {asset.thumbnailUrl ? (
                         <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                       ) : (
                         <video src={asset.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                       )}
                       <div className="absolute top-1 left-1 bg-black/60 px-1 rounded text-[7px] font-mono text-[#F5A623]">
                         {asset.width}x{asset.height}
                       </div>
                       <div className="absolute bottom-1 right-1 text-[8px] bg-black/80 px-1 rounded font-mono">
                         {Math.floor(asset.duration / 60)}:{(Math.floor(asset.duration) % 60).toString().padStart(2, '0')}
                       </div>
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[8px] font-black uppercase tracking-widest text-[#F5A623]">Imported</span>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             ) : (
               <AICommandCenter />
             )}
          </div>
        </div>
        )}

        {/* Center: Preview */}
        <div className="flex-1 flex flex-col bg-[#070608]">
          <div className="h-8 bg-[#141116] border-b border-[#2A2430] flex items-center justify-between px-3">
            <span className="text-[9px] font-bold text-[#7A6E80] uppercase tracking-widest">Program Monitor - 1080p 24fps</span>
            <div className="flex items-center gap-2">
              <Monitor size={12} className="text-[#F5A623]" />
              <span className="text-[9px] font-mono text-[#F5A623]">Live Preview</span>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-8 relative">
            <div className="w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl border border-[#2A2430] overflow-hidden relative group">
              <img src="https://picsum.photos/seed/lumina/1280/720" alt="Preview" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 rounded-full bg-[#F5A623]/90 text-black flex items-center justify-center shadow-2xl">
                  {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>
              </div>
            </div>
          </div>

          {/* Player Controls */}
          <div className="h-14 bg-[#0E0B0F] border-t border-[#2A2430] flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <span className="font-mono text-lg font-bold text-[#F5A623] tracking-tighter">{formatTimecode(playheadFrame)}</span>
              <div className="flex items-center gap-1">
                <PlayerBtn icon={<SkipBack size={16} />} />
                <PlayerBtn icon={isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />} onClick={() => setIsPlaying(!isPlaying)} active />
                <PlayerBtn icon={<SkipForward size={16} />} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-[#7A6E80]" />
                <div className="w-24 h-1 bg-[#2A2430] rounded-full relative">
                  <div className="absolute inset-y-0 left-0 w-3/4 bg-[#F5A623] rounded-full" />
                </div>
              </div>
              <button 
                onClick={() => setShowSidePanels(!showSidePanels)}
                className={cn(
                  "p-1.5 rounded transition-all",
                  !showSidePanels ? "bg-[#F5A623] text-black" : "text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F0E8D8]"
                )}
                title="Toggle Side Panels"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Inspector */}
        {showSidePanels && (
          <div className="w-[300px] border-l border-[#2A2430] flex flex-col shrink-0 bg-[#0E0B0F]">
            <div className="h-10 bg-[#141116] border-b border-[#2A2430] px-3 flex items-center gap-2">
              <Settings size={14} className="text-[#F5A623]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F0E8D8]">Inspector</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {selectedClip ? (
                <InspectorSection title="Clip Properties" defaultOpen>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-[#7A6E80] uppercase tracking-tighter">Clip Name</label>
                      <input 
                        type="text" 
                        value={selectedClip.name}
                        onChange={(e) => updateClip(selectedClip.id, { name: e.target.value })}
                        className="w-full bg-black/40 border border-[#2A2430] rounded-lg p-2 text-[10px] text-[#F5A623] focus:outline-none focus:border-[#F5A623]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[#7A6E80] uppercase tracking-tighter">Start Frame</label>
                        <input 
                          type="number" 
                          value={selectedClip.startFrame}
                          onChange={(e) => updateClip(selectedClip.id, { startFrame: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black/40 border border-[#2A2430] rounded-lg p-2 text-[10px] text-[#F5A623] focus:outline-none focus:border-[#F5A623]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[#7A6E80] uppercase tracking-tighter">Duration (F)</label>
                        <input 
                          type="number" 
                          value={selectedClip.duration}
                          onChange={(e) => updateClip(selectedClip.id, { duration: parseInt(e.target.value) || 1 })}
                          className="w-full bg-black/40 border border-[#2A2430] rounded-lg p-2 text-[10px] text-[#F5A623] focus:outline-none focus:border-[#F5A623]"
                        />
                      </div>
                    </div>
                    <div className="pt-2 grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => selectClip(null)}
                        className="py-2 border border-[#2A2430] rounded-lg text-[9px] font-bold uppercase tracking-widest text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F0E8D8] transition-all"
                      >
                        Deselect
                      </button>
                      <button 
                        onClick={() => {
                          removeClip(selectedClip.id);
                          selectClip(null);
                        }}
                        className="py-2 border border-red-900/30 bg-red-900/10 rounded-lg text-[9px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-900/20 transition-all flex items-center justify-center gap-1"
                      >
                        <Trash2 size={10} />
                        Delete
                      </button>
                    </div>
                  </div>
                </InspectorSection>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-4">
                  <MousePointer2 size={32} className="mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Select a clip to inspect properties</p>
                </div>
              )}

              {selectedClip && (
                <>
                  <InspectorSection title="Video Transform">
                    <div className="space-y-4">
                      <Slider label="Position X" value={0} />
                      <Slider label="Position Y" value={0} />
                      <Slider label="Scale" value={100} />
                      <Slider label="Rotation" value={0} />
                    </div>
                  </InspectorSection>
                  <InspectorSection title="Color Grading">
                    <div className="space-y-4">
                      <button 
                        onClick={() => setShowColorNodeEditor(true)}
                        className="w-full py-4 bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-xl flex flex-col items-center gap-2 group hover:bg-[#F5A623]/20 transition-all"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#F5A623]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Sparkles size={20} className="text-[#F5A623]" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#F5A623]">Open Node Editor</span>
                        <p className="text-[8px] text-[#7A6E80] px-4 text-center">Advanced node-based color grading workflow</p>
                      </button>
                      
                      <div className="pt-4 border-t border-[#2A2430] space-y-4">
                        <div className="flex justify-center py-2">
                          <div className="w-24 h-24 rounded-full border-2 border-[#2A2430] relative bg-gradient-to-tr from-blue-900 via-green-900 to-red-900 opacity-50">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white shadow-xl shadow-white/50" />
                            </div>
                          </div>
                        </div>
                        <Slider label="Exposure" value={0} />
                        <Slider label="Contrast" value={10} />
                        <Slider label="Saturation" value={100} />
                      </div>
                    </div>
                  </InspectorSection>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Color Node Editor Modal */}
      <AnimatePresence>
        {showColorNodeEditor && selectedClip && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full h-full max-w-6xl max-h-[800px] bg-[#070608] border border-[#2A2430] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="h-12 bg-[#141116] border-b border-[#2A2430] flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5A623]/20 flex items-center justify-center">
                    <Sparkles size={16} className="text-[#F5A623]" />
                  </div>
                  <div>
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-[#F0E8D8]">Lumina Color Grade</h2>
                    <p className="text-[9px] text-[#7A6E80] font-bold uppercase tracking-tighter">Clip: {selectedClip.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowColorNodeEditor(false)}
                  className="p-2 rounded-full hover:bg-[#1A161C] text-[#7A6E80] hover:text-[#F0E8D8] transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ColorNodeEditor 
                  clip={selectedClip}
                  onUpdateNodes={(nodes) => updateClipColorNodes(selectedClip.id, nodes)}
                  onUpdateConnections={(conns) => updateClipColorConnections(selectedClip.id, conns)}
                />
              </div>
              <div className="h-10 bg-[#141116] border-t border-[#2A2430] flex items-center justify-between px-6">
                <div className="flex items-center gap-4 text-[9px] font-bold text-[#7A6E80] uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Move size={12} />
                    <span>Middle Mouse to Pan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Circle size={8} className="fill-[#F5A623] text-[#F5A623]" />
                    <span>Click ports to connect</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowColorNodeEditor(false)}
                  className="px-4 py-1.5 bg-[#F5A623] text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#FF8C00] transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline Resizer */}
      <div 
        className="h-1 bg-[#2A2430] hover:bg-[#F5A623] cursor-ns-resize transition-colors z-50"
        onMouseDown={() => setIsResizingTimeline(true)}
      />

      {/* --- Timeline --- */}
      <div 
        style={{ height: `${timelineHeight}px` }}
        className="bg-[#070608] border-t border-[#2A2430] flex flex-col shrink-0"
      >
        <div className="h-10 bg-[#0E0B0F] border-b border-[#2A2430] flex items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <ToolBtn icon={<MousePointer2 size={14} />} active={activeTool === 'select'} onClick={() => setActiveTool('select')} />
            <ToolBtn icon={<Scissors size={14} />} active={activeTool === 'cut'} onClick={() => setActiveTool('cut')} />
            <ToolBtn icon={<Activity size={14} />} active={activeTool === 'trim'} onClick={() => setActiveTool('trim')} />
            <ToolBtn icon={<Hand size={14} />} active={activeTool === 'hand'} onClick={() => setActiveTool('hand')} />
            <div className="w-px h-4 bg-[#2A2430] mx-1" />
            <button 
              onClick={() => setRippleEnabled(!rippleEnabled)}
              className={cn(
                "flex items-center gap-1.5 px-2 h-7 rounded text-[9px] font-bold uppercase tracking-wider transition-all",
                rippleEnabled 
                  ? "bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/30" 
                  : "text-[#7A6E80] hover:bg-[#1A161C] border border-transparent"
              )}
              title="Ripple Edit: Shift subsequent clips when trimming or deleting"
            >
              <ArrowRightLeft size={12} />
              <span>Ripple</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setTimelineHeight(timelineHeight > 100 ? 40 : 320)}
                className="p-1.5 rounded text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F0E8D8] transition-all"
                title={timelineHeight > 100 ? "Minimize Timeline" : "Restore Timeline"}
              >
                {timelineHeight > 100 ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
              <div className="w-px h-4 bg-[#2A2430] mx-1" />
              <Search size={12} className="text-[#7A6E80]" />
              <input 
                type="range" 
                min="0.5" 
                max="10" 
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-32 accent-[#F5A623] h-1 bg-[#2A2430] rounded-full appearance-none cursor-pointer" 
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#7A6E80]">
              <Clock size={12} />
              <span>00:00:30:00</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative timeline-grid">
          {tracks.map(track => (
            <div key={track.id} className={cn(
              "flex border-b border-[#2A2430] min-h-[48px]",
              !track.isVisible && "opacity-30"
            )}>
              <div className="w-40 bg-[#141116] border-r border-[#2A2430] p-2 flex items-center justify-between shrink-0 sticky left-0 z-20">
                <div className="flex items-center gap-2 overflow-hidden">
                  {track.type === 'video' ? <Video size={12} className="text-blue-400 shrink-0" /> : <Music size={12} className="text-green-400 shrink-0" />}
                  <span className="text-[9px] font-bold text-[#7A6E80] uppercase truncate">{track.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => toggleTrackVisibility(track.id)}
                    className={cn("p-1 rounded hover:bg-[#2A2430] transition-colors", !track.isVisible && "text-[#F5A623]")}
                  >
                    {track.isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
                  </button>
                  <button 
                    onClick={() => toggleTrackLock(track.id)}
                    className={cn("p-1 rounded hover:bg-[#2A2430] transition-colors", track.isLocked && "text-[#F5A623]")}
                  >
                    {track.isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                  </button>
                </div>
              </div>
              <div className="flex-1 relative h-12" onClick={() => selectClip(null)}>
                {track.isVisible && clips.filter(c => c.trackId === track.id).map(clip => (
                  <div 
                    key={clip.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeTool === 'select') {
                        selectClip(clip.id);
                      } else if (activeTool === 'cut') {
                        splitClip(clip.id, playheadFrame);
                      }
                    }}
                    className={cn(
                      "absolute top-1 bottom-1 rounded border border-white/10 flex items-center px-2 overflow-hidden cursor-pointer transition-all",
                      clip.type === 'video' ? "bg-blue-600/40" : "bg-green-600/40",
                      track.isLocked && "cursor-not-allowed opacity-80",
                      selectedClipId === clip.id && "border-[#F5A623] ring-1 ring-[#F5A623] ring-inset bg-opacity-60",
                      activeTool === 'cut' && "hover:border-red-500 hover:ring-1 hover:ring-red-500",
                      activeTool === 'hand' && "cursor-grab active:cursor-grabbing"
                    )} 
                    style={{ left: `${clip.startFrame * zoom}px`, width: `${clip.duration * zoom}px` }}
                    onMouseDown={(e) => {
                      if (track.isLocked) return;
                      if (activeTool === 'hand' || activeTool === 'select') {
                        setDragState({
                          clipId: clip.id,
                          type: 'move',
                          startMouseX: e.clientX,
                          startFrame: clip.startFrame,
                          startDuration: clip.duration
                        });
                      }
                    }}
                  >
                    {/* Trim Handles */}
                    {activeTool === 'trim' && !track.isLocked && (
                      <>
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-2 bg-white/20 hover:bg-[#F5A623] cursor-col-resize z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              clipId: clip.id,
                              type: 'trim-start',
                              startMouseX: e.clientX,
                              startFrame: clip.startFrame,
                              startDuration: clip.duration
                            });
                          }}
                        />
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-2 bg-white/20 hover:bg-[#F5A623] cursor-col-resize z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              clipId: clip.id,
                              type: 'trim-end',
                              startMouseX: e.clientX,
                              startFrame: clip.startFrame,
                              startDuration: clip.duration
                            });
                          }}
                        />
                      </>
                    )}
                    {track.isLocked && <Lock size={8} className="mr-1 shrink-0" />}
                    <span className="text-[8px] font-bold truncate pointer-events-none">{clip.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-[#F5A623] z-30 pointer-events-none transition-all duration-75" 
            style={{ left: `${160 + playheadFrame * zoom}px` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#F5A623] rotate-45" />
          </div>
      </div>
    </div>
  </div>
  );
}

// --- Subcomponents ---

function TabBtn({ active, onClick, label, icon }: any) {
  return (
    <button onClick={onClick} className={cn(
      "flex-1 h-10 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
      active ? "bg-[#141116] text-[#F5A623] border-[#F5A623]" : "text-[#7A6E80] border-transparent hover:text-[#F0E8D8]"
    )}>
      {icon} {label}
    </button>
  );
}

function PlayerBtn({ icon, active, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "p-2 rounded-lg transition-all",
      active ? "bg-[#F5A623] text-black" : "text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F0E8D8]"
    )}>
      {icon}
    </button>
  );
}

function ToolBtn({ icon, active, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "p-1.5 rounded transition-all",
      active ? "bg-[#F5A623] text-black" : "text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F0E8D8]"
    )}>
      {icon}
    </button>
  );
}

function InspectorSection({ title, children, defaultOpen = false }: any) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#2A2430] rounded-xl overflow-hidden bg-[#141116]">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full h-10 px-3 flex items-center justify-between bg-[#1A161C] hover:bg-[#2A2430] transition-colors">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F0E8D8]">{title}</span>
        {isOpen ? <ChevronDown size={14} className="text-[#7A6E80]" /> : <ChevronRight size={14} className="text-[#7A6E80]" />}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

function Slider({ label, value }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[9px] font-bold text-[#7A6E80] uppercase tracking-tighter">{label}</label>
        <span className="text-[9px] font-mono text-[#F5A623]">{value}</span>
      </div>
      <input type="range" className="w-full accent-[#F5A623] h-1 bg-[#070608] rounded-full appearance-none cursor-pointer" />
    </div>
  );
}

function AIToolItem({ label, icon }: any) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-[#141116] border border-[#2A2430] hover:border-[#F5A623]/30 transition-all cursor-pointer group">
      <div className="flex items-center gap-2">
        <div className="text-[#7A6E80] group-hover:text-[#F5A623]">{icon}</div>
        <span className="text-[9px] font-bold text-[#F0E8D8]">{label}</span>
      </div>
      <ChevronRight size={12} className="text-[#3D3545]" />
    </div>
  );
}
