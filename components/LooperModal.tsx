
import React, { useState, useEffect, useRef } from 'react';
import { X, Square, Play, AudioWaveform, Drum, Scissors, MousePointer, Trash2, VolumeX, Plus, RefreshCcw, Music, Timer, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackingTrackStyle, ChordData, AudioClip } from '../types';
import { updateDAWClips, stopPlayback, initAudio } from '../services/audioService';
import * as Tone from 'tone';
import clsx from 'clsx';

interface TrackState {
    id: string;
    name: string;
    type: 'MIDI' | 'AUDIO' | 'DRUMS';
    isMuted: boolean;
    isSoloed: boolean;
    volume: number;
}

interface LooperModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentStyle: BackingTrackStyle;
  onStyleChange: (style: BackingTrackStyle) => void;
  bpm: number;
  chords?: ChordData[];
}

export const LooperModal: React.FC<LooperModalProps> = ({ 
  isOpen, onClose, isPlaying, onTogglePlay, bpm, chords = []
}) => {
  const [activeTool, setActiveTool] = useState<'SELECT' | 'MUTE' | 'ERASE'>('SELECT');
  const [zoom, setZoom] = useState(60); 
  const [clips, setClips] = useState<AudioClip[]>([]);
  const [playheadBeat, setPlayheadBeat] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('MIDI');
  
  // État dynamique des pistes
  const [tracks, setTracks] = useState<TrackState[]>([
      { id: 'MIDI', name: 'Accords (MIDI)', type: 'MIDI', isMuted: false, isSoloed: false, volume: 0 },
      { id: 'AUDIO_1', name: 'Audio Track 1', type: 'AUDIO', isMuted: false, isSoloed: false, volume: 0 },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalBeats = chords.reduce((acc, c) => acc + c.beats, 0) || 16;

  // Synchronisation avec le moteur audio Tone.js
  useEffect(() => {
    const syncAudio = async () => {
        const anySolo = tracks.some(t => t.isSoloed);
        
        const processedClips = clips.map(clip => {
            const track = tracks.find(t => t.id === clip.trackId);
            // Logique de mixage : Muet si la piste est Muted OU si une autre piste est en Solo (et pas celle-ci)
            const trackMuted = !track || track.isMuted || (anySolo && !track.isSoloed);
            return {
                ...clip,
                muted: clip.muted || trackMuted
            };
        });
        await updateDAWClips(processedClips);
    };
    syncAudio();
  }, [clips, tracks]);

  // Playhead movement
  useEffect(() => {
    let frame: number;
    const sync = () => {
        if (Tone.Transport.state === 'started') {
            const progress = Tone.Transport.seconds * (bpm / 60);
            setPlayheadBeat(progress % totalBeats);
        }
        frame = requestAnimationFrame(sync);
    };
    sync();
    return () => cancelAnimationFrame(frame);
  }, [bpm, totalBeats]);

  const handleAddTrack = () => {
      const newId = `AUDIO_${Date.now()}`;
      setTracks(prev => [...prev, {
          id: newId,
          name: `Audio Track ${prev.length}`,
          type: 'AUDIO',
          isMuted: false,
          isSoloed: false,
          volume: 0
      }]);
      setSelectedTrackId(newId);
  };

  const handleDeleteTrack = (id: string) => {
      if (id === 'MIDI') return; 
      setTracks(prev => prev.filter(t => t.id !== id));
      // Supprimer les clips orphelins
      setClips(prev => prev.filter(c => c.trackId !== id));
      if (selectedTrackId === id) setSelectedTrackId('MIDI');
  };

  const toggleTrackMute = (trackId: string) => {
      setTracks(prev => prev.map(t => t.id === trackId ? { ...t, isMuted: !t.isMuted } : t));
  };

  const toggleTrackSolo = (trackId: string) => {
      setTracks(prev => prev.map(t => t.id === trackId ? { ...t, isSoloed: !t.isSoloed } : t));
  };

  const handleTogglePlay = async () => {
      await initAudio();
      onTogglePlay();
  };

  const addClip = async (file: File) => {
      const url = URL.createObjectURL(file);
      // Toujours assigner à la piste sélectionnée ou la première piste audio disponible
      let targetId = selectedTrackId;
      const targetTrack = tracks.find(t => t.id === targetId);
      if (!targetTrack || targetTrack.type !== 'AUDIO') {
          targetId = tracks.find(t => t.type === 'AUDIO')?.id || 'AUDIO_1';
      }

      const newClip: AudioClip = {
          id: crypto.randomUUID(),
          trackId: targetId,
          type: 'IMPORT',
          url,
          name: file.name,
          startBeat: Math.round(playheadBeat),
          duration: 8,
          offset: 0,
          muted: false,
          color: 'bg-indigo-500'
      };
      setClips(prev => [...prev, newClip]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-2 md:p-6">
      <div className="w-full h-full max-w-7xl bg-[#0c0c14] border border-slate-800 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
        
        {/* BARRE D'OUTILS */}
        <div className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/40">
            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Mixing & Arranging</span>
                    <h2 className="text-xl font-black text-white italic">VIBE<span className="text-indigo-400">STUDIO</span></h2>
                </div>
                <div className="flex bg-black/40 p-1 rounded-xl border border-slate-700/50">
                    <button onClick={() => setActiveTool('SELECT')} className={clsx("p-2 rounded-lg", activeTool === 'SELECT' ? "bg-indigo-600 text-white" : "text-slate-500")}><MousePointer size={16}/></button>
                    <button onClick={() => setActiveTool('MUTE')} className={clsx("p-2 rounded-lg", activeTool === 'MUTE' ? "bg-indigo-600 text-white" : "text-slate-500")}><VolumeX size={16}/></button>
                    <button onClick={() => setActiveTool('ERASE')} className={clsx("p-2 rounded-lg", activeTool === 'ERASE' ? "bg-red-600 text-white" : "text-slate-500")}><Trash2 size={16}/></button>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-800/80 px-6 py-2 rounded-2xl border border-slate-700">
                <button onClick={stopPlayback} className="p-2 text-slate-400 hover:text-white"><RefreshCcw size={18} /></button>
                <button onClick={handleTogglePlay} className={clsx("w-12 h-12 rounded-full flex items-center justify-center transition-all", isPlaying ? "bg-red-500" : "bg-primary text-white")}>
                    {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
                </button>
                <span className="font-mono text-lg text-white tabular-nums">{Math.floor(playheadBeat / 4) + 1}.{(Math.floor(playheadBeat) % 4) + 1}</span>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all">
                    <Plus size={16} /> AUDIO MP3
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={(e) => e.target.files?.[0] && addClip(e.target.files[0])} />
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* SIDEBAR PISTES */}
            <div className="w-56 bg-[#11111a] border-r border-slate-800 flex flex-col overflow-y-auto">
                <AnimatePresence>
                    {tracks.map(track => (
                        <TrackHeader 
                            key={track.id}
                            icon={track.type === 'MIDI' ? Music : AudioWaveform}
                            label={track.name}
                            isSelected={selectedTrackId === track.id}
                            isMuted={track.isMuted}
                            isSoloed={track.isSoloed}
                            onSelect={() => setSelectedTrackId(track.id)}
                            onMute={() => toggleTrackMute(track.id)}
                            onSolo={() => toggleTrackSolo(track.id)}
                            onDelete={track.id !== 'MIDI' ? () => handleDeleteTrack(track.id) : undefined}
                        />
                    ))}
                </AnimatePresence>
                <button 
                    onClick={handleAddTrack}
                    className="m-4 flex items-center justify-center gap-2 py-3 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all border border-dashed border-slate-700"
                >
                    <Plus size={14} /> Nouvelle Piste
                </button>
            </div>

            {/* TIMELINE */}
            <div className="flex-1 flex flex-col overflow-hidden relative bg-[#09090f]">
                <div className="h-8 bg-slate-900/20 border-b border-slate-800 relative" style={{ width: `${totalBeats * zoom}px` }}>
                    {Array.from({ length: totalBeats }).map((_, i) => (
                        <div key={i} className="absolute border-l border-slate-800 h-full" style={{ left: `${i * zoom}px` }}>
                            {i % 4 === 0 && <span className="text-[9px] font-bold text-slate-600 ml-1">{i/4 + 1}</span>}
                        </div>
                    ))}
                </div>

                <div className="flex-1 overflow-x-auto relative no-scrollbar">
                    <div className="relative min-h-full" style={{ width: `${totalBeats * zoom}px` }}>
                        <div className="absolute top-0 bottom-0 w-[2px] bg-white z-[60] shadow-[0_0_15px_white]" style={{ left: `${playheadBeat * zoom}px` }} />

                        {tracks.map(track => (
                            <div key={track.id} className="h-32 border-b border-slate-800/30 relative flex items-center">
                                {track.type === 'MIDI' && chords.map((chord, i) => {
                                    const start = chords.slice(0, i).reduce((a, c) => a + c.beats, 0);
                                    const anySolo = tracks.some(t => t.isSoloed);
                                    const isDimmed = track.isMuted || (anySolo && !track.isSoloed);
                                    return (
                                        <div key={chord.id} 
                                            className={clsx("absolute h-20 border rounded-xl flex flex-col justify-center px-4", isDimmed ? "opacity-20 bg-slate-900" : "bg-indigo-500/10 border-indigo-500/30")}
                                            style={{ left: `${start * zoom + 4}px`, width: `${chord.beats * zoom - 8}px` }}
                                        >
                                            <span className="text-sm font-black text-indigo-300">{chord.name}</span>
                                        </div>
                                    );
                                })}

                                {clips.filter(c => c.trackId === track.id).map(clip => {
                                    const anySolo = tracks.some(t => t.isSoloed);
                                    const isTrackDimmed = track.isMuted || (anySolo && !track.isSoloed);
                                    return (
                                        <div key={clip.id} 
                                            onClick={() => {
                                                if (activeTool === 'ERASE') setClips(prev => prev.filter(c => c.id !== clip.id));
                                                if (activeTool === 'MUTE') setClips(prev => prev.map(c => c.id === clip.id ? {...c, muted: !c.muted} : c));
                                            }}
                                            className={clsx("absolute top-6 bottom-6 rounded-xl border-2 flex flex-col justify-center px-4 cursor-pointer", (isTrackDimmed || clip.muted) ? "opacity-30 grayscale" : "bg-gradient-to-br from-indigo-600 to-pink-600 border-white/20")}
                                            style={{ left: `${clip.startBeat * zoom + 2}px`, width: `${clip.duration * zoom - 4}px` }}
                                        >
                                            <span className="text-xs font-bold text-white truncate">{clip.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const TrackHeader = ({ icon: Icon, label, isSelected, isMuted, isSoloed, onSelect, onMute, onSolo, onDelete }: any) => (
    <motion.div 
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
        onClick={onSelect}
        className={clsx("h-32 border-b border-slate-800/50 p-4 flex flex-col justify-between cursor-pointer group", isSelected ? "bg-indigo-900/10 border-r-2 border-indigo-500" : "bg-black/20")}
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Icon size={14} className={isMuted ? "text-red-500" : isSoloed ? "text-indigo-400" : "text-slate-500"} />
                <span className="text-[10px] font-black uppercase text-slate-500 truncate max-w-[100px]">{label}</span>
            </div>
            {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-500 transition-all"><Trash2 size={12}/></button>}
        </div>
        <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); onMute(); }} className={clsx("w-8 h-8 rounded text-[10px] font-black border", isMuted ? "bg-red-600 border-red-400 text-white" : "bg-slate-800 border-slate-700 text-slate-500")}>M</button>
            <button onClick={(e) => { e.stopPropagation(); onSolo(); }} className={clsx("w-8 h-8 rounded text-[10px] font-black border", isSoloed ? "bg-indigo-600 border-indigo-400 text-white" : "bg-slate-800 border-slate-700 text-slate-500")}>S</button>
        </div>
    </motion.div>
);
