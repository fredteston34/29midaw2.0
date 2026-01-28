
import React, { useState } from 'react';
import { X, Info, Plus, Compass } from 'lucide-react';
import { ChordTemplate, getFingeringForChord } from '../services/chordDictionary';
import clsx from 'clsx';

interface CircleOfFifthsProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChord: (template: ChordTemplate) => void;
}

const KEYS = [
  { major: 'C', minor: 'Am', idx: 0 },
  { major: 'G', minor: 'Em', idx: 1 },
  { major: 'D', minor: 'Bm', idx: 2 },
  { major: 'A', minor: 'F#m', idx: 3 },
  { major: 'E', minor: 'C#m', idx: 4 },
  { major: 'B', minor: 'G#m', idx: 5 },
  { major: 'F#', minor: 'D#m', idx: 6 },
  { major: 'Db', minor: 'Bbm', idx: 7 },
  { major: 'Ab', minor: 'Fm', idx: 8 },
  { major: 'Eb', minor: 'Cm', idx: 9 },
  { major: 'Bb', minor: 'Gm', idx: 10 },
  { major: 'F', minor: 'Dm', idx: 11 },
];

export const CircleOfFifths: React.FC<CircleOfFifthsProps> = ({ isOpen, onClose, onAddChord }) => {
  const [selectedKeyIndex, setSelectedKeyIndex] = useState(0); // 0 = C

  if (!isOpen) return null;

  const currentKey = KEYS[selectedKeyIndex];

  // Helper to safely get neighbors (looping array)
  const getNeighbor = (offset: number) => {
      const idx = (selectedKeyIndex + offset + 12) % 12;
      return KEYS[idx];
  };

  const IV = getNeighbor(-1); // Subdominant
  const I = currentKey;       // Tonic
  const V = getNeighbor(1);   // Dominant

  // Functional Harmony Map
  const harmonicPalette = [
      { degree: 'I', name: I.major, role: 'Tonique (Maison)', type: 'MAJOR', color: 'bg-emerald-500' },
      { degree: 'ii', name: IV.minor, role: 'Sous-Dominante Mineure', type: 'MINOR', color: 'bg-blue-500' },
      { degree: 'iii', name: V.minor, role: 'Médiante', type: 'MINOR', color: 'bg-indigo-500' },
      { degree: 'IV', name: IV.major, role: 'Sous-Dominante', type: 'MAJOR', color: 'bg-cyan-500' },
      { degree: 'V', name: V.major, role: 'Dominante (Tension)', type: 'MAJOR', color: 'bg-orange-500' },
      { degree: 'vi', name: I.minor, role: 'Relative Mineure', type: 'MINOR', color: 'bg-purple-500' },
  ];

  const handleAdd = (name: string) => {
      const fingering = getFingeringForChord(name);
      if (fingering) {
          onAddChord({ name, fingering });
      } else {
          // Fallback for uncommon chords, create basic template
          onAddChord({ name, fingering: [-1,-1,-1,-1,-1,-1] });
      }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Compass size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Théorie Musicale</h2>
                    <p className="text-xs text-slate-400">Le Cycle des Quintes</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col md:flex-row gap-10 items-center justify-center">
            
            {/* THE WHEEL */}
            <div className="relative w-72 h-72 md:w-96 md:h-96 flex-shrink-0">
                 {/* Decorative Center */}
                 <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-700 z-20 flex items-center justify-center shadow-2xl">
                     <div className="text-center">
                         <div className="text-[10px] font-bold text-slate-500 uppercase">Tonalité</div>
                         <div className="text-3xl font-black text-white">{currentKey.major}</div>
                     </div>
                 </div>

                 {/* Pie Slices */}
                 {KEYS.map((k, i) => {
                     const angle = (i * 30) - 90; // Start at top (C)
                     const isSelected = i === selectedKeyIndex;
                     const isNeighbor = [
                         (selectedKeyIndex - 1 + 12) % 12, 
                         selectedKeyIndex, 
                         (selectedKeyIndex + 1 + 12) % 12
                     ].includes(i);
                     
                     return (
                         <button
                            key={k.major}
                            onClick={() => setSelectedKeyIndex(i)}
                            className={clsx(
                                "absolute top-1/2 left-1/2 w-32 h-32 md:w-44 md:h-44 origin-bottom-right border border-slate-800/50 transition-all duration-300 flex items-start justify-end p-2",
                                isSelected ? "bg-indigo-600 z-10 scale-110 shadow-lg" : 
                                isNeighbor ? "bg-slate-700/80 hover:bg-slate-600" : "bg-slate-800/40 hover:bg-slate-700/60"
                            )}
                            style={{ 
                                transform: `rotate(${angle}deg) skew(60deg)` 
                            }}
                         >
                             <div 
                                style={{ transform: `skew(-60deg) rotate(${ -angle }deg)` }}
                                className="absolute bottom-4 right-8 flex flex-col items-center"
                             >
                                 <span className={clsx("font-black text-lg", isSelected ? "text-white" : "text-slate-400")}>{k.major}</span>
                                 <span className={clsx("text-xs font-bold", isSelected ? "text-indigo-200" : "text-slate-600")}>{k.minor}</span>
                             </div>
                         </button>
                     );
                 })}
            </div>

            {/* HARMONY PALETTE */}
            <div className="flex-1 w-full max-w-md">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Info size={14} />
                        Accords Compatibles (Gamme de {currentKey.major})
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {harmonicPalette.map((chord) => (
                            <button
                                key={chord.degree}
                                onClick={() => handleAdd(chord.name)}
                                className="group relative flex items-center justify-between p-3 bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded-xl transition-all hover:-translate-y-1 active:scale-95 shadow-sm hover:shadow-lg overflow-hidden"
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${chord.color}`} />
                                
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-black text-white">{chord.name}</span>
                                        <span className="text-xs font-mono font-bold text-slate-500">{chord.degree}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium">{chord.role}</span>
                                </div>

                                <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-indigo-600 flex items-center justify-center transition-colors">
                                    <Plus size={16} className="text-slate-400 group-hover:text-white" />
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 text-xs text-slate-500 bg-black/20 p-3 rounded-lg leading-relaxed">
                        <strong>Astuce :</strong> La ligne du haut (I, IV, V) sont les accords Majeurs principaux. La ligne du bas sont leurs cousins Mineurs. Vous pouvez composer 90% des tubes de pop avec ces 6 accords !
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
