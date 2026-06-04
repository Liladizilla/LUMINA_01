import React, { useState, useRef, useCallback } from 'react';
import { 
  Scissors, Play, Pause, Trash2, Wand2, Settings,
  Volume2, VolumeX, SkipBack, SkipForward, Loader2,
  ChevronRight, AlertCircle, Check, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTimelineStore } from '../../packages/core/timeline-engine';
import { analyzeVideoElement } from '../utils/audio-analyzer';

export interface CutPoint {
  id: string;
  startFrame: number;
  endFrame: number;
  type: 'silent' | 'similar' | 'manual';
  confidence: number;
}

interface SmartCutProps {
  onApply: (cutPoints: CutPoint[]) => void;
  fps?: number;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

// Store type
interface TimelineState {
  splitClip: (id: string, frame: number) => void;
}

// Hook wrapper to handle type inference
const useTimelineStoreTyped = useTimelineStore as () => TimelineState;

export default function SmartCut({ onApply, fps = 24, videoRef }: SmartCutProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cutPoints, setCutPoints] = useState<CutPoint[]>([]);
  const [selectedCut, setSelectedCut] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.01);
  const [minSilenceDuration, setMinSilenceDuration] = useState(0.5);

  // Timeline store actions
  const { splitClip } = useTimelineStoreTyped();

/**
    * Analyze audio using Web Audio API to detect silence
    * Real implementation using Web Audio API to decode video audio
    */
  const analyzeAudio = async () => {
    if (!videoRef?.current) {
      setCutPoints([{
        id: 'error-' + Date.now(),
        startFrame: 0,
        endFrame: 10,
        type: 'manual',
        confidence: 0
      }]);
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const video = videoRef.current;
      
      // Use Web Audio API for real silence detection via video element
      const analysis = await analyzeVideoElement(video, {
        threshold,
        minDuration: minSilenceDuration,
        fps,
      });
      
      // Convert silence regions to cut points
      const detectedCuts: CutPoint[] = analysis.silenceRegions.map(region => ({
        id: Math.random().toString(36).substr(2, 9),
        startFrame: Math.floor(region.start * fps),
        endFrame: Math.floor(region.end * fps),
        type: 'silent' as const,
        confidence: region.confidence,
      }));
      
      setCutPoints(detectedCuts);
    } catch (error) {
      console.error('Audio analysis error:', error);
      setCutPoints([{
        id: 'error-' + Date.now(),
        startFrame: 0,
        endFrame: 10,
        type: 'manual',
        confidence: 0
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeCut = (id: string) => {
    setCutPoints(cuts => cuts.filter(c => c.id !== id));
  };

  const applyCuts = () => {
    onApply(cutPoints);
    // Also split clips in the timeline store
    // Find the active clip and split at each cut point
    if (videoRef?.current) {
      const video = videoRef.current;
      const clipId = video.dataset.clipId;
      if (clipId) {
        cutPoints.forEach(cut => {
          splitClip(clipId, cut.startFrame);
        });
      }
    }
  };

  const formatTimecode = (frames: number) => {
    const f = frames % fps;
    const s = Math.floor(frames / fps) % 60;
    const m = Math.floor(frames / (fps * 60)) % 60;
    const h = Math.floor(frames / (fps * 60 * 60));
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  const resultError = cutPoints.find(c => c.type === 'manual' && c.id.startsWith('error-'));

  return (
    <div className="flex flex-col h-full bg-[#070608]">
      <div className="p-4 border-b border-[#2A2430] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F5A623]/20 flex items-center justify-center">
            <Scissors size={16} className="text-[#F5A623]" />
          </div>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#F0E8D8]">AI Smart Cut</h2>
        </div>
      </div>

      <div className="p-4 border-b border-[#2A2430] bg-[#141116] space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="thresholdRange" className="text-[9px] font-bold text-[#7A6E80] uppercase tracking-widest">Silence Threshold</label>
            <span className="text-[9px] font-mono text-[#F5A623]">{threshold.toFixed(2)}</span>
          </div>
          <input 
            id="thresholdRange"
            title="Silence threshold"
            type="range"
            min="0.001"
            max="0.1"
            step="0.001"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-[#F5A623] h-1 bg-[#2A2430] rounded-full appearance-none cursor-pointer"
          />
          <p className="text-[7px] text-[#7A6E80]">Lower = more sensitive to quiet audio</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="minDurationRange" className="text-[9px] font-bold text-[#7A6E80] uppercase tracking-widest">Min Duration (sec)</label>
            <span className="text-[9px] font-mono text-[#F5A623]">{minSilenceDuration.toFixed(1)}s</span>
          </div>
          <input 
            id="minDurationRange"
            title="Minimum silence duration"
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={minSilenceDuration}
            onChange={(e) => setMinSilenceDuration(parseFloat(e.target.value))}
            className="w-full accent-[#F5A623] h-1 bg-[#2A2430] rounded-full appearance-none cursor-pointer"
          />
          <p className="text-[7px] text-[#7A6E80]">Minimum silence length to detect</p>
        </div>

        <button
          onClick={analyzeAudio}
          disabled={isAnalyzing}
          aria-label={isAnalyzing ? 'Analyzing audio' : 'Detect silent gaps'}
          className="w-full py-3 bg-[#F5A623] text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#FF8C00] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Analyzing Audio...
            </>
          ) : (
            <>
              <Wand2 size={14} />
              Detect Silent Gaps
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {cutPoints.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-center">
            <Scissors size={32} className="mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No cuts detected</p>
            <p className="text-[8px] text-[#7A6E80] mt-1">Click "Detect Silent Gaps" to analyze</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-bold text-[#7A6E80] uppercase tracking-widest">
                {cutPoints.length} Cuts Found
              </span>
            </div>

            {cutPoints.map((cut) => (
              <div
                key={cut.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedCut === cut.id
                    ? "bg-[#F5A623]/10 border-[#F5A623]"
                    : "bg-[#141116] border-[#2A2430] hover:border-[#F5A623]/50"
                }`}
                onClick={() => setSelectedCut(cut.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase bg-blue-500/20 text-blue-400">
                      {cut.type}
                    </span>
                    <span className="text-[9px] font-mono text-[#F5A623]">
                      {Math.round(cut.confidence * 100)}% confidence
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCut(cut.id); }}
                    aria-label="Remove cut"
                    title="Remove cut"
                    className="p-1 text-[#7A6E80] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-[8px] font-mono text-[#7A6E80]">
                  <div className="flex items-center gap-1">
                    <SkipBack size={10} />
                    <span>{formatTimecode(cut.startFrame)}</span>
                  </div>
                  <ChevronRight size={10} />
                  <div className="flex items-center gap-1">
                    <SkipForward size={10} />
                    <span>{formatTimecode(cut.endFrame)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cutPoints.length > 0 && (
        <div className="p-4 border-t border-[#2A2430]">
          <button
            onClick={applyCuts}
            className="w-full py-3 bg-[#F5A623] text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#FF8C00] transition-all flex items-center justify-center gap-2"
          >
            <Scissors size={14} />
            Apply All Cuts
          </button>
        </div>
      )}
    </div>
  );
}