import React, { useState } from 'react';
import { Palette, Film, Sliders, Check, RefreshCw } from 'lucide-react';

export interface LUTPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  colorWheels: {
    shadows: { r: number; g: number; b: number };
    midtones: { r: number; g: number; b: number };
    highlights: { r: number; g: number; b: number };
  };
}

const DEFAULT_LUTS: LUTPreset[] = [
  { id: 'hollywood', name: 'Hollywood Glam', category: 'cinematic', description: 'Classic warm cinematic look', colorWheels: { shadows: { r: 10, g: 5, b: -5 }, midtones: { r: 5, g: 3, b: 0 }, highlights: { r: 8, g: 5, b: 2 } } },
  { id: 'noir', name: 'Noir Mood', category: 'noir', description: 'High contrast black & white', colorWheels: { shadows: { r: -30, g: -30, b: -30 }, midtones: { r: 0, g: 0, b: 0 }, highlights: { r: 20, g: 20, b: 20 } } },
  { id: 'vintage', name: 'Vintage Kodak', category: 'vintage', description: 'Faded film look', colorWheels: { shadows: { r: -10, g: 0, b: -20 }, midtones: { r: 5, g: 3, b: -5 }, highlights: { r: 25, g: 15, b: 5 } } },
  { id: 'teal-orange', name: 'Teal & Orange', category: 'cinematic', description: 'Hollywood action look', colorWheels: { shadows: { r: -20, g: 10, b: 30 }, midtones: { r: 5, g: 0, b: 5 }, highlights: { r: 30, g: 15, b: 0 } } },
  { id: 'sunset', name: 'Sunset Glow', category: 'warm', description: 'Golden hour vibes', colorWheels: { shadows: { r: 5, g: 0, b: -15 }, midtones: { r: 15, g: 5, b: -10 }, highlights: { r: 35, g: 20, b: 5 } } },
  { id: 'cool', name: 'Cool Blue', category: 'cool', description: 'Sci-fi crisp tones', colorWheels: { shadows: { r: -10, g: 0, b: 20 }, midtones: { r: -5, g: 0, b: 10 }, highlights: { r: 5, g: 5, b: 25 } } },
];

interface LUTLibraryProps {
  onApplyLUT: (lut: LUTPreset) => void;
  currentLUT?: string;
}

export default function LUTLibrary({ onApplyLUT, currentLUT }: LUTLibraryProps) {
  const [selectedLUT, setSelectedLUT] = useState<LUTPreset | null>(null);
  const [intensity, setIntensity] = useState(100);

  return (
    <div className="flex flex-col h-full bg-[#070608]">
<div className="p-4 border-b border-[#2A2430] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F5A623]/20 flex items-center justify-center">
            <Palette size={16} className="text-[#F5A623]" />
          </div>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#F0E8D8]">LUT Library</h2>
        </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2">
          {DEFAULT_LUTS.map(lut => (
            <button
              key={lut.id}
              onClick={() => setSelectedLUT(lut)}
              className={`p-3 rounded-xl border transition-all text-left ${
                selectedLUT?.id === lut.id ? "bg-[#F5A623]/10 border-[#F5A623]" : "bg-[#141116] border-[#2A2430] hover:border-[#F5A623]/50"
              }`}
            >
              <div className="w-full h-12 rounded-lg mb-2 bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 relative">
                {currentLUT === lut.id && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Check size={16} className="text-[#F5A623]" />
                  </div>
                )}
              </div>
              <h3 className="text-[10px] font-black text-[#F0E8D8] uppercase tracking-wider mb-1">{lut.name}</h3>
              <p className="text-[7px] text-[#7A6E80]">{lut.description}</p>
            </button>
          ))}
        </div>

      {selectedLUT && (
        <>
          <div className="p-4 border-t border-[#2A2430] bg-[#141116]">
            <div className="flex justify-between mb-2">
              <span className="text-[9px] font-bold text-[#7A6E80] uppercase">Intensity</span>
              <span className="text-[9px] font-mono text-[#F5A623]">{intensity}%</span>
            </div>
            <input type="range" min="0" max="100" value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))} className="w-full accent-[#F5A623] h-1 bg-[#2A2430] rounded-full" />
          </div>
          <div className="p-4 border-t border-[#2A2430]">
            <button onClick={() => onApplyLUT(selectedLUT)} className="w-full py-2 bg-[#F5A623] text-black text-[10px] font-black uppercase rounded-lg hover:bg-[#FF8C00]">
              Apply LUT
            </button>
          </div>
        </>
      )}
<div className="mb-4" />
        </div>
      </div>

      {selectedLUT && (
        <>
          <div className="p-4 border-t border-[#2A2430] bg-[#141116]">
            <div className="flex justify-between mb-2">
              <span className="text-[9px] font-bold text-[#7A6E80] uppercase">Intensity</span>
              <span className="text-[9px] font-mono text-[#F5A623]">{intensity}%</span>
            </div>
            <input type="range" min="0" max="100" value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))} className="w-full accent-[#F5A623] h-1 bg-[#2A2430] rounded-full" />
          </div>
          <div className="p-4 border-t border-[#2A2430]">
            <button onClick={() => onApplyLUT(selectedLUT)} className="w-full py-2 bg-[#F5A623] text-black text-[10px] font-black uppercase rounded-lg hover:bg-[#FF8C00]">
              Apply LUT
            </button>
          </div>
        </>
      )}
    </div>
  );
}
