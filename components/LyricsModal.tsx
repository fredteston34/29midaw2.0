
import React, { useState, useRef } from 'react';
import { X, Sparkles, PenTool, Type, AlignLeft, BookOpen, Plus, LayoutList, Search, Loader2 } from 'lucide-react';
import { ChordData } from '../types';
import { generateLyrics, findRhymes } from '../services/geminiService';
import clsx from 'clsx';

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lyrics: string;
  setLyrics: (text: string) => void;
  chords: ChordData[];
}

type Tab = 'WRITE' | 'RHYMES' | 'STRUCTURE';

export const LyricsModal: React.FC<LyricsModalProps> = ({ 
  isOpen, 
  onClose, 
  lyrics, 
  setLyrics,
  chords 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('STRUCTURE');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  
  // Rhyme State
  const [rhymeWord, setRhymeWord] = useState('');
  const [rhymes, setRhymes] = useState<string[]>([]);
  const [isRhyming, setIsRhyming] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
      setIsGenerating(true);
      try {
          const generated = await generateLyrics(chords, topic);
          setLyrics(lyrics ? lyrics + "\n\n" + generated : generated);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleFindRhymes = async () => {
      if (!rhymeWord.trim()) return;
      setIsRhyming(true);
      try {
          const results = await findRhymes(rhymeWord);
          setRhymes(results);
      } catch (e) {
          console.error(e);
      } finally {
          setIsRhyming(false);
      }
  };

  const insertText = (text: string) => {
      if (!textAreaRef.current) {
          setLyrics(lyrics + text);
          return;
      }
      
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const newText = lyrics.substring(0, start) + text + lyrics.substring(end);
      
      setLyrics(newText);
      
      // Restore focus
      setTimeout(() => {
          if (textAreaRef.current) {
              textAreaRef.current.focus();
              textAreaRef.current.setSelectionRange(start + text.length, start + text.length);
          }
      }, 0);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar Controls */}
        <div className="w-full md:w-80 bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col">
            
            {/* Header Mobile */}
            <div className="flex justify-between items-center p-4 md:hidden">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><PenTool size={18}/> Parolier</h2>
                <button onClick={onClose}><X size={24} className="text-slate-400" /></button>
            </div>
            
            {/* Header Desktop */}
            <div className="hidden md:block p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                    <PenTool className="text-pink-400" size={24} />
                    SONGWRITER
                </h2>
                <p className="text-xs text-slate-500 font-medium">L'atelier d'écriture pro.</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-2 gap-1 border-b border-slate-700/50">
                <button onClick={() => setActiveTab('STRUCTURE')} className={clsx("flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1", activeTab === 'STRUCTURE' ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300")}>
                    <LayoutList size={14} /> Structure
                </button>
                <button onClick={() => setActiveTab('RHYMES')} className={clsx("flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1", activeTab === 'RHYMES' ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300")}>
                    <BookOpen size={14} /> Rimes
                </button>
                <button onClick={() => setActiveTab('WRITE')} className={clsx("flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1", activeTab === 'WRITE' ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300")}>
                    <Sparkles size={14} /> IA
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                
                {/* STRUCTURE TAB */}
                {activeTab === 'STRUCTURE' && (
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Blocs Rapides (+)</label>
                            <div className="grid grid-cols-1 gap-2">
                                <button onClick={() => insertText('\n\n[COUPLET 1]\n')} className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-all group">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 group-hover:text-white group-hover:bg-blue-500 transition-colors"><Plus size={16} /></div>
                                    <span className="font-bold text-slate-300 text-sm">Couplet</span>
                                </button>
                                <button onClick={() => insertText('\n\n[REFRAIN]\n')} className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-all group">
                                    <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400 group-hover:text-white group-hover:bg-pink-500 transition-colors"><Plus size={16} /></div>
                                    <span className="font-bold text-slate-300 text-sm">Refrain</span>
                                </button>
                                <button onClick={() => insertText('\n\n[PONT]\n')} className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-all group">
                                    <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400 group-hover:text-white group-hover:bg-orange-500 transition-colors"><Plus size={16} /></div>
                                    <span className="font-bold text-slate-300 text-sm">Pont / Bridge</span>
                                </button>
                                <button onClick={() => insertText('\n\n[OUTRO]\n')} className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-all group">
                                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 group-hover:text-white group-hover:bg-purple-500 transition-colors"><Plus size={16} /></div>
                                    <span className="font-bold text-slate-300 text-sm">Outro</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-1">
                                <Type size={12} /> Taille du texte
                            </label>
                            <input 
                                type="range" min="12" max="32" value={fontSize}
                                onChange={(e) => setFontSize(Number(e.target.value))}
                                className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer" 
                            />
                        </div>
                    </div>
                )}

                {/* RHYMES TAB */}
                {activeTab === 'RHYMES' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <input 
                                value={rhymeWord}
                                onChange={(e) => setRhymeWord(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFindRhymes()}
                                placeholder="Mot à rimer..."
                                className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-pink-500"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        </div>
                        <button 
                            onClick={handleFindRhymes}
                            disabled={isRhyming || !rhymeWord}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold text-xs transition-colors disabled:opacity-50"
                        >
                            {isRhyming ? <Loader2 size={16} className="animate-spin mx-auto"/> : "Trouver des Rimes"}
                        </button>

                        <div className="space-y-2 mt-4">
                            {rhymes.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2">
                                    {rhymes.map((r, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => insertText(r)}
                                            className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-left text-sm text-slate-300 hover:text-white transition-colors flex justify-between group"
                                        >
                                            {r}
                                            <Plus size={14} className="opacity-0 group-hover:opacity-100 text-pink-400" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-600 italic text-xs">
                                    Entrez un mot pour voir les suggestions de Gemini.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* AI GENERATOR TAB */}
                {activeTab === 'WRITE' && (
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-400 uppercase block">Inspiration</label>
                        <textarea 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Sujet (ex: Amour perdu à Paris sous la pluie...)"
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-sm text-white h-32 resize-none focus:border-pink-500 outline-none"
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isGenerating ? "Écriture en cours..." : "Générer les Paroles"}
                        </button>
                        <p className="text-[10px] text-slate-500 text-center">
                            L'IA utilisera la grille d'accords actuelle pour structurer le rythme des paroles.
                        </p>
                    </div>
                )}

            </div>
            
             <button 
                onClick={onClose}
                className="mt-auto hidden md:flex items-center justify-center gap-2 py-4 bg-slate-900 border-t border-slate-800 text-slate-400 hover:text-white transition-colors font-medium text-sm"
             >
                Fermer
             </button>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col bg-[#0f172a] relative">
             <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5">
                 <AlignLeft size={200} />
             </div>
             
             <textarea 
                ref={textAreaRef}
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                className="w-full h-full bg-transparent text-slate-200 p-8 focus:outline-none resize-none font-mono selection:bg-pink-500/30 custom-scrollbar z-10"
                placeholder="Commencez à écrire ici..."
             />
             
             <div className="absolute bottom-4 right-6 text-xs text-slate-600 pointer-events-none font-mono font-bold bg-slate-900/80 px-2 py-1 rounded">
                 {lyrics.length} caractères
             </div>
        </div>

      </div>
    </div>
  );
};
