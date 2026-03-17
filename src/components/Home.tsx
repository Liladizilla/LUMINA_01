import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SmartCut, { CutPoint } from './SmartCut';
import { Play, Pause, Volume2, SlidersHorizontal, Film, Sparkles } from 'lucide-react';

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

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(10);
  const [speed, setSpeed] = useState(1);
  const [gain, setGain] = useState(1);
  const [lut, setLut] = useState('none');
  const [cuts, setCuts] = useState<CutPoint[]>([]);

  const onDropVideo = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoSrc(URL.createObjectURL(file));
      setIsPlaying(false);
      setCurrentTime(0);
      setInPoint(0);
      setOutPoint(10);
    }
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoSrc(URL.createObjectURL(file));
      setIsPlaying(false);
      setCurrentTime(0);
      setInPoint(0);
      setOutPoint(10);
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

  const onLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
    setOutPoint(videoRef.current.duration || 10);
  };

  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.currentTime >= outPoint) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const onSetIn = () => setInPoint(currentTime);
  const onSetOut = () => setOutPoint(currentTime);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      videoRef.current.volume = gain;
    }
  }, [speed, gain]);

  const timelineProgress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const rangeStart = duration > 0 ? (inPoint / duration) * 100 : 0;
  const rangeWidth = duration > 0 ? Math.max(1, ((outPoint - inPoint) / duration) * 100) : 0;

  const frameLabel = useMemo(() => Math.floor(currentTime * 24), [currentTime]);

  const onApplyCuts = (newCuts: CutPoint[]) => {
    setCuts(newCuts);
  };

  const lutClass = lut === 'cinematic' ? 'filter-cinematic' : lut === 'vivid' ? 'filter-vivid' : lut === 'warm' ? 'filter-warm' : 'filter-default';

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F5F3E7] p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex flex-wrap justify-between items-start gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#A0A0A0]">Lumina Studio</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.05]">
              <span className="glitch relative inline-block" data-text="Lumina Studio">Lumina Studio</span>
            </h1>
            <p className="mt-1 text-sm text-[#B5B1B8]">Drop a video, trim, stretch frames, add LUT and audio helpers.</p>
          </div>
          <div className="rounded-xl border border-[#2F2D37] bg-[#16161F] p-2 flex gap-2 items-center text-xs text-[#E6E2D4]">
            <Film size={16} className="text-[#F5A623]" />
            Web Mode
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4">
          <div className="rounded-2xl border border-[#2B2A36] bg-[#11121A] p-4 space-y-3">
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

          <div className="rounded-2xl border border-[#2A2430] bg-[#121118] p-4">
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
                <div className="absolute top-0 left-0 h-full w-1/2 bg-[#F5A623]" />
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
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_0.6fr] gap-4">
          <div className="rounded-2xl border border-[#2A2430] bg-[#131218] p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs uppercase text-[#B0A7BF]">SmartCut</p>
                <h3 className="font-bold">Auto cut suggestions</h3>
              </div>
              <div className="text-xs text-[#94A2C2]">AI-assisted quick cuts</div>
            </div>
            <SmartCut onApply={onApplyCuts} fps={24} />
          </div>
          <div className="rounded-2xl border border-[#2A2430] bg-[#131218] p-4 space-y-2">
            <p className="text-xs uppercase text-[#B0A7BF]">Applied cuts</p>
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
            <div className="mt-2 text-xs text-[#9A8FB5]">Frame stretching is done using playback speed and in/out marking. For perfect frame alignment, use close in/out marks and frame step in the preview.</div>
          </div>
        </section>
      </div>
    </div>
  );
}

