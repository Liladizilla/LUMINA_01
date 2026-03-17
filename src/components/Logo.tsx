import { Camera, Sparkles } from 'lucide-react';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 bg-gradient-to-br from-[#F5A623] to-orange-500 rounded-2xl shadow-2xl ${className}`}>
      <div className="flex items-center space-x-2">
        <Camera className="w-8 h-8 text-black" />
        <Sparkles className="w-6 h-6 text-black" />
        <span className="font-bold text-black text-xl tracking-tight">LUMINA</span>
      </div>
    </div>
  );
}

