import React from 'react';
import { useTimelineStore } from '../../../packages/core/timeline-engine';
import AICommandCenter from '../../../src/components/AICommandCenter';
import SmartCut from '../../../src/components/SmartCut';
import LUTLibrary from '../../../src/components/LUTLibrary';

export default function App() {
  const { playheadFrame } = useTimelineStore();
  const [activeTab, setActiveTab] = React.useState('ai');

  return (
    <div className="h-screen bg-[#070608]">
      <div className="h-12 border-b flex items-center px-4">
        <h1 className="font-bold text-[#F5A623]">LUMINA STUDIO</h1>
      </div>
      <div className="flex h-[calc(100vh-3rem)]">
        <div className="w-80 border-r p-4">
          <div className="space-y-2">
            <button onClick={() => setActiveTab('ai')} className={activeTab === 'ai' ? 'text-[#F5A623]' : ''}>AI</button>
            <button onClick={() => setActiveTab('smartcut')} className={activeTab === 'smartcut' ? 'text-[#F5A623]' : ''}>Smart Cut</button>
            <button onClick={() => setActiveTab('lut')} className={activeTab === 'lut' ? 'text-[#F5A623]' : ''}>LUT</button>
          </div>
        </div>
        <div className="flex-1 p-8">
          {activeTab === 'ai' && <AICommandCenter />}
          {activeTab === 'smartcut' && <SmartCut />}
          {activeTab === 'lut' && <LUTLibrary />}
          <div>Playhead: {playheadFrame}</div>
        </div>
      </div>
    </div>
  );
}

