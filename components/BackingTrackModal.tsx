
import React, { useState } from 'react';
import { X, Play, Square, Music, Disc, Guitar } from 'lucide-react';
import clsx from 'clsx';
import { playBackingTrack, stopBackingTrack } from '../services/audioService';

interface BackingTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRACKS = [
    { id: 'blues_a', name: 'Slow Blues in A', style: 'BLUES', bpm: 60, url: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/blues_backing.mp3' }, // Mock URL for now, replace with real loop if available or simulate
    { id: 'rock_e', name: 'Hard Rock Shuffle E', style: 'ROCK', bpm: 120, url: '#' },
    { id: 'funk_dm', name: 'Funky Groove Dm', style: 'FUNK', bpm: 100, url: '#' },
    { id: 'jazz_ii_v_i', name: 'Jazz ii-V-I C Major', style: 'JAZZ', bpm: 140, url: '#' },
    { id: 'metal_d', name: 'Metal Chug Drop D', style: 'METAL', bpm: 160, url: '#' },
];

export const BackingTrackModal: React.FC<BackingTrackModalProps> = ({ isOpen, onClose }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePlay = (track: typeof TRACKS[0]) => {
      if (playingId === track.id) {
          stopBackingTrack();
          setPlayingId(null);
      } else {
          // For demo purposes, we will use a single reliable URL or just simulate playing state if no URL
          // In a real app, these would be real MP3 URLs
          playBackingTrack('https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg'); // Using a google sample as placeholder for demo
          setPlayingId(track.id);
      }
  };

  const handleStop = () => {
      stopBackingTrack();
      setPlayingId(null);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-8 shadow-2xl flex flex-col max-h-[85vh]">
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                <Music size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Jam Station</h2>
                <p className="text-xs text-slate-400">Backing Tracks & Loops</p>
            </div>
          </div>
          <button onClick={() => { handleStop(); onClose(); }} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {TRACKS.map(track => (
                <div 
                    key={track.id}
                    className={clsx(
                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                        playingId === track.id ? "bg-yellow-900/20 border-yellow-500/50" : "bg-slate-800 border-slate-700 hover:border-slate-500"
                    )}
                >
                    <div className="flex items-center gap-4">
                        <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center", playingId === track.id ? "bg-yellow-500 text-black animate-pulse" : "bg-slate-700 text-slate-400")}>
                            {playingId === track.id ? <Music size={20} /> : <Disc size={20} />}
                        </div>
                        <div>
                            <h3 className={clsx("font-bold", playingId === track.id ? "text-yellow-400" : "text-white")}>{track.name}</h3>
                            <div className="flex gap-3 text-xs text-slate-500 font-mono mt-1">
                                <span className="bg-slate-900 px-2 py-0.5 rounded">{track.style}</span>
                                <span>{track.bpm} BPM</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => handlePlay(track)}
                        className={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                            playingId === track.id ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-600 text-white hover:bg-green-500"
                        )}
                    >
                        {playingId === track.id ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                </div>
            ))}
        </div>

        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-center">
            <p className="text-xs text-slate-400 mb-2">Vous voulez jouer sur YouTube ?</p>
            <p className="text-[10px] text-slate-500">Ouvrez YouTube dans un autre onglet, VibeChord continuera de fonctionner en arrière-plan pour le traitement de votre guitare.</p>
        </div>

      </div>
    </div>
  );
};
