import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, SkipBack, SkipForward, Scissors, MousePointer2, 
  Hand, Search, Plus, Layers, Video, Music, Type, Sparkles, 
  Settings, Download, Maximize2, Volume2, Clock, ChevronRight, 
  ChevronDown, MoreVertical, Trash2, Palette, Monitor, Smartphone, 
  Cpu, Globe, Zap, Box, Activity, Terminal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Core Logic Simulation ---
import { useTimelineStore } from "../packages/core/timeline-engine";

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
  const { tracks, clips, mediaPool, playheadFrame, setPlayhead, addMedia, addClip } = useTimelineStore();
  const [activeTab, setActiveTab] = useState<'media' | 'ai' | 'effects'>('media');
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    
    // Extract metadata
    const video = document.createElement('video');
    video.src = url;
    video.onloadedmetadata = () => {
      const asset = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: url,
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
          background-size: 40px 100%;
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
                       <video src={asset.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
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
               <div className="space-y-4">
                 <div className="p-4 rounded-xl bg-gradient-to-br from-[#1A161C] to-[#0E0B0F] border border-[#F5A623]/20">
                   <h3 className="text-[10px] font-black text-[#F5A623] uppercase tracking-widest mb-2">AI Clip Gen</h3>
                   <textarea placeholder="Describe a scene..." className="w-full h-20 bg-black/40 border border-[#2A2430] rounded-lg p-2 text-[10px] focus:outline-none focus:border-[#F5A623] mb-2" />
                   <button className="w-full py-2 bg-[#F5A623] text-black text-[9px] font-black uppercase rounded-lg">Generate with Stable Video</button>
                 </div>
                 <div className="space-y-2">
                    <AIToolItem label="Background Remover" icon={<Box size={12} />} />
                    <AIToolItem label="4K Upscaler" icon={<Maximize2 size={12} />} />
                    <AIToolItem label="Whisper Subtitles" icon={<Type size={12} />} />
                 </div>
               </div>
             )}
          </div>
        </div>

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
              <Maximize2 size={16} className="text-[#7A6E80] cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Right Column: Inspector */}
        <div className="w-[300px] border-l border-[#2A2430] flex flex-col shrink-0 bg-[#0E0B0F]">
          <div className="h-10 bg-[#141116] border-b border-[#2A2430] px-3 flex items-center gap-2">
            <Settings size={14} className="text-[#F5A623]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F0E8D8]">Inspector</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <InspectorSection title="Video Transform" defaultOpen>
              <div className="space-y-4">
                <Slider label="Position X" value={0} />
                <Slider label="Position Y" value={0} />
                <Slider label="Scale" value={100} />
                <Slider label="Rotation" value={0} />
              </div>
            </InspectorSection>
            <InspectorSection title="Color Grading">
              <div className="space-y-4">
                <div className="flex justify-center py-4">
                  <div className="w-32 h-32 rounded-full border-2 border-[#2A2430] relative bg-gradient-to-tr from-blue-900 via-green-900 to-red-900 opacity-50">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white shadow-xl shadow-white/50" />
                    </div>
                  </div>
                </div>
                <Slider label="Exposure" value={0} />
                <Slider label="Contrast" value={10} />
                <Slider label="Saturation" value={100} />
              </div>
            </InspectorSection>
          </div>
        </div>
      </div>

      {/* --- Timeline --- */}
      <div className="h-[320px] bg-[#070608] border-t border-[#2A2430] flex flex-col shrink-0">
        <div className="h-10 bg-[#0E0B0F] border-b border-[#2A2430] flex items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <ToolBtn icon={<MousePointer2 size={14} />} active />
            <ToolBtn icon={<Scissors size={14} />} />
            <ToolBtn icon={<Hand size={14} />} />
            <ToolBtn icon={<Search size={14} />} />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search size={12} className="text-[#7A6E80]" />
              <input type="range" className="w-32 accent-[#F5A623] h-1 bg-[#2A2430] rounded-full appearance-none" />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#7A6E80]">
              <Clock size={12} />
              <span>00:00:30:00</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative timeline-grid">
          {tracks.map(track => (
            <div key={track.id} className="flex border-b border-[#2A2430] min-h-[48px]">
              <div className="w-40 bg-[#141116] border-r border-[#2A2430] p-2 flex items-center gap-2 shrink-0 sticky left-0 z-20">
                {track.type === 'video' ? <Video size={12} className="text-blue-400" /> : <Music size={12} className="text-green-400" />}
                <span className="text-[9px] font-bold text-[#7A6E80] uppercase truncate">{track.name}</span>
              </div>
              <div className="flex-1 relative h-12">
                {clips.filter(c => c.trackId === track.id).map(clip => (
                  <div key={clip.id} className={cn(
                    "absolute top-1 bottom-1 rounded border border-white/10 flex items-center px-2 overflow-hidden cursor-pointer",
                    clip.type === 'video' ? "bg-blue-600/40" : "bg-green-600/40"
                  )} style={{ left: `${clip.startFrame * 2}px`, width: `${clip.duration * 2}px` }}>
                    <span className="text-[8px] font-bold truncate">{clip.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-[#F5A623] z-30 pointer-events-none transition-all duration-75" 
            style={{ left: `${160 + playheadFrame * 2}px` }}
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

function ToolBtn({ icon, active }: any) {
  return (
    <button className={cn(
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
