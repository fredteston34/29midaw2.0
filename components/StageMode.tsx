
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Music, Activity } from 'lucide-react';
import { ChordData } from '../types';
import { getRomanNumeral } from '../services/musicTheory';
import clsx from 'clsx';

interface StageModeProps {
  isOpen: boolean;
  onClose: () => void;
  currentChord: ChordData | null;
  nextChord: ChordData | null;
  activeBeat: number;
  bpm: number;
  isPlaying: boolean;
  capo: number;
}

export const StageMode: React.FC<StageModeProps> = ({ 
  isOpen, 
  onClose, 
  currentChord, 
  nextChord, 
  activeBeat, 
  bpm,
  isPlaying,
  capo
}) => {
  if (!isOpen) return null;

  // Diagram rendering logic specific for large display
  const LargeChordDiagram = ({ chord, isLarge = false }: { chord: ChordData, isLarge?: boolean }) => {
      const fingering = chord.fingering || [-1,-1,-1,-1,-1,-1];
      const active = fingering.filter(f => f > 0);
      const baseFret = active.length > 0 && Math.max(...active) > 4 ? Math.min(...active) : 1;
      
      return (
          <div className="relative flex flex-col items-center">
              <div className={clsx("relative bg-slate-900 rounded-xl border-4 border-slate-700 shadow-2xl flex flex-col justify-between overflow-hidden", isLarge ? "w-64 h-80" : "w-32 h-40")}>
                  {/* Fret Labels */}
                  <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-around py-4 text-slate-600 font-mono font-bold text-xs pointer-events-none">
                      {[0,1,2,3,4].map(i => <span key={i}>{baseFret + i}</span>)}
                  </div>

                  {/* Strings */}
                  <div className="absolute inset-x-6 inset-y-4 flex justify-between">
                      {[0,1,2,3,4,5].map(s => (
                          <div key={s} className={clsx("h-full bg-slate-600 shadow-sm", s < 3 ? "w-[2px]" : "w-[1px]")} />
                      ))}
                  </div>

                  {/* Frets Horizontal */}
                  <div className="absolute inset-x-6 inset-y-4 flex flex-col justify-around">
                      {[0,1,2,3,4].map(f => (
                          <div key={f} className="w-full h-[1px] bg-slate-700" />
                      ))}
                  </div>

                  {/* Nut */}
                  {baseFret === 1 && <div className="absolute top-4 left-6 right-6 h-2 bg-slate-400 z-10" />}

                  {/* Dots */}
                  <div className="absolute inset-x-6 inset-y-4 flex justify-between">
                      {fingering.map((fret, strIdx) => {
                          // Standardize string order for display if needed, but here assuming 0=LowE
                          if (fret === -1) return (
                              <div key={strIdx} className="w-0 flex justify-center relative"><span className="absolute -top-6 text-red-500 font-bold">×</span></div>
                          );
                          if (fret === 0) return (
                              <div key={strIdx} className="w-0 flex justify-center relative"><span className="absolute -top-6 text-green-500 font-bold">○</span></div>
                          );
                          
                          // Calculate relative position
                          const relFret = fret - baseFret; // 0 to 4
                          if (relFret < 0 || relFret > 4) return <div key={strIdx} className="w-0" />;

                          const topPercent = (relFret * 20) + 10; // Center in slot (20% height each)

                          return (
                              <div key={strIdx} className="w-0 flex justify-center relative h-full">
                                  <motion.div 
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className={clsx(
                                        "absolute w-6 h-6 -ml-3 rounded-full shadow-lg flex items-center justify-center text-xs font-black z-20",
                                        isLarge ? "bg-primary text-white border-2 border-white" : "bg-white text-black w-4 h-4 -ml-2"
                                    )}
                                    style={{ top: `${topPercent}%` }}
                                  >
                                      {/* Could put interval here later */}
                                  </motion.div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-center bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-red-600 text-white rounded-lg animate-pulse">
                    <Activity size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-widest leading-none">Live Stage</h1>
                    <p className="text-slate-400 text-sm font-mono">{bpm} BPM {capo > 0 ? `• CAPO ${capo}` : ''}</p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all"
            >
                <X size={24} />
            </button>
        </div>

        {/* Main Stage Area */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-8 gap-12 md:gap-32 relative overflow-hidden">
            {/* Background Pulse */}
            {isPlaying && (
                <motion.div 
                    animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
                    transition={{ duration: 60/bpm, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-radial-gradient from-indigo-900/30 to-transparent pointer-events-none"
                />
            )}

            {/* Current Chord (Hero) */}
            <div className="flex flex-col items-center z-10">
                <AnimatePresence mode='wait'>
                    {currentChord ? (
                        <motion.div 
                            key={currentChord.id}
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 1.2, opacity: 0, y: -50 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="flex flex-col items-center"
                        >
                            <span className="text-lg font-bold text-green-400 uppercase tracking-[0.3em] mb-4">Actuellement</span>
                            <div className="mb-8">
                                <LargeChordDiagram chord={currentChord} isLarge={true} />
                            </div>
                            <h2 className="text-[8rem] font-black text-white leading-none drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                                {currentChord.name}
                            </h2>
                            
                            {/* Beat Progress Bar */}
                            <div className="mt-8 w-64 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                <motion.div 
                                    className="h-full bg-green-500 box-shadow-[0_0_15px_currentColor]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: (60/bpm) * currentChord.beats, ease: "linear" }}
                                    key={`${currentChord.id}-progress`} // Reset on chord change
                                />
                            </div>
                            <div className="mt-2 text-slate-500 font-mono font-bold">{activeBeat + 1} / {currentChord.beats}</div>

                        </motion.div>
                    ) : (
                        <div className="text-slate-500 text-2xl font-bold animate-pulse">En attente...</div>
                    )}
                </AnimatePresence>
            </div>

            {/* Next Chord (Preview) */}
            {nextChord && (
                <div className="flex flex-col items-center opacity-60 scale-75 md:absolute md:right-32 z-0">
                    <div className="flex items-center gap-2 mb-4 text-slate-400">
                        <span className="text-sm font-bold uppercase tracking-widest">Suivant</span>
                        <ChevronRight size={16} />
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                        <LargeChordDiagram chord={nextChord} isLarge={false} />
                        <h3 className="text-4xl font-black text-slate-300 text-center mt-4">{nextChord.name}</h3>
                    </div>
                </div>
            )}
        </div>
        
        <div className="p-4 text-center text-slate-600 text-xs font-mono uppercase tracking-widest">
            Mode Scène • Concentrez-vous sur le rythme
        </div>
    </div>
  );
};
