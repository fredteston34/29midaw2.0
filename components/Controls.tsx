
import React, { useState, useRef } from 'react';
import { Play, Square, RefreshCw, Plus, Wand2, Undo, Redo, Repeat, ArrowDown, ArrowUp, BrainCircuit, Disc, FolderHeart, Zap, Download, Loader2, Sliders, Mic, PenTool, Cable, FileAudio, Printer, Music2, HelpCircle, Eye, AlarmClock, AudioWaveform, XCircle, Monitor, Compass, FileOutput, Timer, History, Layers } from 'lucide-react';
import clsx from 'clsx';
import { BackingTrackStyle } from '../types';
import { Tooltip } from './Tooltip';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  bpm: number;
  setBpm: (bpm: number) => void;
  onAddChord: () => void;
  onGenerate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isLooping?: boolean;
  onToggleLoop?: () => void;
  onTranspose?: (semitones: number) => void;
  onAnalyze?: () => void;
  onOpenLibrary?: () => void;
  onOpenMixer?: () => void;
  onImportAudio?: () => void;
  onOpenLyrics?: () => void;
  onOpenPedalboard?: () => void;
  onOpenLooper?: () => void; 
  onOpenTheory?: () => void;
  onSetPreset?: (preset: string) => void;
  presets?: string[];
}

export const Controls: React.FC<ControlsProps> = ({ 
  isPlaying, onPlayPause, onReset, bpm, setBpm, onAddChord, onGenerate, onUndo, onRedo, canUndo, canRedo, onOpenLibrary, onOpenMixer, onOpenLyrics, onOpenPedalboard, onOpenLooper, onOpenTheory, onTranspose, onAnalyze, onImportAudio
}) => {
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  
  const handleTap = () => {
      const now = performance.now();
      const newTaps = [...tapTimes, now].slice(-4);
      if (newTaps.length > 1) {
          const diffs = [];
          for(let i=1; i<newTaps.length; i++) diffs.push(newTaps[i] - newTaps[i-1]);
          const avg = diffs.reduce((a,b) => a+b) / diffs.length;
          const newBpm = Math.round(60000 / avg);
          if (newBpm >= 40 && newBpm <= 240) setBpm(newBpm);
      }
      setTapTimes(newTaps);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
      
      {/* PLAYBACK & TRANSPORT */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <button onClick={onPlayPause} className={clsx("flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all active:scale-90", isPlaying ? "bg-red-500 shadow-red-900/40" : "bg-primary text-white shadow-green-900/40")}>
            {isPlaying ? <Square size={24} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </button>

        <div className="flex items-center gap-1 bg-slate-800 rounded-full p-1 border border-slate-700">
            <Tooltip content="Mini DAW / Clips"><button onClick={onOpenLooper} className="p-3 text-slate-400 hover:text-pink-400 transition-colors"><AudioWaveform size={20} /></button></Tooltip>
            <Tooltip content="Théorie & Quintes"><button onClick={onOpenTheory} className="p-3 text-slate-400 hover:text-indigo-400 transition-colors"><Compass size={20} /></button></Tooltip>
            <Tooltip content="Historique (Undo)"><button onClick={onUndo} disabled={!canUndo} className="p-3 text-slate-400 hover:text-white disabled:opacity-20"><Undo size={20} /></button></Tooltip>
            <Tooltip content="Rétablir (Redo)"><button onClick={onRedo} disabled={!canRedo} className="p-3 text-slate-400 hover:text-white disabled:opacity-20"><Redo size={20} /></button></Tooltip>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-xl border border-slate-700">
            <div className="flex flex-col min-w-[80px]">
                <label className="text-[10px] text-slate-500 font-black uppercase">Tempo: {bpm}</label>
                <input type="range" min="40" max="240" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full accent-primary h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
            </div>
            <button onClick={handleTap} className="p-2 bg-slate-700 hover:bg-indigo-600 rounded-lg text-white transition-all active:scale-90" title="Tap Tempo">
                <Timer size={18} />
            </button>
        </div>
      </div>

      {/* TOOLS & UTILITIES */}
      <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-center">
        <Tooltip content="Paroles"><button onClick={onOpenLyrics} className="p-3 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 hover:text-pink-400 transition-all"><PenTool size={20} /></button></Tooltip>
        <Tooltip content="Analyse IA"><button onClick={onAnalyze} className="p-3 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 hover:text-purple-400 transition-all"><BrainCircuit size={20} /></button></Tooltip>
        <Tooltip content="Transposer -1"><button onClick={() => onTranspose?.(-1)} className="p-3 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 hover:text-white transition-all"><ArrowDown size={20} /></button></Tooltip>
        <Tooltip content="Transposer +1"><button onClick={() => onTranspose?.(1)} className="p-3 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 hover:text-white transition-all"><ArrowUp size={20} /></button></Tooltip>
        <div className="w-[1px] h-8 bg-slate-700 mx-2 hidden lg:block" />
        <Tooltip content="Bibliothèque"><button onClick={onOpenLibrary} className="p-3 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 hover:text-red-400 transition-all"><FolderHeart size={20} /></button></Tooltip>
        <Tooltip content="Import Audio"><button onClick={onImportAudio} className="p-3 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 hover:text-cyan-400 transition-all"><FileAudio size={20} /></button></Tooltip>
        <div className="w-[1px] h-8 bg-slate-700 mx-2 hidden lg:block" />
        <Tooltip content="Pédalier FX"><button onClick={onOpenPedalboard} className="p-3 bg-orange-600/20 text-orange-400 border border-orange-500/50 rounded-xl hover:bg-orange-600 hover:text-white transition-all"><Cable size={20} /></button></Tooltip>
        <Tooltip content="Mixer & Sons"><button onClick={onOpenMixer} className="p-3 bg-slate-800 text-cyan-400 rounded-xl border border-slate-700 hover:bg-slate-700 transition-all"><Sliders size={20} /></button></Tooltip>
        <Tooltip content="Générateur IA"><button onClick={onGenerate} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-black shadow-lg shadow-purple-900/20 active:scale-95 transition-all"><Wand2 size={18} /> GENERATE</button></Tooltip>
      </div>
    </div>
  );
};
