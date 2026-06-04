import React, { useState } from 'react';
import { Scissors, Sparkles, Palette, Film } from 'lucide-react';

// Local simplified components for desktop standalone build
function DesktopHome() {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="flex-1 rounded-2xl border border-[#2A2430] bg-[#11121A] p-4 mb-4 flex items-center justify-center">
        <div className="text-center text-[#9B91A8]">
          <Film size={48} className="mx-auto mb-4" />
          <p className="text-sm mb-2">Drop a video file to begin editing</p>
          <label className="inline-block px-4 py-2 bg-[#F5A623] text-black text-xs font-bold rounded-lg cursor-pointer hover:bg-[#FF8C00] transition">
            Choose File
            <input type="file" accept="video/*" className="hidden" onChange={() => {}} />
          </label>
        </div>
      </div>
      <div className="h-12 border-t border-[#2A2430] flex items-center px-2">
        <span className="text-[9px] font-mono text-[#7A6E80]">Frame: 0</span>
      </div>
    </div>
  );
}

function DesktopSmartCut() {
  return (
    <div className="flex flex-col h-full bg-[#070608]">
      <div className="p-4 border-b border-[#2A2430]">
        <h2 className="text-[11px] font-black uppercase text-[#F0E8D8]">AI Smart Cut</h2>
      </div>
      <div className="flex-1 p-4">
        <p className="text-xs text-[#7A6E80]">Smart cut detection for silent gaps in video audio.</p>
      </div>
    </div>
  );
}

function DesktopAI() {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#070608]">
      <div className="p-4 border-b border-[#2A2430]">
        <h2 className="text-[11px] font-black uppercase text-[#F0E8D8]">AI Command Center</h2>
      </div>
      <div className="flex-1 p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to generate..."
          className="w-full h-32 bg-[#141116] border border-[#2A2430] rounded p-2 text-xs text-[#F0E8D8] placeholder-[#7A6E80] focus:border-[#F5A623] outline-none"
        />
        <button
          disabled={isProcessing || !prompt}
          className="mt-4 px-4 py-2 bg-[#F5A623] text-black text-xs font-bold rounded disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Generate'}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = React.useState<'editor' | 'smartcut' | 'ai'>('editor');

  return (
    <div className="h-screen bg-[#070608] text-[#F5F3E7] flex flex-col">
      {/* Header */}
      <header className="h-12 border-b border-[#2A2430] flex items-center px-4 justify-between bg-[#0A0A0F]">
        <h1 className="font-bold text-[#F5A623] text-lg">LUMINA STUDIO</h1>
        <span className="text-xs text-[#7A6E80]">Desktop Mode</span>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <nav className="w-16 border-r border-[#2A2430] flex flex-col items-center py-4 gap-4 bg-[#0A0A0F]">
          <button
            onClick={() => setActiveTab('editor')}
            className={`p-3 rounded-lg transition-colors ${activeTab === 'editor' ? "bg-[#F5A623] text-black" : "text-[#7A6E80] hover:bg-[#1A161C]"}`}
            title="Editor"
          >
            <Film size={20} />
          </button>
          <button
            onClick={() => setActiveTab('smartcut')}
            className={`p-3 rounded-lg transition-colors ${activeTab === 'smartcut' ? "bg-[#F5A623] text-black" : "text-[#7A6E80] hover:bg-[#1A161C]"}`}
            title="Smart Cut"
          >
            <Scissors size={20} />
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`p-3 rounded-lg transition-colors ${activeTab === 'ai' ? "bg-[#F5A623] text-black" : "text-[#7A6E80] hover:bg-[#1A161C]"}`}
            title="AI"
          >
            <Sparkles size={20} />
          </button>
        </nav>

        {/* Panels */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            {activeTab === 'editor' && <DesktopHome />}
            {activeTab === 'smartcut' && <DesktopSmartCut />}
            {activeTab === 'ai' && <DesktopAI />}
          </div>
        </div>
      </div>
    </div>
  );
}