
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Loader2, RefreshCw } from 'lucide-react';
import { ChordTemplate } from '../services/chordDictionary';

interface SuggestionStripProps {
  suggestions: ChordTemplate[];
  isLoading: boolean;
  onAdd: (template: ChordTemplate) => void;
  onRefresh: () => void;
  isVisible: boolean;
}

export const SuggestionStrip: React.FC<SuggestionStripProps> = ({ 
  suggestions, 
  isLoading, 
  onAdd,
  onRefresh,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <div className="w-full max-w-[95rem] mx-auto px-6 mb-8">
      <div className="flex items-center gap-4 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-3 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 px-4 border-r border-slate-700/50">
          <Sparkles size={18} className="text-purple-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap hidden sm:inline">
            SUITE SUGGÉRÉE
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap sm:hidden">
            AI
          </span>
        </div>

        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-3">
          <AnimatePresence mode='popLayout'>
            {isLoading ? (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase"
                >
                <Loader2 size={14} className="animate-spin text-purple-500" />
                <span>Analyse harmonique...</span>
                </motion.div>
            ) : suggestions.length > 0 ? (
                suggestions.map((s, i) => (
                <motion.button
                    key={`${s.name}-${i}`}
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: i * 0.05, type: "spring" }}
                    onClick={() => onAdd(s)}
                    className="group flex-shrink-0 flex items-center gap-3 bg-slate-800/80 hover:bg-purple-600 border border-slate-700 hover:border-purple-400 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                >
                    <span className="text-sm font-black text-slate-200 group-hover:text-white uppercase font-mono">
                    {s.name}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-slate-700 group-hover:bg-purple-500 flex items-center justify-center transition-colors">
                    <Plus size={12} className="text-slate-400 group-hover:text-white" />
                    </div>
                </motion.button>
                ))
            ) : (
                <span className="text-slate-600 text-[10px] font-bold uppercase italic">
                Aucune suggestion pour le moment...
                </span>
            )}
          </AnimatePresence>
        </div>
        
        <div className="pl-3 border-l border-slate-700/50">
             <button 
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
                title="Générer d'autres suggestions"
             >
                 <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
             </button>
        </div>
      </div>
    </div>
  );
};
