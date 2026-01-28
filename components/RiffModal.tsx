
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Square, Trash2, Save, Music, Plus, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiffData, RiffNote } from '../types';
import { playRiff, stopPlayback, playNote } from '../services/audioService';
import clsx from 'clsx';
import * as Tone from 'tone';

interface RiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  bpm: number;
}

export const RiffModal: React.FC<RiffModalProps> = ({ isOpen, onClose, bpm }) => {
  const [riff, setRiff] = useState<RiffData>({
    id: crypto.randomUUID(),
    name: 'Mon Riff',
    notes: [],
    bpm: bpm
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadBeat, setPlayheadBeat] = useState(0);
  const [selectedFret, setSelectedFret] = useState(0);
  
  const totalBeats = 16;
  const strings = [5, 4, 3, 2, 1, 0]; // High e to Low E
  const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];

  useEffect(() => {
    let frame: number;
    const sync = () => {
      if (Tone.Transport.state === 'started') {
        const progress = Tone.Transport.seconds * (riff.bpm / 60);
        setPlayheadBeat(progress % totalBeats);
      }
      frame = requestAnimationFrame(sync);
    };
    sync();
    return () => cancelAnimationFrame(frame);
  }, [riff.bpm]);

  const handleTogglePlay = async () => {
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
      setPlayheadBeat(0);
    } else {
      setIsPlaying(true);
      await playRiff(riff, () => {
        setIsPlaying(false);
        setPlayheadBeat(0);
      });
    }
  };

  const handleCellClick = (stringIdx: number, beat: number) => {
    const existing = riff.notes.find(n => n.string === stringIdx && n.beat === beat);
    if (existing) {
      setRiff(prev => ({
        ...prev,
        notes: prev.notes.filter(n => n !== existing)
      }));
    } else {
      const newNote: RiffNote = {
        string: stringIdx,
        fret: selectedFret,
        beat: beat,
        duration: 0.5
      };
      setRiff(prev => ({
        ...prev,
        notes: [...prev.notes, newNote]
      }));
      playNote(stringIdx, selectedFret);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-2 md:p-6">
      <div className="w-full h-full max-w-6xl bg-[#0c0c14] border border-slate-800 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white italic">RIFF<span className="text-indigo-400">STUDIO</span></h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Guitar Tab Sequencer</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 px-6 py-2 rounded-2xl border border-slate-700">
            <button 
              onClick={handleTogglePlay}
              className={clsx("w-12 h-12 rounded-full flex items-center justify-center transition-all", isPlaying ? "bg-red-500" : "bg-primary text-white")}
            >
              {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
            </button>
            <div className="h-8 w-[1px] bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-500">FRET:</span>
              <input 
                type="number" min="0" max="24" value={selectedFret} 
                onChange={(e) => setSelectedFret(Number(e.target.value))}
                className="w-12 bg-black/40 border border-slate-700 rounded-lg p-1 text-center text-white font-black"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setRiff({...riff, notes: []})} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={20} /></button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X size={24} /></button>
          </div>
        </div>

        {/* Tablature Grid */}
        <div className="flex-1 overflow-auto bg-[#09090f] relative p-8 select-none">
          <div className="relative min-w-full inline-block">
            {/* Playhead */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white z-[60] shadow-[0_0_15px_white] pointer-events-none" 
              style={{ left: `${playheadBeat * 50 + 40}px` }}
            />

            {strings.map((s, idx) => (
              <div key={s} className="h-12 flex items-center relative group">
                {/* String Line */}
                <div className="absolute left-10 right-0 h-[1px] bg-slate-800 group-hover:bg-slate-700 transition-colors" />
                
                {/* String Name */}
                <div className="w-10 text-slate-500 font-mono font-black text-sm">{stringNames[5-s]}</div>
                
                {/* Beat Cells */}
                {Array.from({ length: totalBeats * 2 }).map((_, b) => {
                  const beatPos = b / 2;
                  const note = riff.notes.find(n => n.string === s && n.beat === beatPos);
                  return (
                    <div 
                      key={b}
                      onClick={() => handleCellClick(s, beatPos)}
                      className={clsx(
                        "w-[25px] h-full flex items-center justify-center cursor-pointer border-l border-transparent hover:bg-indigo-500/10 transition-colors relative",
                        b % 2 === 0 ? "border-slate-800/30" : ""
                      )}
                    >
                      {note && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div className="bg-indigo-600 text-white font-black text-[10px] w-5 h-5 rounded flex items-center justify-center shadow-lg border border-indigo-400">
                            {note.fret}
                          </div>
                        </div>
                      )}
                      {b % 8 === 0 && <div className="absolute -top-6 text-[9px] font-black text-slate-700">{b/2 + 1}</div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-slate-800 bg-slate-900/40 flex items-center px-8 text-slate-500 text-[10px] font-black uppercase tracking-widest gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-600 rounded" /> NOTE ACTIVE
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-slate-800 rounded" /> CORDE
          </div>
          <p className="ml-auto">Cliquez pour placer une note avec la frette sélectionnée</p>
        </div>
      </div>
    </div>
  );
};
