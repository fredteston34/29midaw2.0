
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChordData, StrummingPattern } from '../types';
import { getRomanNumeral } from '../services/musicTheory';
import { playNote } from '../services/audioService';
import clsx from 'clsx';
import { Trash2, Music, Copy, Layers, ArrowDown, ArrowUp, Activity, Timer, StepBack, StepForward, Camera } from 'lucide-react';

interface ChordCardProps {
  chord: ChordData;
  isActive: boolean;
  activeBeat: number;
  onDelete: () => void;
  onDuplicate?: () => void;
  onCopy?: () => void;
  index: number;
  onFingeringChange?: (s: number, f: number, fingerLabel?: string | null) => void;
  onNameChange?: (name: string) => void;
  onEditChord?: (field: keyof ChordData, value: any) => void;
  onOpenCoach?: () => void;
  capo?: number;
  keyCenter?: string;
  isLoopStart?: boolean;
  isLoopEnd?: boolean;
  isInLoop?: boolean;
  onSetLoopStart?: () => void;
  onSetLoopEnd?: () => void;
}

const STRUM_PATTERNS: { id: StrummingPattern; icon: any }[] = [
  { id: 'ONCE', icon: () => <ArrowDown size={12} className="opacity-40" /> },
  { id: 'DOWN', icon: () => <div className="flex gap-0.5"><ArrowDown size={10} /><ArrowDown size={10} /></div> },
  { id: 'DU', icon: () => <div className="flex gap-0.5"><ArrowDown size={10} /><ArrowUp size={10} /></div> },
  { id: 'DDU', icon: () => <div className="flex gap-0.5"><ArrowDown size={10} /><ArrowDown size={10} /><ArrowUp size={10} /></div> },
  { id: 'FOLK', icon: () => <Activity size={10} /> },
];

export const ChordCard: React.FC<ChordCardProps> = ({ 
  chord, isActive, activeBeat, onDelete, onDuplicate, onOpenCoach, onNameChange, onEditChord, keyCenter,
  isLoopStart, isLoopEnd, isInLoop, onSetLoopStart, onSetLoopEnd, capo = 0, onFingeringChange
}) => {
  const [localName, setLocalName] = useState(chord.name);
  const gridRef = useRef<HTMLDivElement>(null);
  const fingering = chord.fingering || [-1, -1, -1, -1, -1, -1];
  
  const activeFrets = fingering.filter(f => f > 0);
  const baseFret = activeFrets.length > 0 && Math.max(...activeFrets) > 5 ? Math.min(...activeFrets) : 1;
  const degree = keyCenter ? getRomanNumeral(chord.name, keyCenter) : '';

  useEffect(() => { setLocalName(chord.name); }, [chord.name]);

  // Rhythm-based Haptic Feedback - Vibrations lors du changement d'accord
  useEffect(() => {
    if (isActive && activeBeat === 0) {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            // Pattern de vibration court et sec pour simuler le changement de manche
            window.navigator.vibrate([40]); 
        }
    }
  }, [isActive, activeBeat]);

  const handleGridClick = (e: React.MouseEvent) => {
    if (!gridRef.current || !onFingeringChange) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const stringIdx = Math.floor((x / rect.width) * 6);
    const fretRel = Math.floor(((y - 25) / (rect.height - 25)) * 5);
    
    if (fretRel < 0) {
        onFingeringChange(stringIdx, fingering[stringIdx] === 0 ? -1 : 0, null);
        playNote(stringIdx, 0, capo);
    } else {
        const targetFret = baseFret + fretRel;
        onFingeringChange(stringIdx, targetFret, '1');
        playNote(stringIdx, targetFret, capo);
    }
  };

  const cardVariants = {
    idle: { scale: 1, rotate: 0, x: 0, borderColor: isInLoop ? "#6366f1" : "#334155", backgroundColor: isInLoop ? "rgba(49, 46, 129, 0.4)" : "#0f172a" },
    active: { 
      borderColor: "#22c55e", 
      backgroundColor: "#064e3b",
      scale: 1.02,
    },
    vibrate: {
      rotate: [0, -1, 1, -1, 1, 0],
      scale: [1, 1.05, 1],
      transition: { duration: 0.15 }
    }
  };

  return (
    <motion.div
        layout
        initial="idle"
        animate={isActive && activeBeat === 0 ? "vibrate" : (isActive ? "active" : "idle")}
        variants={cardVariants}
        className={clsx(
          "relative flex flex-col items-center w-44 md:w-52 h-[520px] md:h-[580px] rounded-2xl border-4 transition-all shadow-2xl pt-4 group select-none overflow-hidden",
          isActive && "ring-4 ring-primary/20",
          isLoopStart && "border-l-8 border-l-indigo-500",
          isLoopEnd && "border-r-8 border-r-indigo-500"
        )}
      >
        <div className="absolute top-2 w-[80%] h-1 bg-black/40 rounded-full overflow-hidden flex gap-0.5 px-0.5">
            {Array.from({ length: chord.beats }).map((_, i) => (
                <motion.div key={i} animate={{ backgroundColor: i <= activeBeat ? "#22c55e" : "#334155" }} className="flex-1 rounded-full h-full" />
            ))}
        </div>

        <div className="absolute top-4 left-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
            <button onClick={onDuplicate} className="p-2 rounded-full bg-slate-700 hover:bg-indigo-600 text-white shadow-lg"><Layers size={14} /></button>
            <button onClick={onOpenCoach} title="AI Posture Coach" className="p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg"><Camera size={14} /></button>
            <button onClick={onSetLoopStart} className="p-2 rounded-full bg-slate-800 border border-slate-600 text-indigo-400 hover:text-white"><StepBack size={14} /></button>
            <button onClick={onSetLoopEnd} className="p-2 rounded-full bg-slate-800 border border-slate-600 text-indigo-400 hover:text-white"><StepForward size={14} /></button>
        </div>

        <div ref={gridRef} onClick={handleGridClick} className="relative w-full h-[240px] md:h-[280px] mt-6 cursor-crosshair px-4 z-10">
            <div className="absolute w-full h-[6px] top-[25px] left-0 bg-slate-400 z-10" />
            {[1, 2, 3, 4, 5].map(f => <div key={f} className="absolute w-full h-[1px] left-0 bg-slate-700/50" style={{ top: `${f * 48 + 25}px` }} />)}
            <div className="absolute inset-0 flex justify-around px-8">
                {[0, 1, 2, 3, 4, 5].map(s => (
                    <div key={s} className="relative h-full flex items-center justify-center">
                        <div className={clsx("h-full rounded-full transition-colors", s < 3 ? "w-[2.5px]" : "w-[1.5px]", isActive ? "bg-primary shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-slate-500")} />
                    </div>
                ))}
            </div>
            {fingering.map((f, s) => {
                if (f < 0) return <div key={s} className="absolute top-0 text-red-500 font-black text-xs" style={{ left: `${14 + s * 14.5}%` }}>×</div>;
                if (f === 0) return <div key={s} className="absolute top-0 text-green-400 font-black text-xs" style={{ left: `${14 + s * 14.5}%` }}>○</div>;
                const row = f - baseFret + 1;
                return <motion.div key={s} animate={isActive && activeBeat === 0 ? { scale: [1, 1.4, 1] } : {}} className="absolute w-7 h-7 bg-white rounded-full border-2 border-slate-900 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] font-black text-slate-900 shadow-lg z-20" style={{ left: `${16.5 + s * 13.5}%`, top: `${row * 48 + 5}px` }} />;
            })}
        </div>

        <div className="w-full px-4 mt-4 z-10 flex justify-between gap-1">
            {STRUM_PATTERNS.map(p => (
                <button key={p.id} onClick={() => onEditChord?.('strummingPattern', p.id)} className={clsx("flex-1 p-2 rounded-lg border transition-all flex flex-col items-center gap-1", chord.strummingPattern === p.id ? "bg-primary border-primary text-white" : "bg-slate-800 border-slate-700 text-slate-500")}><p.icon /><span className="text-[6px] font-black uppercase">{p.id}</span></button>
            ))}
        </div>

        <div className="mt-auto mb-6 text-center px-4 w-full flex flex-col items-center gap-1 z-10">
            <div className="flex items-center gap-1"><Music size={10} className="text-yellow-500" /><span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest">{degree}</span></div>
            <input value={localName} onChange={(e) => setLocalName(e.target.value)} onBlur={() => onNameChange?.(localName)} className="bg-transparent text-2xl font-black text-center w-full focus:outline-none uppercase text-white" />
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-xl text-[10px] font-black text-slate-300">
                <Timer size={10} className="text-slate-500" />
                <select value={chord.beats} onChange={(e) => onEditChord?.('beats', Number(e.target.value))} className="bg-transparent outline-none"><option value={4} className="bg-slate-900">4 BEATS</option><option value={8} className="bg-slate-900">8 BEATS</option></select>
            </div>
        </div>
        <button onClick={onDelete} className="absolute -top-3 -right-3 bg-red-600 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl z-50"><Trash2 size={16}/></button>
    </motion.div>
  );
};
