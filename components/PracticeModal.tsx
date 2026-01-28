
import React, { useState, useEffect } from 'react';
import { X, Play, Square, Timer, ChevronRight } from 'lucide-react';
import { ChordData } from '../types';
import { playProgression, stopPlayback } from '../services/audioService';

interface PracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  chords: ChordData[];
}

export const PracticeModal: React.FC<PracticeModalProps> = ({ isOpen, onClose, chords }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(80);
  const [currentChordIndex, setCurrentChordIndex] = useState(-1);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Stop playback on close
  useEffect(() => {
      if (!isOpen) {
          stopPlayback();
          setIsPlaying(false);
          setCurrentChordIndex(-1);
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStart = () => {
      if (isPlaying) {
          stopPlayback();
          setIsPlaying(false);
          setCurrentChordIndex(-1);
          setCountdown(null);
      } else {
          setIsPlaying(true);
          // Fix: Aligned with playProgression signature (removed invalid boolean and string arguments)
          playProgression(
              chords,
              bpm,
              (index) => {
                  setCurrentChordIndex(index);
              },
              (beat) => {
                  const currentChord = chords[currentChordIndex];
                  if (currentChord) {
                      const beatsLeft = currentChord.beats - beat;
                      if (beatsLeft <= 4) {
                          setCountdown(beatsLeft);
                      } else {
                          setCountdown(null);
                      }
                  }
              },
              () => setIsPlaying(false),
              true, // Loop
              0 // Capo
          );
      }
  };

  const currentChord = chords[currentChordIndex];
  const nextChord = chords[(currentChordIndex + 1) % chords.length];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-orange-900/90 backdrop-blur-md">
       <button onClick={onClose} className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full">
           <X size={24} />
       </button>

       <div className="w-full max-w-4xl flex flex-col items-center">
           
           <div className="flex items-center gap-2 mb-8 text-orange-200">
               <Timer size={24} />
               <h2 className="text-xl font-bold uppercase tracking-widest">Chord Transition Drill</h2>
           </div>

           {/* Main Display */}
           <div className="flex items-center gap-8 md:gap-16 w-full justify-center mb-12">
               
               {/* Current Chord */}
               <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-3xl flex items-center justify-center transition-all duration-300 ${isPlaying ? 'bg-white text-orange-600 scale-110 shadow-[0_0_60px_rgba(255,255,255,0.3)]' : 'bg-white/10 text-white'}`}>
                   {isPlaying && countdown && countdown <= 4 && (
                       <div className="absolute inset-0 flex items-center justify-center text-[12rem] font-black text-orange-500/20 animate-ping select-none">
                           {countdown}
                       </div>
                   )}
                   <div className="text-center">
                       <p className="text-sm font-bold uppercase tracking-widest mb-2 opacity-60">Current</p>
                       <h3 className="text-6xl md:text-7xl font-black">{currentChord ? currentChord.name : '?'}</h3>
                   </div>
               </div>

               <ChevronRight size={48} className="text-white/30" />

               {/* Next Chord Preview */}
               <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white/5 border-2 border-white/10 flex items-center justify-center text-white/50">
                    <div className="text-center">
                       <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-40">Next</p>
                       <h3 className="text-3xl font-bold">{nextChord ? nextChord.name : '?'}</h3>
                   </div>
               </div>
           </div>

           {/* Controls */}
           <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl backdrop-blur-sm">
                    <span className="text-white font-mono text-sm">TEMPO: {bpm}</span>
                    <input 
                        type="range" 
                        min="40" 
                        max="160" 
                        value={bpm}
                        onChange={(e) => setBpm(Number(e.target.value))}
                        className="w-48 accent-orange-500"
                    />
                </div>

                <button 
                    onClick={handleStart}
                    className={`px-12 py-6 rounded-full font-black text-xl uppercase tracking-widest shadow-2xl transition-transform active:scale-95 flex items-center gap-3 ${isPlaying ? 'bg-red-500 text-white' : 'bg-white text-orange-600'}`}
                >
                    {isPlaying ? <><Square fill="currentColor" /> Stop</> : <><Play fill="currentColor" /> Start Drill</>}
                </button>
           </div>

       </div>
    </div>
  );
};
