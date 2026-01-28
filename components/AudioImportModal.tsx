
import React, { useState } from 'react';
import { X, Upload, Music, Trash2, Mic, BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { loadVocalTrack, removeVocalTrack } from '../services/audioService';
import { transcribeChordsFromAudio } from '../services/geminiService';
import { ChordData } from '../types';

interface AudioImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackLoaded: (fileName: string) => void;
  onChordsTranscribed: (chords: ChordData[]) => void;
  currentTrackName: string | null;
}

export const AudioImportModal: React.FC<AudioImportModalProps> = ({ 
  isOpen, 
  onClose,
  onTrackLoaded,
  onChordsTranscribed,
  currentTrackName
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLastFile(file);
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
        alert('Veuillez uploader un fichier audio (MP3, WAV, etc.)');
        return;
    }
    
    setIsLoading(true);
    try {
        await loadVocalTrack(file);
        onTrackLoaded(file.name);
    } catch (err) {
        console.error(err);
        alert('Erreur lors du chargement de l\'audio');
    } finally {
        setIsLoading(false);
    }
  };

  const handleTranscribe = async () => {
      if (!lastFile) return;
      setIsTranscribing(true);
      try {
          const reader = new FileReader();
          reader.readAsDataURL(lastFile);
          reader.onload = async () => {
              const base64 = (reader.result as string).split(',')[1];
              const chords = await transcribeChordsFromAudio(base64, lastFile.type);
              onChordsTranscribed(chords);
              onClose();
          };
      } catch (err) {
          console.error(err);
          alert('Échec de la transcription');
      } finally {
          setIsTranscribing(false);
      }
  };

  const handleDelete = () => {
    removeVocalTrack();
    onTrackLoaded('');
    setLastFile(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-pink-400">
            <Mic size={24} />
            <h2 className="text-xl font-bold text-white">Import Audio & Transcription</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {currentTrackName ? (
            <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-600">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-pink-500/20 rounded-full text-pink-400">
                            <Music size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-400 uppercase font-bold">Piste Active</p>
                            <p className="text-white truncate font-medium">{currentTrackName}</p>
                        </div>
                        <button 
                            onClick={handleDelete}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-indigo-300 mb-2">
                        <Sparkles size={16} />
                        <h4 className="text-sm font-bold uppercase tracking-wider">Analyse par l'IA</h4>
                    </div>
                    <p className="text-xs text-indigo-400/80 mb-4 leading-relaxed">
                        Laissez l'IA de Gemini écouter votre morceau et extraire automatiquement la grille d'accords pour vous.
                    </p>
                    <button 
                        onClick={handleTranscribe}
                        disabled={isTranscribing}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50"
                    >
                        {isTranscribing ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                L'IA écoute...
                            </>
                        ) : (
                            <>
                                <BrainCircuit size={18} />
                                Transcrire les Accords
                            </>
                        )}
                    </button>
                </div>
            </div>
        ) : (
            <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors ${isDragging ? 'border-pink-500 bg-pink-500/10' : 'border-slate-600 hover:border-pink-500/50 hover:bg-slate-800'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) {
                        setLastFile(file);
                        processFile(file);
                    }
                }}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                         <Loader2 size={40} className="animate-spin text-pink-400" />
                         <div className="animate-pulse text-pink-400 font-bold">Chargement audio...</div>
                    </div>
                ) : (
                    <>
                        <Upload size={48} className="text-slate-500 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Déposez votre MP3 ici</h3>
                        <p className="text-slate-400 text-sm mb-4">Supporte MP3, WAV, OGG</p>
                        <label className="bg-pink-600 hover:bg-pink-500 text-white px-6 py-2 rounded-lg font-bold cursor-pointer transition-colors shadow-lg shadow-pink-900/20">
                            Parcourir
                            <input type="file" className="hidden" accept="audio/*" onChange={handleFileSelect} />
                        </label>
                    </>
                )}
            </div>
        )}
        
      </div>
    </div>
  );
};
