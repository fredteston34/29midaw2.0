
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Square, Play, AudioWaveform, Drum, Scissors, MousePointer, Trash2, VolumeX, Plus, RefreshCcw, Music, Timer, Volume2, MoreVertical, Layers, GripHorizontal, Sliders } from 'lucide-react';
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
    pan: number;
    color: string;
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

// Générateur de fausse waveform pour le visuel
const WaveformSVG = ({ color }: { color: string }) => {
    const points = useMemo(() => {
        let path = "M 0 25 ";
        for (let i = 0; i <= 100; i += 2) {
            const height = Math.random() * 20;
            path += `L ${i}% ${25 - height} L ${i + 1}% ${25 + height} `;
        }
        return path;
    }, []);

    return (
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full opacity-60">
            <path d={points} stroke="currentColor" strokeWidth="0.5" fill="none" className={color} />
            <path d={points} stroke="currentColor" strokeWidth="0.5" fill="none" className="text-white opacity-20" transform="scale(1, -1) translate(0, -50)" />
        </svg>
    );
};

// Visuel "Piano Roll" pour le MIDI
const MidiRollSVG = () => {
    return (
        <div className="w-full h-full relative opacity-40">
            {Array.from({ length: 8 }).map((_, i) => (
                <div 
                    key={i} 
                    className="absolute h-1 bg-white rounded-sm"
                    style={{
                        left: `${i * 12 + Math.random() * 5}%`,
                        width: `${10 + Math.random() * 10}%`,
                        top: `${10 + Math.random() * 80}%`
                    }}
                />
            ))}
        </div>
    );
};

export const LooperModal: React.FC<LooperModalProps> = ({ 
  isOpen, onClose, isPlaying, onTogglePlay, bpm, chords = []
}) => {
  const [activeTool, setActiveTool] = useState<'SELECT' | 'MUTE' | 'ERASE'>('SELECT');
  const [zoom, setZoom] = useState(80); 
  const [clips, setClips] = useState<AudioClip[]>([]);
  const [playheadBeat, setPlayheadBeat] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('MIDI');
  
  // État dynamique des pistes
  const [tracks, setTracks] = useState<TrackState[]>([
      { id: 'MIDI', name: 'Guide Harmonie', type: 'MIDI', isMuted: false, isSoloed: false, volume: -5, pan: 0, color: 'text-indigo-400' },
      { id: 'AUDIO_1', name: 'Guitare Lead', type: 'AUDIO', isMuted: false, isSoloed: false, volume: 0, pan: -0.2, color: 'text-emerald-400' },
      { id: 'AUDIO_2', name: 'Ambiance', type: 'AUDIO', isMuted: false, isSoloed: false, volume: -10, pan: 0.2, color: 'text-pink-400' },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalBeats = Math.max(32, chords.reduce((acc, c) => acc + c.beats, 0));

  // Synchronisation avec le moteur audio Tone.js
  useEffect(() => {
    const syncAudio = async () => {
        const anySolo = tracks.some(t => t.isSoloed);
        
        const processedClips = clips.map(clip => {
            const track = tracks.find(t => t.id === clip.trackId);
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
          name: `Piste Audio ${prev.length}`,
          type: 'AUDIO',
          isMuted: false,
          isSoloed: false,
          volume: 0,
          pan: 0,
          color: 'text-blue-400'
      }]);
      setSelectedTrackId(newId);
  };

  const handleDeleteTrack = (id: string) => {
      if (id === 'MIDI') return; 
      setTracks(prev => prev.filter(t => t.id !== id));
      setClips(prev => prev.filter(c => c.trackId !== id));
      if (selectedTrackId === id) setSelectedTrackId('MIDI');
  };

  const toggleTrackMute = (trackId: string) => {
      setTracks(prev => prev.map(t => t.id === trackId ? { ...t, isMuted: !t.isMuted } : t));
  };

  const toggleTrackSolo = (trackId: string) => {
      setTracks(prev => prev.map(t => t.id === trackId ? { ...t, isSoloed: !t.isSoloed } : t));
  };

  const updateTrackVolume = (trackId: string, val: number) => {
      setTracks(prev => prev.map(t => t.id === trackId ? { ...t, volume: val } : t));
  };

  const handleTogglePlay = async () => {
      await initAudio();
      onTogglePlay();
  };

  const addClip = async (file: File) => {
      const url = URL.createObjectURL(file);
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
          color: 'bg-emerald-600'
      };
      setClips(prev => [...prev, newClip]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-[#050508] backdrop-blur-3xl flex items-center justify-center p-0 md:p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full h-full bg-[#121216] border border-slate-800 md:rounded-[1.5rem] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* TOP BAR / TRANSPORT */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#18181e] shrink-0 z-20">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50">
                        <AudioWaveform size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-none tracking-tight">Studio</h2>
                        <span className="text-[10px] font-mono text-slate-500">{bpm} BPM • 4/4</span>
                    </div>
                </div>
                
                <div className="h-8 w-[1px] bg-slate-700 mx-2" />

                <div className="flex bg-black/40 p-1 rounded-lg border border-slate-700/50 gap-1">
                    <button onClick={() => setActiveTool('SELECT')} className={clsx("p-2 rounded-md transition-all", activeTool === 'SELECT' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:text-slate-300")} title="Sélection"><MousePointer size={14}/></button>
                    <button onClick={() => setActiveTool('MUTE')} className={clsx("p-2 rounded-md transition-all", activeTool === 'MUTE' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:text-slate-300")} title="Mute Clip"><VolumeX size={14}/></button>
                    <button onClick={() => setActiveTool('ERASE')} className={clsx("p-2 rounded-md transition-all", activeTool === 'ERASE' ? "bg-red-600 text-white shadow-md" : "text-slate-500 hover:text-slate-300")} title="Effacer"><Trash2 size={14}/></button>
                </div>
            </div>

            {/* Transport Center */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
                <div className="flex items-center bg-black/50 rounded-xl border border-slate-800 px-4 py-1 gap-4 font-mono text-2xl font-black text-white shadow-inner">
                    <span className="text-indigo-400">{String(Math.floor(playheadBeat / 4) + 1).padStart(2, '0')}</span>
                    <span className="text-slate-600">:</span>
                    <span>{String((Math.floor(playheadBeat) % 4) + 1).padStart(2, '0')}</span>
                    <span className="text-slate-600">:</span>
                    <span className="text-slate-500 text-lg mt-1">00</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={stopPlayback} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors border border-slate-700"><Square size={16} fill="currentColor" /></button>
                    <button onClick={handleTogglePlay} className={clsx("p-4 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95", isPlaying ? "bg-red-500 text-white shadow-red-900/30" : "bg-emerald-500 text-white shadow-emerald-900/30")}>
                        {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>
                    <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors border border-slate-700"><RefreshCcw size={16} /></button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all group">
                    <Plus size={14} className="group-hover:text-emerald-400" />
                    <span className="hidden md:inline">IMPORT AUDIO</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={(e) => e.target.files?.[0] && addClip(e.target.files[0])} />
                <div className="h-8 w-[1px] bg-slate-700 mx-2" />
                <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* TRACK HEADERS */}
            <div className="w-64 bg-[#16161c] border-r border-slate-800 flex flex-col overflow-y-auto shrink-0 z-10 shadow-[5px_0_20px_rgba(0,0,0,0.3)]">
                <div className="h-8 border-b border-slate-800 bg-[#1a1a22] flex items-center px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 z-10">
                    Pistes
                </div>
                <div className="flex-1">
                    <AnimatePresence>
                        {tracks.map(track => (
                            <TrackHeader 
                                key={track.id}
                                track={track}
                                isSelected={selectedTrackId === track.id}
                                onSelect={() => setSelectedTrackId(track.id)}
                                onMute={() => toggleTrackMute(track.id)}
                                onSolo={() => toggleTrackSolo(track.id)}
                                onVolumeChange={(v: number) => updateTrackVolume(track.id, v)}
                                onDelete={track.id !== 'MIDI' ? () => handleDeleteTrack(track.id) : undefined}
                            />
                        ))}
                    </AnimatePresence>
                    <button 
                        onClick={handleAddTrack}
                        className="w-full py-3 text-slate-500 hover:text-white hover:bg-slate-800/50 text-xs font-bold transition-all flex items-center justify-center gap-2 border-t border-dashed border-slate-800 mt-2"
                    >
                        <Plus size={14} /> Ajouter une piste
                    </button>
                </div>
            </div>

            {/* TIMELINE AREA */}
            <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0e0e12]">
                
                {/* Ruler */}
                <div className="h-8 bg-[#1a1a22] border-b border-slate-800 relative overflow-hidden" style={{ width: '100%' }}>
                    <div className="absolute inset-y-0 left-0 flex" style={{ width: `${totalBeats * zoom}px`, transform: `translateX(0px)` }}>
                        {Array.from({ length: totalBeats }).map((_, i) => (
                            <div key={i} className="flex-shrink-0 relative border-l border-slate-700/30" style={{ width: `${zoom}px` }}>
                                {i % 4 === 0 && (
                                    <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-slate-500">
                                        {i/4 + 1}
                                    </span>
                                )}
                                {/* Subdivisions */}
                                <div className="absolute bottom-0 left-1/4 h-1 w-[1px] bg-slate-800" />
                                <div className="absolute bottom-0 left-2/4 h-1.5 w-[1px] bg-slate-700" />
                                <div className="absolute bottom-0 left-3/4 h-1 w-[1px] bg-slate-800" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grid & Clips */}
                <div className="flex-1 overflow-auto relative custom-scrollbar">
                    <div className="relative min-h-full" style={{ width: `${totalBeats * zoom}px` }}>
                        
                        {/* Background Grid Pattern */}
                        <div 
                            className="absolute inset-0 pointer-events-none opacity-10"
                            style={{ 
                                backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
                                backgroundSize: `${zoom}px 128px` 
                            }} 
                        />
                        <div 
                            className="absolute inset-0 pointer-events-none opacity-5"
                            style={{ 
                                backgroundImage: `linear-gradient(to right, #475569 1px, transparent 1px)`,
                                backgroundSize: `${zoom / 4}px 100%` 
                            }} 
                        />

                        {/* Playhead */}
                        <div className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-50 shadow-[0_0_10px_red] pointer-events-none transition-transform duration-75" style={{ transform: `translateX(${playheadBeat * zoom}px)` }}>
                            <div className="w-3 h-3 -ml-1.5 bg-red-500 rotate-45 -mt-1.5" />
                        </div>

                        {/* Tracks Rows */}
                        {tracks.map(track => (
                            <div key={track.id} className="h-32 border-b border-slate-800/50 relative flex items-center group">
                                {/* Row Highlight */}
                                <div className={clsx("absolute inset-0 transition-opacity pointer-events-none", selectedTrackId === track.id ? "bg-white/5 opacity-100" : "opacity-0 group-hover:opacity-100 bg-white/[0.02]")} />

                                {/* MIDI Clips (From Chords) */}
                                {track.type === 'MIDI' && chords.map((chord, i) => {
                                    const start = chords.slice(0, i).reduce((a, c) => a + c.beats, 0);
                                    const anySolo = tracks.some(t => t.isSoloed);
                                    const isDimmed = track.isMuted || (anySolo && !track.isSoloed);
                                    return (
                                        <div key={chord.id} 
                                            className={clsx(
                                                "absolute h-24 top-4 rounded-lg overflow-hidden border transition-all hover:brightness-110 cursor-pointer shadow-lg",
                                                isDimmed ? "opacity-30 grayscale border-slate-700" : "bg-indigo-900/40 border-indigo-500/50 shadow-indigo-900/20"
                                            )}
                                            style={{ left: `${start * zoom}px`, width: `${chord.beats * zoom}px` }}
                                        >
                                            <div className="absolute inset-0 flex flex-col p-2">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[10px] font-black text-indigo-200 bg-indigo-600/50 px-1.5 rounded">{chord.name}</span>
                                                </div>
                                                <MidiRollSVG />
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Audio Clips */}
                                {clips.filter(c => c.trackId === track.id).map(clip => {
                                    const anySolo = tracks.some(t => t.isSoloed);
                                    const isTrackDimmed = track.isMuted || (anySolo && !track.isSoloed);
                                    return (
                                        <div key={clip.id} 
                                            onClick={() => {
                                                if (activeTool === 'ERASE') setClips(prev => prev.filter(c => c.id !== clip.id));
                                                if (activeTool === 'MUTE') setClips(prev => prev.map(c => c.id === clip.id ? {...c, muted: !c.muted} : c));
                                            }}
                                            className={clsx(
                                                "absolute h-24 top-4 rounded-lg overflow-hidden border transition-all cursor-pointer shadow-md",
                                                (isTrackDimmed || clip.muted) 
                                                    ? "opacity-40 grayscale bg-slate-800 border-slate-600" 
                                                    : "bg-emerald-900/40 border-emerald-500/50 hover:border-emerald-400"
                                            )}
                                            style={{ left: `${clip.startBeat * zoom}px`, width: `${clip.duration * zoom}px` }}
                                        >
                                            <div className="absolute inset-0 flex flex-col p-2">
                                                <div className="flex justify-between items-center mb-1 z-10">
                                                    <span className="text-[10px] font-bold text-emerald-100 truncate max-w-[80%]">{clip.name}</span>
                                                    {clip.muted && <VolumeX size={10} className="text-red-400" />}
                                                </div>
                                                <WaveformSVG color={isTrackDimmed ? "text-slate-500" : "text-emerald-400"} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}

                        {/* Empty State Prompt */}
                        {clips.length === 0 && chords.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-slate-700 text-center">
                                    <Layers size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-bold">La Timeline est vide</p>
                                    <p className="text-sm">Ajoutez des accords ou importez de l'audio pour commencer.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// COMPONENT: Track Header (Left Sidebar)
const TrackHeader = ({ track, isSelected, onSelect, onMute, onSolo, onDelete, onVolumeChange }: any) => (
    <div 
        onClick={onSelect}
        className={clsx(
            "h-32 border-b border-slate-800 p-3 flex flex-col cursor-pointer group relative transition-colors", 
            isSelected ? "bg-[#1f1f26]" : "bg-[#16161c] hover:bg-[#1a1a20]"
        )}
    >
        {/* Selection Indicator */}
        {isSelected && <div className={clsx("absolute left-0 top-0 bottom-0 w-1", track.color.replace('text-', 'bg-'))} />}

        <div className="flex items-center justify-between mb-2 pl-2">
            <div className="flex items-center gap-2 overflow-hidden">
                <span className={clsx("p-1 rounded bg-slate-800", track.color)}>
                    {track.type === 'MIDI' ? <Music size={12} /> : <AudioWaveform size={12} />}
                </span>
                <span className="text-xs font-bold text-slate-300 truncate">{track.name}</span>
            </div>
            {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-500 transition-all"><Trash2 size={12}/></button>}
        </div>

        {/* Controls */}
        <div className="mt-auto space-y-3 pl-2 pr-1">
            {/* Volume Slider */}
            <div className="flex items-center gap-2 group/vol">
                <Volume2 size={12} className="text-slate-600 group-hover/vol:text-slate-400" />
                <input 
                    type="range" min="-60" max="6" value={track.volume} 
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-500 hover:accent-white"
                />
            </div>

            {/* Mute / Solo */}
            <div className="flex gap-2">
                <button 
                    onClick={(e) => { e.stopPropagation(); onMute(); }} 
                    className={clsx(
                        "flex-1 py-1 rounded text-[10px] font-black border transition-colors", 
                        track.isMuted ? "bg-red-900/50 border-red-500 text-red-400" : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                    )}
                >
                    M
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onSolo(); }} 
                    className={clsx(
                        "flex-1 py-1 rounded text-[10px] font-black border transition-colors", 
                        track.isSoloed ? "bg-yellow-600 border-yellow-500 text-white" : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                    )}
                >
                    S
                </button>
            </div>
        </div>
    </div>
);
