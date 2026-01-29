import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useAnimation, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChordData, StrummingPattern } from '../types';
import { getRomanNumeral } from '../services/musicTheory';
import { playNote } from '../services/audioService';
import clsx from 'clsx';
import { Trash2, Music, Layers, ArrowDown, ArrowUp, Activity, Timer, StepBack, StepForward, Camera } from 'lucide-react';

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

interface GuitarStringProps {
  index: number;
  fret: number;
  baseFret: number;
  isActive: boolean;
  triggerStrum: number;
  onInteract: () => void;
}

// --- COMPOSANT CORDE PHYSIQUE ---
const GuitarString: React.FC<GuitarStringProps> = ({ 
  index, 
  fret, 
  baseFret, 
  isActive, 
  triggerStrum,
  onInteract 
}) => {
  const controls = useAnimation();
  
  // Simulation physique simplifiée
  const vibrate = async () => {
    // Amplitude plus forte pour les cordes graves (index bas)
    const amplitude = (6 - index) * 1.5; 
    
    await controls.start({
      y: [0, amplitude, -amplitude, amplitude * 0.5, -amplitude * 0.5, 0],
      transition: { duration: 0.2, ease: "easeInOut" }
    });
  };

  useEffect(() => {
    if (isActive || triggerStrum > 0) {
        // Délai pour simuler le passage du médiator (strumming)
        const delay = index * 0.03; // 30ms entre chaque corde
        const timer = setTimeout(() => {
            vibrate();
        }, delay * 1000);
        return () => clearTimeout(timer);
    }
  }, [isActive, triggerStrum]);

  const isMuted = fret === -1;
  const isOpen = fret === 0;
  
  // Épaisseur visuelle des cordes (Graves -> Aigues)
  const thickness = isMuted ? 1 : Math.max(1, (6 - index) * 0.8);
  const color = isActive ? '#4ade80' : (isMuted ? '#475569' : '#94a3b8');

  return (
    <div 
        className="relative h-full flex items-center justify-center group" 
        onMouseEnter={() => {
            if (!isMuted) {
                vibrate();
                onInteract();
            }
        }}
    >
        {/* Zone tactile invisible élargie */}
        <div className="absolute inset-y-0 -left-2 -right-2 z-10 cursor-pointer" />
        
        {/* La corde vibrante */}
        <motion.div 
            animate={controls}
            className="w-full rounded-full shadow-sm"
            style={{ 
                width: `${thickness}px`, 
                backgroundColor: color,
                boxShadow: isActive ? '0 0 8px #4ade80' : 'none'
            }}
        />
        
        {/* Indicateur Mute/Open en haut */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-black">
            {isMuted && <span className="text-red-500/50">×</span>}
            {isOpen && <span className="text-green-500/50">○</span>}
        </div>
    </div>
  );
};


export const ChordCard: React.FC<ChordCardProps> = ({ 
  chord, isActive, activeBeat, onDelete, onDuplicate, onOpenCoach, onNameChange, onEditChord, keyCenter,
  isLoopStart, isLoopEnd, isInLoop, onSetLoopStart, onSetLoopEnd, capo = 0, onFingeringChange
}) => {
  const [localName, setLocalName] = useState(chord.name);
  const [strumTrigger, setStrumTrigger] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const fingering = chord.fingering || [-1, -1, -1, -1, -1, -1];
  const activeFrets = fingering.filter(f => f > 0);
  const baseFret = activeFrets.length > 0 && Math.max(...activeFrets) > 5 ? Math.min(...activeFrets) : 1;
  const degree = keyCenter ? getRomanNumeral(chord.name, keyCenter) : '';

  useEffect(() => { setLocalName(chord.name); }, [chord.name]);

  // Déclenche la vibration quand l'accord devient actif
  useEffect(() => {
    if (isActive && activeBeat === 0) {
        setStrumTrigger(prev => prev + 1);
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(30); // Petit retour haptique physique
        }
    }
  }, [isActive, activeBeat]);

  const handleManualStrum = (stringIndex: number) => {
      // Joue la note spécifique quand on passe la souris dessus
      const fret = fingering[stringIndex];
      if (fret !== -1) {
          playNote(stringIndex, fret, capo);
      }
  };

  const handleCardClick = (e: React.MouseEvent) => {
      // Si on clique sur le container global (hors contrôles), on déclenche un strum complet
      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
      setStrumTrigger(prev => prev + 1);
      // Jouer l'accord audio complet ici si besoin, ou laisser les cordes individuelles gérer
  };

  const handleGridClick = (e: React.MouseEvent) => {
    if (!gridRef.current || !onFingeringChange) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Inversion de l'index car visuellement E grave est à gauche (0) mais souvent on veut interagir précisément
    const stringIdx = Math.floor((x / rect.width) * 6);
    
    // Calcul de la frette relative
    // top-padding est environ 25px
    const fretRel = Math.floor(((y - 25) / (rect.height - 25)) * 5);
    
    if (fretRel < 0) {
        // Toggle Open/Mute
        onFingeringChange(stringIdx, fingering[stringIdx] === 0 ? -1 : 0, null);
    } else {
        const targetFret = baseFret + fretRel;
        onFingeringChange(stringIdx, targetFret, '1');
        playNote(stringIdx, targetFret, capo);
    }
  };

  const cardVariants = {
    idle: { scale: 1, y: 0, borderColor: isInLoop ? "#6366f1" : "#334155", backgroundColor: isInLoop ? "rgba(49, 46, 129, 0.4)" : "#0f172a", boxShadow: "0 0 0 rgba(0,0,0,0)" },
    active: { 
      borderColor: "#22c55e", 
      backgroundColor: "#064e3b",
      scale: 1.05,
      y: -5,
      boxShadow: "0 20px 25px -5px rgba(34, 197, 94, 0.3)",
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    pulse: {
        scale: [1.05, 1.08, 1.05],
        transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
        layout
        initial="idle"
        animate={isActive ? (activeBeat === 0 ? "pulse" : "active") : "idle"}
        variants={cardVariants}
        onClick={handleCardClick}
        className={clsx(
          "relative flex flex-col items-center w-44 md:w-52 h-[520px] md:h-[580px] rounded-2xl border-4 transition-all pt-4 group select-none overflow-hidden cursor-pointer",
          isLoopStart && "border-l-8 border-l-indigo-500",
          isLoopEnd && "border-r-8 border-r-indigo-500"
        )}
      >
        {/* Timeline Indicator */}
        <div className="absolute top-2 w-[80%] h-1 bg-black/40 rounded-full overflow-hidden flex gap-0.5 px-0.5 pointer-events-none">
            {Array.from({ length: chord.beats }).map((_, i) => (
                <motion.div 
                    key={i} 
                    animate={{ 
                        backgroundColor: i < activeBeat && isActive ? "#22c55e" : (i === activeBeat && isActive ? "#ffffff" : "#334155"),
                        opacity: i === activeBeat && isActive ? 1 : 0.5
                    }} 
                    className="flex-1 rounded-full h-full" 
                />
            ))}
        </div>

        {/* Hover Controls */}
        <div className="absolute top-4 left-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
            <button onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }} className="p-2 rounded-full bg-slate-700 hover:bg-indigo-600 text-white shadow-lg"><Layers size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); onOpenCoach?.(); }} title="AI Posture Coach" className="p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg"><Camera size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); onSetLoopStart?.(); }} className="p-2 rounded-full bg-slate-800 border border-slate-600 text-indigo-400 hover:text-white"><StepBack size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); onSetLoopEnd?.(); }} className="p-2 rounded-full bg-slate-800 border border-slate-600 text-indigo-400 hover:text-white"><StepForward size={14} /></button>
        </div>

        {/* Guitar Neck & Strings */}
        <div ref={gridRef} className="relative w-full h-[240px] md:h-[280px] mt-6 px-4 z-10">
            {/* Frets Background */}
            <div className="absolute inset-x-4 top-[25px] bottom-0 pointer-events-none">
                <div className="w-full h-[4px] bg-slate-400 mb-[44px]" /> {/* Nut */}
                {[1, 2, 3, 4, 5].map(f => <div key={f} className="w-full h-[1px] bg-slate-700/50 mb-[47px]" />)}
            </div>
            
            {/* Strings Container */}
            <div className="absolute inset-0 flex justify-around px-8 z-20">
                {[0, 1, 2, 3, 4, 5].map(s => (
                    <GuitarString 
                        key={s} 
                        index={s} 
                        fret={fingering[s]} 
                        baseFret={baseFret}
                        isActive={isActive && activeBeat === 0}
                        triggerStrum={strumTrigger}
                        onInteract={() => handleManualStrum(s)}
                    />
                ))}
            </div>

            {/* Fingering Dots Overlay (Above strings) */}
            <div className="absolute inset-0 z-30 pointer-events-none px-4">
                 {fingering.map((f, s) => {
                    if (f <= 0) return null;
                    const row = f - baseFret + 1;
                    return (
                        <motion.div 
                            key={s} 
                            initial={{ scale: 0 }}
                            animate={{ scale: isActive ? 1.2 : 1 }}
                            className="absolute w-7 h-7 bg-white rounded-full border-2 border-slate-900 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] font-black text-slate-900 shadow-lg" 
                            style={{ left: `${16.5 + s * 13.5}%`, top: `${row * 48 + 5}px` }}
                        >
                            {/* Optionnel: Numéro du doigt */}
                        </motion.div>
                    );
                })}
                {/* Click handlers for grid logic (transparent) */}
                <div className="absolute inset-0 cursor-crosshair pointer-events-auto" onClick={handleGridClick} />
            </div>
        </div>

        {/* Strumming Pattern Selector */}
        <div className="w-full px-4 mt-4 z-10 flex justify-between gap-1">
            {STRUM_PATTERNS.map(p => (
                <button 
                    key={p.id} 
                    onClick={(e) => { e.stopPropagation(); onEditChord?.('strummingPattern', p.id); }} 
                    className={clsx("flex-1 p-2 rounded-lg border transition-all flex flex-col items-center gap-1 active:scale-95", chord.strummingPattern === p.id ? "bg-primary border-primary text-white" : "bg-slate-800 border-slate-700 text-slate-500")}
                >
                    <p.icon />
                    <span className="text-[6px] font-black uppercase">{p.id}</span>
                </button>
            ))}
        </div>

        {/* Footer Info */}
        <div className="mt-auto mb-6 text-center px-4 w-full flex flex-col items-center gap-1 z-10">
            <div className="flex items-center gap-1"><Music size={10} className="text-yellow-500" /><span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest">{degree}</span></div>
            <input 
                value={localName} 
                onChange={(e) => setLocalName(e.target.value)} 
                onBlur={() => onNameChange?.(localName)} 
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent text-3xl font-black text-center w-full focus:outline-none uppercase text-white drop-shadow-md" 
            />
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-xl text-[10px] font-black text-slate-300 border border-slate-700">
                <Timer size={10} className="text-slate-500" />
                <select 
                    value={chord.beats} 
                    onChange={(e) => onEditChord?.('beats', Number(e.target.value))} 
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent outline-none cursor-pointer hover:text-white"
                >
                    <option value={2} className="bg-slate-900">2 BEATS</option>
                    <option value={4} className="bg-slate-900">4 BEATS</option>
                    <option value={8} className="bg-slate-900">8 BEATS</option>
                </select>
            </div>
        </div>

        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute -top-3 -right-3 bg-red-600 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl z-50 hover:scale-110"><Trash2 size={16}/></button>
    </motion.div>
  );
};