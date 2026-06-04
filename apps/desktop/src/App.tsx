import React from 'react';
import { useTimelineStore } from '../../../packages/core/timeline-engine';
import AICommandCenter from '../../../src/components/AICommandCenter';
import SmartCut from '../../../src/components/SmartCut';
import LUTLibrary from '../../../src/components/LUTLibrary';
import Home from '../../../src/components/Home';
import Timeline from '../../../src/components/Timeline';
import { Scissors, Sparkles, Palette, Film } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = React.useState<'editor' | 'color' | 'lut' | 'smartcut' | 'ai'>('editor');

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
            onClick={() => setActiveTab('lut')}
            className={`p-3 rounded-lg transition-colors ${activeTab === 'lut' ? "bg-[#F5A623] text-black" : "text-[#7A6E80] hover:bg-[#1A161C]"}`}
            title="LUT Library"
          >
            <Palette size={20} />
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
            {activeTab === 'editor' && <Home />}
            {activeTab === 'smartcut' && <SmartCut />}
            {activeTab === 'lut' && <LUTLibrary onApplyLUT={() => {}} />}
            {activeTab === 'ai' && <AICommandCenter />}
          </div>
          {activeTab === 'editor' && <Timeline />}
        </div>
      </div>
    </div>
  );
}