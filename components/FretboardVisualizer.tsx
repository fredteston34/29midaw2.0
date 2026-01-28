
import React, { useMemo, useEffect, useState } from 'react';
import { ChordData } from '../types';
import { getFretboardMap, getScaleName } from '../services/musicTheory';
import { Guitar, X, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import * as Tone from 'tone';

interface FretboardVisualizerProps {
  currentChord: ChordData | null;
  capo: number;
  isVisible: boolean;
  onClose: () => void;
  activeNote?: { stringIdx: number, fret: number } | null;
}

// Shared synth to avoid memory leaks
const coachSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 1 }
}).toDestination();
coachSynth.volume.value = -12;

export const FretboardVisualizer: React.FC<FretboardVisualizerProps> = ({ currentChord, capo, isVisible, onClose, activeNote }) => {
    const dots = useMemo(() => {
        if (!currentChord) return [];
        return getFretboardMap(currentChord.name, 'PENTATONIC');
    }, [currentChord?.name]);

    const scaleName = useMemo(() => {
        if (!currentChord || !currentChord.name) return '--';
        return getScaleName(currentChord.name, 'PENTATONIC');
    }, [currentChord?.name]);

    if (!isVisible) return null;

    const playNote = (s: number, f: number) => {
        const bases = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
        const note = Tone.Frequency(bases[s]).transpose(f + capo).toNote();
        coachSynth.triggerAttackRelease(note, "8n");
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-slate-900 border-t border-slate-700 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between px-6 py-2 bg-black/40 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-1 bg-indigo-500/20 rounded-md text-indigo-400">
                        <Guitar size={14} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Scale Coach</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">
                                {scaleName}
                            </span>
                            {currentChord?.name && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-900/30 border border-indigo-500/20 text-[9px] font-bold text-indigo-400">
                                    based on {currentChord.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase">
                        <Sparkles size={10} className="text-yellow-500" />
                        Click frets to hear notes
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="relative w-full h-32 overflow-x-auto bg-[#13131a] custom-scrollbar">
                <div className="min-w-[900px] h-full relative p-8">
                    {[0, 1, 2, 3, 4, 5].map(s => (
                        <div key={s} className={clsx("absolute left-8 right-8 bg-slate-700", activeNote?.stringIdx === s ? "h-[2px] bg-white shadow-[0_0_8px_white]" : "h-[1px]")} style={{ top: `${20 + s * 14}px` }} />
                    ))}
                    
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="absolute top-4 bottom-4 w-[1px] bg-slate-800" style={{ left: `${40 + i * 55}px` }} />
                    ))}

                    {dots.map((d, i) => (
                        <button
                            key={i}
                            onClick={() => playNote(d.string, d.fret)}
                            className={clsx(
                                "absolute w-5 h-5 -ml-2.5 rounded-full flex items-center justify-center text-[8px] font-bold border transition-all",
                                activeNote?.stringIdx === d.string && activeNote?.fret === d.fret ? "bg-white text-black scale-125 z-30" :
                                d.interval === 'R' ? "bg-red-600 text-white border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.4)]" : "bg-slate-700 text-slate-300 border-slate-600"
                            )}
                            style={{ left: `${40 + d.fret * 55}px`, top: `${11 + d.string * 14}px` }}
                        >
                            {d.interval === 'R' ? 'R' : d.note}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
