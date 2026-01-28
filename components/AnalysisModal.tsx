import React, { useEffect, useState } from 'react';
import { X, Sparkles, Loader2, ArrowRight, Check } from 'lucide-react';
import { ChordData, AnalysisResult } from '../types';
import { analyzeChordProgression } from '../services/geminiService';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChords: ChordData[];
  onApplyVariation: (chords: ChordData[]) => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ 
  isOpen, 
  onClose, 
  currentChords,
  onApplyVariation
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Trigger analysis when modal opens
  useEffect(() => {
    if (isOpen && currentChords.length > 0) {
      setLoading(true);
      setError(null);
      setResult(null);

      analyzeChordProgression(currentChords)
        .then(data => {
          setResult(data);
        })
        .catch(err => {
          setError("Could not analyze progression. Please try again.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, currentChords]);

  if (!isOpen) return null;

  const handleApply = (chords: ChordData[]) => {
    onApplyVariation(chords);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-indigo-400">
            <Sparkles size={24} />
            <h2 className="text-xl font-bold text-white">Harmonic Analysis</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4">
              <Loader2 size={48} className="animate-spin text-indigo-500" />
              <p className="animate-pulse">Listening to your vibes...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl">
              {error}
            </div>
          )}

          {result && !loading && (
            <>
              {/* Analysis Text */}
              <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Insight</h3>
                <p className="text-slate-200 leading-relaxed text-lg">
                  {result.analysis}
                </p>
              </div>

              {/* Variations */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Suggested Variations</h3>
                <div className="grid gap-4">
                  {result.variations.map((variation, idx) => (
                    <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-indigo-500/50 transition-colors group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{variation.name}</h4>
                          <p className="text-slate-400 text-sm mt-1">{variation.description}</p>
                        </div>
                        <button 
                          onClick={() => handleApply(variation.chords)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-900/20 transition-all transform active:scale-95 whitespace-nowrap"
                        >
                          <Check size={16} />
                          Apply
                        </button>
                      </div>
                      
                      {/* Mini Progression Preview */}
                      <div className="flex flex-wrap items-center gap-2 mt-4 p-3 bg-black/20 rounded-lg">
                        {variation.chords.map((c, cIdx) => (
                          <React.Fragment key={c.id}>
                            {cIdx > 0 && <ArrowRight size={14} className="text-slate-600" />}
                            <span className="font-mono text-sm font-bold text-indigo-200 bg-indigo-900/30 px-2 py-1 rounded">
                              {c.name}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};