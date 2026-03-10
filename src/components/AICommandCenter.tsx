import React, { useState, useRef } from 'react';
import { 
  Sparkles, Image as ImageIcon, Video, Mic, Brain, 
  Send, Loader2, Maximize2, Download, Trash2, 
  Layout, Type, Wand2, Camera
} from 'lucide-react';
import { AIService } from '../services/AIService';
import { motion, AnimatePresence } from 'motion/react';

const ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];

export default function AICommandCenter() {
  const [activeMode, setActiveMode] = useState<'generate' | 'analyze' | 'video' | 'audio' | 'think' | 'veo' | 'tts'>('generate');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [history, setHistory] = useState<{ type: string, content: string, timestamp: Date }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleGenerate = async () => {
    // Check if API is configured
    if (!AIService.isConfigured()) {
      setResult("⚠️ API key not configured. Please add VITE_GEMINI_API_KEY to your .env file and restart the app.");
      return;
    }
    
    if (!prompt) return;
    setIsProcessing(true);
    try {
      if (activeMode === 'generate') {
        const img = await AIService.generateImage(prompt, selectedRatio);
        setResult(img);
        addToHistory('image', img);
      } else if (activeMode === 'think') {
        const text = await AIService.complexReasoning(prompt);
        setResult(text);
        addToHistory('text', text);
      } else if (activeMode === 'video') {
        const text = await AIService.analyzeVideo("Current Timeline", prompt);
        setResult(text);
        addToHistory('text', text);
      } else if (activeMode === 'veo') {
        const videoUri = await AIService.generateVideo(prompt);
        if (videoUri) {
          setResult(videoUri);
          addToHistory('video', videoUri);
        }
      } else if (activeMode === 'tts') {
        const audio = await AIService.generateSpeech(prompt);
        setResult(audio);
        addToHistory('audio', audio);
      }
    } catch (error: any) {
      console.error(error);
      // Show more specific error message
      const errorMessage = error?.message || "Error processing request.";
      setResult(`❌ ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const analysis = await AIService.analyzeImage(base64, prompt || "What is in this image?");
        setResult(analysis);
        addToHistory('text', analysis);
      } catch (error) {
        setResult("Error analyzing image.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        setIsProcessing(true);
        try {
          const transcription = await AIService.transcribeAudio(base64);
          setResult(transcription);
          addToHistory('text', transcription);
        } catch (error) {
          setResult("Error transcribing audio.");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(blob);
    };
    
    recorder.start();
    audioRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    audioRef.current?.stop();
    setIsRecording(false);
  };

  const addToHistory = (type: string, content: string) => {
    setHistory(prev => [{ type, content, timestamp: new Date() }, ...prev].slice(0, 10));
  };

  return (
    <div className="flex flex-col h-full bg-[#070608]">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2430] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F5A623]/20 flex items-center justify-center">
            <Sparkles size={16} className="text-[#F5A623]" />
          </div>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#F0E8D8]">AI Command Center</h2>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex p-2 gap-1 bg-[#141116] border-b border-[#2A2430] overflow-x-auto no-scrollbar">
        <ModeButton active={activeMode === 'generate'} onClick={() => setActiveMode('generate')} icon={ImageIcon} label="Gen" />
        <ModeButton active={activeMode === 'analyze'} onClick={() => setActiveMode('analyze')} icon={Camera} label="Vision" />
        <ModeButton active={activeMode === 'video'} onClick={() => setActiveMode('video')} icon={Video} label="Video" />
        <ModeButton active={activeMode === 'audio'} onClick={() => setActiveMode('audio')} icon={Mic} label="Audio" />
        <ModeButton active={activeMode === 'think'} onClick={() => setActiveMode('think')} icon={Brain} label="Think" />
        <ModeButton active={activeMode === 'veo'} onClick={() => setActiveMode('veo')} icon={Wand2} label="Veo" />
        <ModeButton active={activeMode === 'tts'} onClick={() => setActiveMode('tts')} icon={Type} label="TTS" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {/* Input Area */}
        <div className="space-y-4">
          {activeMode === 'generate' && (
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-[#7A6E80] uppercase tracking-widest">Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-1">
                {ASPECT_RATIOS.map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setSelectedRatio(ratio)}
                    className={`py-1.5 text-[8px] font-bold rounded border transition-all ${
                      selectedRatio === ratio 
                        ? "bg-[#F5A623] border-[#F5A623] text-black" 
                        : "bg-[#1A161C] border-[#2A2430] text-[#7A6E80] hover:border-[#F5A623]"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={getPlaceholder(activeMode)}
              className="w-full bg-[#141116] border border-[#2A2430] rounded-xl p-4 text-[11px] text-[#F0E8D8] placeholder-[#7A6E80] focus:border-[#F5A623] outline-none min-h-[100px] resize-none"
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              {activeMode === 'analyze' && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-[#1A161C] border border-[#2A2430] rounded-lg text-[#7A6E80] hover:text-[#F0E8D8] transition-all"
                >
                  <ImageIcon size={14} />
                </button>
              )}
              {activeMode === 'audio' && (
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-2 rounded-lg transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-[#1A161C] border border-[#2A2430] text-[#7A6E80] hover:text-[#F0E8D8]"}`}
                >
                  <Mic size={14} />
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={isProcessing || (!prompt && activeMode !== 'audio')}
                className="p-2 bg-[#F5A623] text-black rounded-lg hover:bg-[#FF8C00] disabled:opacity-50 transition-all"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Result Area */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#141116] border border-[#2A2430] rounded-xl overflow-hidden"
            >
              <div className="p-2 bg-[#1A161C] border-b border-[#2A2430] flex items-center justify-between">
                <span className="text-[8px] font-bold text-[#7A6E80] uppercase tracking-widest">Result</span>
                <div className="flex gap-1">
                  <button onClick={() => setResult(null)} className="p-1 text-[#7A6E80] hover:text-red-400"><Trash2 size={10} /></button>
                </div>
              </div>
              <div className="p-4">
                {result.startsWith('data:image') ? (
                  <div className="relative group">
                    <img src={result} alt="AI Generated" className="w-full rounded-lg shadow-2xl" referrerPolicy="no-referrer" />
                    <button className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-all text-white">
                      <Download size={14} />
                    </button>
                  </div>
                ) : result.startsWith('data:audio') ? (
                  <div className="flex flex-col gap-3">
                    <audio src={result} controls className="w-full" />
                    <button className="w-full py-2 bg-[#F5A623] text-black text-[10px] font-black uppercase rounded-lg">Add to Timeline</button>
                  </div>
                ) : result.includes('veo-') || result.includes('.mp4') || result.includes('googlevideo') ? (
                  <div className="flex flex-col gap-3">
                    <video src={result} controls className="w-full rounded-lg" />
                    <button className="w-full py-2 bg-[#F5A623] text-black text-[10px] font-black uppercase rounded-lg">Import to Media Pool</button>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#F0E8D8] leading-relaxed whitespace-pre-wrap">{result}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-[#7A6E80] uppercase tracking-widest">Recent Activity</span>
            <div className="space-y-2">
              {history.map((item, i) => (
                <div key={i} className="p-2 bg-[#141116] border border-[#2A2430] rounded-lg flex items-center gap-3 cursor-pointer hover:border-[#F5A623] transition-all" onClick={() => setResult(item.content)}>
                  <div className="w-8 h-8 rounded bg-[#1A161C] flex items-center justify-center">
                    {item.type === 'image' ? <ImageIcon size={12} className="text-[#F5A623]" /> : item.type === 'video' ? <Video size={12} className="text-[#F5A623]" /> : <Type size={12} className="text-[#4A90E2]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-[#F0E8D8] truncate">{item.type === 'image' ? "Generated Image" : item.type === 'video' ? "Generated Video" : item.content}</p>
                    <p className="text-[7px] text-[#7A6E80]">{item.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        <div className="pt-4 border-t border-[#2A2430] space-y-3">
          <div className="flex items-center gap-2">
            <Wand2 size={12} className="text-[#F5A623]" />
            <span className="text-[9px] font-bold text-[#7A6E80] uppercase tracking-widest">Editor Suggestions</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <SuggestionCard 
              title="Magic Color Grade" 
              desc="Upload a reference photo to match its color palette automatically."
              onClick={() => { setActiveMode('analyze'); setPrompt("Analyze the color palette of this image and suggest node parameters for a similar grade."); }}
            />
            <SuggestionCard 
              title="Smart Script-to-Video" 
              desc="Paste a script and let AI generate a storyboard of clips."
              onClick={() => { setActiveMode('think'); setPrompt("Based on this script: [PASTE SCRIPT], suggest a sequence of 5 visual scenes with descriptions."); }}
            />
            <SuggestionCard 
              title="AI Audio Enhancement" 
              desc="Clean up noisy dialogue and normalize levels."
              onClick={() => { setActiveMode('audio'); setPrompt("Enhance this audio by removing background noise and clarifying speech."); }}
            />
          </div>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload}
      />
    </div>
  );
}

function SuggestionCard({ title, desc, onClick }: { title: string, desc: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="p-3 bg-[#141116] border border-[#2A2430] rounded-xl text-left hover:border-[#F5A623]/50 transition-all group"
    >
      <h4 className="text-[10px] font-black text-[#F0E8D8] uppercase tracking-widest mb-1 group-hover:text-[#F5A623] transition-colors">{title}</h4>
      <p className="text-[8px] text-[#7A6E80] leading-tight">{desc}</p>
    </button>
  );
}

function ModeButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
        active ? "bg-[#F5A623]/20 text-[#F5A623]" : "text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F0E8D8]"
      }`}
    >
      <Icon size={14} />
      <span className="text-[8px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function getPlaceholder(mode: string) {
  switch (mode) {
    case 'generate': return "Describe the image you want to create...";
    case 'analyze': return "Ask a question about the image you'll upload...";
    case 'video': return "Ask about the current video timeline...";
    case 'audio': return "Transcribe your voice recording...";
    case 'think': return "Ask a complex question for deep reasoning...";
    case 'veo': return "Describe the video scene you want to generate...";
    case 'tts': return "Enter text to convert to a high-quality voiceover...";
    default: return "Enter your prompt...";
  }
}
