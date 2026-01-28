
import React from 'react';
import { Sparkles, Music, Wind, Coffee, Flame, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

interface VibeTemplate {
  id: string;
  name: string;
  desc: string;
  icon: any;
  color: string;
  prompt: string;
}

const VIBE_TEMPLATES: VibeTemplate[] = [
  { id: 'lofi', name: 'Lofi Chill', desc: 'Jazz relaxant, pluie et vinyle.', icon: Coffee, color: 'from-blue-400 to-purple-500', prompt: 'Chill lo-fi jazz chords in C major with soft reverb' },
  { id: 'grunge', name: 'Garage Grunge', desc: 'Saturé, brut et sombre.', icon: Flame, color: 'from-orange-600 to-red-700', prompt: '90s grunge power chords in Drop D, heavy distortion' },
  { id: 'dream', name: 'Dream Pop', desc: 'Éthéré, beaucoup de chorus.', icon: Moon, color: 'from-indigo-400 to-cyan-400', prompt: 'Ethereal dream pop progression, lush chorus and delay' },
  { id: 'blues', name: 'Texas Blues', desc: 'Cru, crunch et dynamique.', icon: Sun, color: 'from-yellow-500 to-orange-600', prompt: '12-bar blues shuffle in E with light overdrive' },
  { id: 'folk', name: 'Campfire Folk', desc: 'Accents acoustiques doux.', icon: Wind, color: 'from-green-400 to-emerald-600', prompt: 'Warm acoustic folk progression, open chords' },
];

interface InspirationGalleryProps {
  onSelect: (prompt: string) => void;
}

export const InspirationGallery: React.FC<InspirationGalleryProps> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      {VIBE_TEMPLATES.map((vibe) => (
        <button
          key={vibe.id}
          onClick={() => onSelect(vibe.prompt)}
          className="group relative h-32 rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all active:scale-95"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${vibe.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
          <div className="relative p-4 flex flex-col justify-between h-full text-left">
            <div className="flex items-center justify-between">
                <vibe.icon size={20} className="text-white opacity-60" />
                <Sparkles size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
                <h3 className="font-black text-white uppercase tracking-tighter text-lg">{vibe.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{vibe.desc}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
