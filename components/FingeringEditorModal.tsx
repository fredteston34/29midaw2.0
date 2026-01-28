import React, { useState, useEffect } from 'react';
import { X, Check, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import clsx from 'clsx';
import { ChordData } from '../types';
import { previewChord } from '../services/audioService';

interface FingeringEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  chord: ChordData | null;
  onSave: (id: string, newFingering: number[], section?: string) => void;
}

export const FingeringEditorModal: React.FC<FingeringEditorModalProps> = ({ 
  isOpen, 
  onClose, 
  chord, 
  onSave 
}) => {
  const [fingering, setFingering] = useState<number[]>([-1, -1, -1, -1, -1, -1]);
  const [baseFret, setBaseFret] = useState(1);
  const [section, setSection] = useState('');

  // Initialize state when chord opens
  useEffect(() => {
    if (chord && chord.fingering) {
      setFingering([...chord.fingering]);
      setSection(chord.section || '');
      
      // Auto-set base fret based on content
      const activeFrets = chord.fingering.filter(f => f > 0);
      if (activeFrets.length > 0) {
        const min = Math.min(...activeFrets);
        const max = Math.max(...activeFrets);
        if (max > 5) {
          setBaseFret(min);
        } else {
          setBaseFret(1);
        }
      } else {
        setBaseFret(1);
      }
    }
  }, [chord, isOpen]);

  if (!isOpen || !chord) return null;

  const strings = [0, 1, 2, 3, 4, 5]; // Low E to High e
  const stringNames = ['E', 'A', 'D', 'G', 'B', 'e'];
  
  const handleInteraction = (stringIndex: number, relativeFret: number) => {
    // relativeFret: 0 = Nut/Mute toggle area, 1-5 = Frets on grid
    
    const currentVal = fingering[stringIndex];
    let newVal = currentVal;

    if (relativeFret === 0) {
       // Toggle between Open (0) and Mute (-1)
       // If currently set to a fret, reset to Open
       if (currentVal > 0) newVal = 0;
       else if (currentVal === 0) newVal = -1;
       else newVal = 0;
    } else {
       // Calculate absolute fret
       const absFret = baseFret + relativeFret - 1;
       
       // If clicking the same fret, remove it (mute)
       if (currentVal === absFret) newVal = -1;
       else newVal = absFret;
    }

    const newFingering = [...fingering];
    newFingering[stringIndex] = newVal;
    setFingering(newFingering);
    
    // Live preview
    previewChord({ ...chord, fingering: newFingering });
  };

  const handleSave = () => {
    onSave(chord.id, fingering, section);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Chord</h2>
            <p className="text-sm text-slate-400 font-mono">{chord.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Section Label Input */}
        <div className="mb-4">
             <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
                 <Tag size={16} className="text-slate-400" />
                 <input 
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="Section (e.g., Chorus)"
                    className="bg-transparent text-sm text-white focus:outline-none w-full placeholder-slate-600"
                 />
             </div>
        </div>

        {/* Controls: Base Fret */}
        <div className="flex justify-between items-center mb-4 bg-slate-800/50 p-2 rounded-lg">
          <span className="text-sm text-slate-400 font-medium ml-2">Position</span>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setBaseFret(Math.max(1, baseFret - 1))}
                className="p-1 hover:bg-slate-700 rounded text-slate-300"
                disabled={baseFret <= 1}
             >
               <ChevronLeft size={20} />
             </button>
             <span className="text-lg font-bold font-mono w-8 text-center text-primary">{baseFret}fr</span>
             <button 
                onClick={() => setBaseFret(Math.min(20, baseFret + 1))}
                className="p-1 hover:bg-slate-700 rounded text-slate-300"
             >
               <ChevronRight size={20} />
             </button>
          </div>
        </div>

        {/* Fretboard Grid */}
        <div className="flex-1 relative select-none flex justify-center mb-6">
           <div className="relative w-full max-w-[280px]">
              
              {/* Strings Lines */}
              <div className="absolute inset-0 flex justify-between px-[10%] pointer-events-none z-0">
                {strings.map(s => (
                  <div key={s} className="w-[1px] bg-slate-600 h-full shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                ))}
              </div>

              {/* Frets Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pt-[40px] pointer-events-none z-0">
                {/* Nut or Top Fret Line */}
                <div className={clsx("w-full h-[2px]", baseFret === 1 ? "bg-slate-400" : "bg-slate-600")} />
                {/* 5 Frets */}
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-full h-[1px] bg-slate-600" />
                ))}
              </div>

              {/* Interaction Zones & Indicators */}
              <div className="relative z-10 flex justify-between px-[6%] h-full">
                {strings.map((strIdx) => {
                  const val = fingering[strIdx];
                  // Determine visual state relative to current view
                  let visualState: 'mute' | 'open' | 'fret' | 'off-screen-high' | 'off-screen-low' = 'mute';
                  
                  if (val === -1) visualState = 'mute';
                  else if (val === 0) visualState = 'open';
                  else if (val >= baseFret && val < baseFret + 5) visualState = 'fret';
                  else if (val < baseFret && val > 0) visualState = 'off-screen-low';
                  else visualState = 'off-screen-high';

                  // Calculate visual row (0 = nut area, 1..5 = frets)
                  const row = visualState === 'fret' ? (val - baseFret + 1) : 0;

                  return (
                    <div key={strIdx} className="flex flex-col w-[14%] h-full">
                       {/* String Name Label */}
                       <div className="text-center text-[10px] text-slate-500 font-mono mb-1">{stringNames[strIdx]}</div>

                       {/* Nut / Open / Mute Zone */}
                       <div 
                         onClick={() => handleInteraction(strIdx, 0)}
                         className="h-[30px] flex items-center justify-center cursor-pointer hover:bg-white/5 rounded relative"
                       >
                          {visualState === 'mute' && <span className="text-slate-500 font-bold text-sm">✕</span>}
                          {visualState === 'open' && <div className="w-3 h-3 rounded-full border-2 border-green-500"></div>}
                          {(visualState === 'off-screen-low') && <span className="text-xs text-green-600 font-bold">↑{val}</span>}
                       </div>

                       {/* Fret Zones */}
                       <div className="flex-1 flex flex-col">
                          {[1, 2, 3, 4, 5].map(f => {
                             const isFretActive = visualState === 'fret' && row === f;
                             return (
                               <div 
                                 key={f}
                                 onClick={() => handleInteraction(strIdx, f)}
                                 className="flex-1 cursor-pointer hover:bg-white/5 flex items-center justify-center relative"
                               >
                                  {isFretActive && (
                                    <div className="w-5 h-5 bg-primary rounded-full shadow-lg shadow-green-500/50 flex items-center justify-center text-white text-xs font-bold z-10 border-2 border-white">
                                      {val}
                                    </div>
                                  )}
                               </div>
                             );
                          })}
                       </div>
                    </div>
                  );
                })}
              </div>

           </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3">
          <button 
             onClick={onClose}
             className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
             onClick={handleSave}
             className="flex-1 py-3 bg-primary hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
          >
            <Check size={18} />
            Done
          </button>
        </div>

      </div>
    </div>
  );
};