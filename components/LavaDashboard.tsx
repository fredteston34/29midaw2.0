
import React from 'react';
import { X, Mic, Guitar, Disc, GraduationCap, Sliders, FolderHeart, Binary, Music, History } from 'lucide-react';
import { motion } from 'framer-motion';

interface LavaDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp: (appName: string) => void;
}

export const LavaDashboard: React.FC<LavaDashboardProps> = ({ isOpen, onClose, onOpenApp }) => {
  if (!isOpen) return null;

  const apps = [
    { id: 'practice', name: 'Entraînement', icon: GraduationCap, color: 'from-orange-400 to-pink-500' },
    { id: 'looper', name: 'Groove & Loop', icon: Disc, color: 'from-purple-400 to-indigo-500' },
    { id: 'pedalboard', name: 'Pédalier FX', icon: Guitar, color: 'from-cyan-400 to-blue-500' },
    { id: 'riff', name: 'Riff Studio', icon: History, color: 'from-indigo-400 to-purple-600' },
    { id: 'tuner', name: 'Accordeur', icon: Sliders, color: 'from-emerald-400 to-green-500' },
    { id: 'library', name: 'Dictionnaire', icon: FolderHeart, color: 'from-yellow-400 to-orange-500' },
    { id: 'solfege', name: 'Solfège & Théorie', icon: Binary, color: 'from-teal-400 to-emerald-600' },
    { id: 'import', name: 'Import Audio', icon: Mic, color: 'from-red-400 to-rose-500' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center p-6">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={24} />
      </button>

      <div className="text-center mb-10">
         <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">VIBE<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">CHORD</span></h1>
         <p className="text-slate-400 font-medium">Outils de Studio Pro</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 w-full max-w-4xl"
      >
        {apps.map((app) => (
          <motion.button
            key={app.id}
            variants={item}
            onClick={() => {
                onOpenApp(app.id);
                onClose();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group flex flex-col items-center gap-3"
          >
            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${app.color} shadow-lg shadow-white/5 flex items-center justify-center group-hover:shadow-[0_0_20px_currentColor] transition-all duration-300 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                <app.icon size={32} className="text-white drop-shadow-md" />
            </div>
            <span className="text-white font-medium text-sm md:text-base tracking-wide text-center">{app.name}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};
