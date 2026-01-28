
import React, { useState, useEffect } from 'react';
import { X, Search, Book, ChevronRight, Hash, Play, Plus, Volume2 } from 'lucide-react';
import { CHORD_CATEGORIES, ChordTemplate, getVoicingOptions } from '../services/chordDictionary';
import { previewChord } from '../services/audioService';
import clsx from 'clsx';

interface ChordBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChord: (template: ChordTemplate) => void;
}

export const ChordBrowser: React.FC<ChordBrowserProps> = ({ isOpen, onClose, onAddChord }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChord, setSelectedChord] = useState<ChordTemplate | null>(null);
  const [selectedVoicingIndex, setSelectedVoicingIndex] = useState(0);

  // Reset when closed
  useEffect(() => {
      if (!isOpen) {
          setSelectedChord(null);
          setSearchTerm('');
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCategories = CHORD_CATEGORIES.map(cat => ({
    ...cat,
    chords: cat.chords.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  })).filter(cat => cat.chords.length > 0);

  const currentVoicings = selectedChord ? getVoicingOptions(selectedChord.name) : [];
  // Use the predefined voicings if available, otherwise use the default fingering from template
  const activeFingering = (currentVoicings.length > 0 && currentVoicings[selectedVoicingIndex]) 
      ? currentVoicings[selectedVoicingIndex] 
      : (selectedChord?.fingering || [-1, -1, -1, -1, -1, -1]);

  const handleChordSelect = (chord: ChordTemplate) => {
      setSelectedChord(chord);
      setSelectedVoicingIndex(0);
      previewChord({ ...chord, fingering: chord.fingering, id: 'preview', beats: 4 });
  };

  const handlePlayPreview = () => {
      if (selectedChord) {
          previewChord({ ...selectedChord, fingering: activeFingering, id: 'preview', beats: 4 });
      }
  };

  const handleAdd = () => {
      if (selectedChord) {
          onAddChord({ ...selectedChord, fingering: activeFingering });
      }
  };

  // Helper for Fretboard SVG
  const FretboardPreview = ({ fingering }: { fingering: number[] }) => {
      const activeFrets = fingering.filter(f => f > 0);
      const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
      const maxFret = activeFrets.length > 0 ? Math.max(...activeFrets) : 1;
      
      // Determine viewport (show at least 4 frets)
      const startFret = Math.max(1, minFret - (minFret > 1 ? 1 : 0));
      const endFret = Math.max(startFret + 3, maxFret);
      const fretCount = endFret - startFret + 1;

      return (
          <div className="relative w-full h-48 bg-[#1e1e24] rounded-xl border-4 border-slate-700 shadow-inner flex flex-col justify-center overflow-hidden select-none">
              {/* Strings */}
              <div className="absolute inset-x-8 top-8 bottom-8 flex flex-col justify-between z-10">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={clsx("w-full bg-slate-500 shadow-[0_1px_2px_rgba(0,0,0,0.5)]", i < 3 ? "h-[2px]" : "h-[1px]")} />
                  ))}
              </div>

              {/* Frets */}
              <div className="absolute inset-y-0 left-8 right-8 flex justify-between z-0">
                  {Array.from({ length: fretCount + 1 }).map((_, i) => (
                      <div key={i} className="h-full w-[2px] bg-slate-600 relative">
                          {i < fretCount && (
                              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-500">
                                  {startFret + i}
                              </span>
                          )}
                      </div>
                  ))}
              </div>

              {/* Nut (if visible) */}
              {startFret === 1 && (
                  <div className="absolute left-8 top-0 bottom-0 w-2 bg-slate-400 z-10 shadow-lg" />
              )}

              {/* Markers (Dots) */}
              <div className="absolute inset-x-8 top-8 bottom-8 flex flex-col justify-between z-20 pointer-events-none">
                  {[0, 1, 2, 3, 4, 5].map((stringIdx) => {
                      const fretVal = fingering[5 - stringIdx]; // Strings are reversed in array vs visual (Elow is 0, visual top is Elow)
                      
                      // Actually, let's map standard: index 0 = Low E (Bottom physically, Top visually often, but here let's do Top=High E for standard tab view or standard view?)
                      // Standard diagram: Top line = High E (string 5), Bottom line = Low E (string 0)
                      // Let's stick to: Top line = High E (index 5)
                      const visualStringIndex = stringIdx; 
                      const actualStringDataIndex = 5 - visualStringIndex;
                      const f = fingering[actualStringDataIndex];

                      if (f === -1) {
                          return (
                              <div key={stringIdx} className="absolute left-[-15px] -mt-2 text-red-500/50 font-bold text-xs">✕</div>
                          );
                      }
                      if (f === 0) {
                          return (
                              <div key={stringIdx} className="absolute left-[-15px] -mt-2 text-green-500 font-bold text-xs">○</div>
                          );
                      }
                      
                      // Calculate position
                      if (f >= startFret && f <= endFret) {
                          const fretIndex = f - startFret;
                          // Position in middle of fret slot
                          const percent = (fretIndex + 0.5) / fretCount; 
                          return (
                              <div 
                                  key={stringIdx} 
                                  className="absolute w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow-[0_0_10px_rgba(34,197,94,0.5)] -mt-2.5 -ml-2.5 flex items-center justify-center text-[9px] font-bold text-black"
                                  style={{ left: `${percent * 100}%` }}
                              >
                                  
                              </div>
                          );
                      }
                      return <div key={stringIdx} />;
                  })}
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[85vh] bg-surface border border-slate-700 rounded-3xl shadow-2xl flex overflow-hidden">
        
        {/* LEFT COLUMN: LIST */}
        <div className="w-full md:w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
            <div className="p-6 border-b border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-primary">
                        <Book size={24} />
                        <h2 className="text-xl font-black uppercase tracking-widest">Dictionnaire</h2>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Rechercher un accord..."
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition-all placeholder-slate-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {filteredCategories.length === 0 ? (
                    <div className="text-center py-10 text-slate-600 italic text-sm">
                        Aucun résultat...
                    </div>
                ) : (
                    filteredCategories.map(cat => (
                        <div key={cat.title}>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-2">
                                {cat.title}
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {cat.chords.map(chord => (
                                    <button
                                        key={chord.name}
                                        onClick={() => handleChordSelect(chord)}
                                        className={clsx(
                                            "px-3 py-2 rounded-lg text-left text-sm font-bold transition-all border",
                                            selectedChord?.name === chord.name
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105 z-10"
                                                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white"
                                        )}
                                    >
                                        {chord.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: INSPECTOR */}
        <div className="flex-1 bg-[#13131d] relative flex flex-col p-8">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={20} />
            </button>

            {selectedChord ? (
                <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                    <div className="mb-8">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">
                            Sélectionné
                        </span>
                        <h1 className="text-5xl font-black text-white mt-4 flex items-center gap-4">
                            {selectedChord.name}
                            <button 
                                onClick={handlePlayPreview} 
                                className="p-3 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500 hover:text-white transition-all"
                            >
                                <Volume2 size={24} />
                            </button>
                        </h1>
                    </div>

                    <div className="flex-1 flex flex-col gap-8">
                        {/* Voicing Selector */}
                        {currentVoicings.length > 1 && (
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Positions (Variantes)</label>
                                <div className="flex gap-2">
                                    {currentVoicings.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { setSelectedVoicingIndex(idx); handlePlayPreview(); }}
                                            className={clsx(
                                                "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all border",
                                                selectedVoicingIndex === idx 
                                                    ? "bg-indigo-600 text-white border-indigo-500" 
                                                    : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                                            )}
                                        >
                                            Position {idx + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Visualizer */}
                        <div className="flex-1 flex items-center justify-center bg-black/20 rounded-3xl border border-slate-800 p-8">
                            <div className="w-full max-w-2xl">
                                <FretboardPreview fingering={activeFingering} />
                                
                                <div className="mt-6 flex justify-between items-end text-slate-500 font-mono text-xs">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 block" /> Doigts
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full border border-green-500 block" /> Corde à vide
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-500 font-bold">✕</span> Corde étouffée
                                        </div>
                                    </div>
                                    <div>
                                        Frettes {activeFingering.filter(f => f > 0).length > 0 ? Math.min(...activeFingering.filter(f => f > 0)) : 1} - {activeFingering.filter(f => f > 0).length > 0 ? Math.max(...activeFingering.filter(f => f > 0)) : 4}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={handleAdd}
                            className="px-8 py-4 bg-primary hover:bg-green-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-green-900/30 flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus size={24} strokeWidth={3} />
                            AJOUTER À LA GRILLE
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                    <Book size={64} className="mb-6 opacity-20" />
                    <p className="text-lg font-medium">Sélectionnez un accord dans la liste</p>
                    <p className="text-sm opacity-60">Visualisez, écoutez et apprenez.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
