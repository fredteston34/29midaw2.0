
import React, { useState } from 'react';
import { X, Sparkles, Loader2, Music4, Wand2, Info } from 'lucide-react';
import { generateChordProgression } from '../services/geminiService';
import { ChordData, GuitarEffects } from '../types';
import { InspirationGallery } from './InspirationGallery';
import clsx from 'clsx';

interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (chords: ChordData[], effects?: GuitarEffects) => void;
}

export const GeminiModal: React.FC<GeminiModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (targetPrompt?: string) => {
    const finalPrompt = targetPrompt || prompt;
    if (!finalPrompt.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const { chords, effects } = await generateChordProgression(finalPrompt);
      onSuccess(chords, effects);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(`Echec: ${err.message || "Erreur inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl p-8 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                <Sparkles size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Le Laboratoire des Vibes</h2>
                <p className="text-sm text-slate-400 font-medium italic">Ne partez plus jamais d'une feuille blanche.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
          
          <div className="mb-8">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Music4 size={14} /> Galerie d'Inspiration Rapide
            </h3>
            <InspirationGallery onSelect={handleGenerate} />
          </div>

          <div className="relative mb-6">
            <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
              Ou décrivez votre propre univers
            </label>
            <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-32 bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 resize-none transition-all font-medium text-lg"
                  placeholder="Ex: Une ballade psychédélique avec des accords ouverts et beaucoup de reverb spatiale..."
                />
                <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Info size={10} /> Saisissez un style, une émotion ou un artiste.
                </div>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 p-4 rounded-xl border border-red-400/20 mb-6 flex items-center gap-3">
              <span className="font-black text-lg">!</span> {error}
            </div>
          )}

          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !prompt.trim()}
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-indigo-900/30 active:scale-95"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <><Wand2 size={24} /> GÉNÉRER LA VIBE</>}
          </button>
        </div>
      </div>
    </div>
  );
};
