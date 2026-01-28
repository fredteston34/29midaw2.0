
import React, { useState, useEffect } from 'react';
import { X, Music, Play, ChevronRight, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { NOTES, normalizeNote } from '../services/musicTheory';
import * as Tone from 'tone';

interface SolfegeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOLFEGE_STEPS = [
  { label: 'Do', interval: 0, type: 'Root', color: 'bg-red-500', semi: 0 },
  { label: 'Re', interval: 2, type: 'Major 2nd', color: 'bg-orange-500', semi: 2 },
  { label: 'Mi', interval: 4, type: 'Major 3rd', color: 'bg-yellow-500', semi: 4 },
  { label: 'Fa', interval: 5, type: 'Perfect 4th', color: 'bg-green-500', semi: 5 },
  { label: 'Sol', interval: 7, type: 'Perfect 5th', color: 'bg-cyan-500', semi: 7 },
  { label: 'La', interval: 9, type: 'Major 6th', color: 'bg-blue-500', semi: 9 },
  { label: 'Si', interval: 11, type: 'Major 7th', color: 'bg-purple-500', semi: 11 },
];

const STRING_TUNING = ['E', 'A', 'D', 'G', 'B', 'E']; // High E at index 5

export const SolfegeModal: React.FC<SolfegeModalProps> = ({ isOpen, onClose }) => {
  const [rootNote, setRootNote] = useState('C');
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null); // Null means show all scale, Number means highlight specific
  const [synth, setSynth] = useState<Tone.PolySynth | null>(null);

  useEffect(() => {
    if (isOpen && !synth) {
      const s = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 }
      }).toDestination();
      s.volume.value = -10;
      setSynth(s);
    }
    return () => {
        if (synth) synth.dispose();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const playNote = (semitonesFromC: number) => {
      if (!synth) return;
      // Simple logic: C3 is base. 
      // Calculate frequency based on rootNote + interval
      const rootIdx = NOTES.indexOf(rootNote);
      const noteName = NOTES[(rootIdx + semitonesFromC) % 12];
      const octave = (rootIdx + semitonesFromC) >= 12 ? 4 : 3;
      synth.triggerAttackRelease(`${noteName}${octave}`, "8n");
  };

  const handleStepClick = (index: number) => {
      setActiveStepIndex(index === activeStepIndex ? null : index);
      playNote(SOLFEGE_STEPS[index].semi);
  };

  const playScale = () => {
      if (!synth) return;
      const now = Tone.now();
      SOLFEGE_STEPS.forEach((step, i) => {
          const rootIdx = NOTES.indexOf(rootNote);
          const noteName = NOTES[(rootIdx + step.semi) % 12];
          const octave = (rootIdx + step.semi) >= 12 ? 4 : 3;
          synth.triggerAttackRelease(`${noteName}${octave}`, "8n", now + i * 0.5);
          
          // Visual sync
          Tone.Draw.schedule(() => {
              setActiveStepIndex(i);
          }, now + i * 0.5);
      });
      
      // Reset visual after scale
      Tone.Draw.schedule(() => {
          setActiveStepIndex(null);
      }, now + SOLFEGE_STEPS.length * 0.5);
  };

  // Fretboard Logic
  const getFretStatus = (stringIdx: number, fret: number) => {
      const openStringNote = STRING_TUNING[stringIdx];
      const openStringIdx = NOTES.indexOf(openStringNote);
      const currentNoteIdx = (openStringIdx + fret) % 12;
      
      const rootIdx = NOTES.indexOf(rootNote);
      const interval = (currentNoteIdx - rootIdx + 12) % 12;

      // Find which Solfege step this corresponds to
      const step = SOLFEGE_STEPS.find(s => s.semi === interval);
      
      if (!step) return null; // Not in Major Scale

      const isActive = activeStepIndex === null || SOLFEGE_STEPS[activeStepIndex].semi === interval;
      
      return { ...step, isActive, noteName: NOTES[currentNoteIdx] };
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[85vh] bg-[#0f172a] border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                    <Music size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Atelier Solfège</h2>
                    <p className="text-xs text-slate-400">Apprenez le manche avec Do-Re-Mi</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-8">
            
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">Tonalité (Root)</span>
                    <div className="flex gap-1 overflow-x-auto max-w-[200px] md:max-w-none custom-scrollbar pb-1">
                        {NOTES.map(note => (
                            <button
                                key={note}
                                onClick={() => setRootNote(note)}
                                className={clsx(
                                    "w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0",
                                    rootNote === note ? "bg-white text-black scale-110 shadow-lg" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                )}
                            >
                                {note}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={playScale}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                >
                    <Play size={16} /> Écouter la Gamme
                </button>
            </div>

            {/* Solfege Buttons */}
            <div className="grid grid-cols-7 gap-2 md:gap-4">
                {SOLFEGE_STEPS.map((step, idx) => (
                    <button
                        key={step.label}
                        onClick={() => handleStepClick(idx)}
                        className={clsx(
                            "flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border transition-all duration-200",
                            activeStepIndex === idx 
                                ? `border-white bg-opacity-100 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)] text-white` 
                                : activeStepIndex !== null 
                                    ? "bg-slate-800/50 border-transparent opacity-40 grayscale" 
                                    : "bg-slate-800 border-slate-700 hover:bg-slate-700",
                            activeStepIndex === idx ? step.color : ""
                        )}
                    >
                        <span className={clsx("text-lg md:text-2xl font-black", activeStepIndex === idx ? "text-white" : "text-slate-300")}>
                            {step.label}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 mt-1 hidden md:block">
                            {step.type}
                        </span>
                    </button>
                ))}
            </div>

            {/* Fretboard Visualization */}
            <div className="relative w-full bg-[#15151e] rounded-xl border-4 border-slate-700 shadow-inner overflow-x-auto custom-scrollbar p-8">
                <div className="min-w-[900px] relative select-none">
                    
                    {/* Frets Lines */}
                    {Array.from({ length: 13 }).map((_, i) => (
                        <div key={i} className="absolute top-0 bottom-0 w-[2px] bg-slate-600" style={{ left: `${i * 70 + 40}px` }}>
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-500 font-bold">{i}</span>
                        </div>
                    ))}

                    {/* Nut */}
                    <div className="absolute top-0 bottom-0 w-3 bg-slate-400 shadow-lg left-[30px]" />

                    {/* Strings */}
                    {[0, 1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="relative h-10 flex items-center">
                            {/* String Line */}
                            <div className={clsx("absolute left-0 right-0 bg-slate-500 shadow-sm", s < 3 ? "h-[2px]" : "h-[1px]")} />
                            
                            {/* Note Dots */}
                            {Array.from({ length: 13 }).map((_, f) => {
                                const status = getFretStatus(s, f);
                                if (!status) return null;

                                return (
                                    <motion.div
                                        key={f}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: status.isActive ? 1 : 0.6, opacity: status.isActive ? 1 : 0.3 }}
                                        className={clsx(
                                            "absolute w-8 h-8 -ml-4 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 z-10 transition-colors cursor-pointer",
                                            status.color,
                                            !status.isActive && "grayscale"
                                        )}
                                        style={{ left: `${f * 70 + 40}px` }}
                                        onClick={() => {
                                            playNote(status.semi);
                                            // Optional: Highlight this specific interval
                                            const idx = SOLFEGE_STEPS.findIndex(st => st.label === status.label);
                                            setActiveStepIndex(idx);
                                        }}
                                        whileHover={{ scale: 1.2 }}
                                    >
                                        <div className="flex flex-col items-center leading-none">
                                            <span className="text-xs font-black text-white">{status.label}</span>
                                            <span className="text-[8px] font-mono text-white/80">{status.noteName}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl flex items-start gap-4">
                <Info className="text-blue-400 shrink-0 mt-1" size={20} />
                <div>
                    <h4 className="text-sm font-bold text-blue-200 mb-1">Pourquoi le Solfège ?</h4>
                    <p className="text-xs text-blue-300/80 leading-relaxed">
                        Le solfège vous aide à comprendre la "fonction" d'une note. 
                        Par exemple, "Mi" est toujours la tierce majeure de "Do". 
                        Si vous connaissez la forme de l'intervalle Do-Mi sur le manche, vous pouvez la transposer dans n'importe quelle tonalité !
                        Essayez de changer la tonalité ci-dessus et regardez les formes (patterns) se déplacer.
                    </p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
