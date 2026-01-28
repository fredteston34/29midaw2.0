
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Music2, Sliders, Play, ArrowRight, Keyboard, BookOpen, HelpCircle, LayoutGrid, Mic, Zap, MousePointer, WifiOff, Download, Smartphone, Monitor, GraduationCap, Compass, PenTool, Camera, Disc, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAI: () => void;
  onLoadDemo: () => void;
  onStartTutorial: () => void;
}

type Tab = 'START' | 'GUIDE' | 'SHORTCUTS' | 'TROUBLESHOOT';

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, onOpenAI, onLoadDemo, onStartTutorial }) => {
  const [activeTab, setActiveTab] = useState<Tab>('START');
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape' && isOpen) onClose();
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('vibechord_welcome_seen', 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  const TabButton = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
      <button
        onClick={() => setActiveTab(id)}
        className={clsx(
            "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-bold text-sm",
            activeTab === id 
                ? "bg-primary text-white shadow-lg shadow-green-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
        )}
      >
          <Icon size={18} />
          <span>{label}</span>
      </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0f172a] border border-slate-700 rounded-3xl w-full max-w-5xl h-[85vh] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-2">
            <div className="mb-8 pl-2">
                <h1 className="text-2xl font-black text-white tracking-tighter italic">
                    VIBE<span className="text-primary">CHORD</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Studio Pro v4.0</p>
            </div>

            <TabButton id="START" icon={Sparkles} label="Bienvenue" />
            <TabButton id="GUIDE" icon={BookOpen} label="Guide des Outils" />
            <TabButton id="SHORTCUTS" icon={Keyboard} label="Raccourcis" />
            <TabButton id="TROUBLESHOOT" icon={HelpCircle} label="Dépannage" />

            <div className="mt-auto">
                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none p-2 hover:bg-slate-800 rounded-lg transition-colors">
                    <input 
                        type="checkbox" 
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-green-500 focus:ring-0" 
                    />
                    Ne plus afficher au démarrage
                </label>
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 bg-[#1e293b] relative flex flex-col">
            <button onClick={handleClose} className="absolute top-6 right-6 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors z-50">
                <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                <AnimatePresence mode='wait'>
                    
                    {activeTab === 'START' && (
                        <motion.div 
                            key="start"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-white leading-tight">Le Futur de l'Apprentissage Guitare.</h2>
                                <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                                    VibeChord 4.0 intègre désormais des **banques de sons échantillonnées**, un **coach vision par IA** et une galerie de **vibes prédéfinies** pour booster votre créativité.
                                </p>
                            </div>

                            <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 flex items-center justify-between gap-6 mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Sparkles size={20} className="text-indigo-400"/> Nouveau : AI Vision Coach</h3>
                                    <p className="text-sm text-slate-400">Photographiez votre main, Gemini analyse votre posture et vous conseille en temps réel.</p>
                                </div>
                                <button 
                                    onClick={() => { handleClose(); onStartTutorial(); }}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 whitespace-nowrap"
                                >
                                    Lancer le Tutoriel
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => { onLoadDemo(); handleClose(); }}
                                    className="p-6 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-slate-750 hover:border-primary/50 transition-all group text-left"
                                >
                                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 mb-4 group-hover:scale-110 transition-transform">
                                        <Play size={24} fill="currentColor" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">Session Rapide</h3>
                                    <p className="text-sm text-slate-400">Chargez une progression démo pour tester les nouveaux sons.</p>
                                </button>

                                <button 
                                    onClick={() => { handleClose(); onOpenAI(); }}
                                    className="p-6 bg-gradient-to-br from-purple-900 to-slate-900 border border-purple-500/30 rounded-2xl hover:border-purple-400 transition-all group text-left"
                                >
                                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                                        <Sparkles size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">Générateur de Vibes</h3>
                                    <p className="text-sm text-slate-400">Utilisez nos modèles (Lofi, Grunge, Blues) pour créer instantanément.</p>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'GUIDE' && (
                        <motion.div 
                            key="guide"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                             <div>
                                <h2 className="text-3xl font-bold text-white mb-6">Nouveautés de la Version 4.0</h2>
                                <div className="grid gap-4">
                                    <FeatureRow 
                                        icon={Camera} color="text-purple-400" bg="bg-purple-500/10"
                                        title="AI Vision Coach"
                                        desc="Sur chaque carte d'accord, cliquez sur l'icône caméra. Photographiez votre main sur le manche et l'IA vérifiera votre position."
                                    />
                                    <FeatureRow 
                                        icon={Disc} color="text-cyan-400" bg="bg-cyan-500/10"
                                        title="Sound Banks (Échantillons)"
                                        desc="Accédez au Mixer pour changer d'instrument : Guitare Acoustique, Nylon, Jazz, Piano, Synthé Pad. Ce sont de vrais sons enregistrés."
                                    />
                                    <FeatureRow 
                                        icon={Activity} color="text-emerald-400" bg="bg-emerald-500/10"
                                        title="Retour Haptique (Vibes)"
                                        desc="Le téléphone vibre au rythme de l'accord lors de la lecture. Idéal pour sentir le tempo physiquement sans regarder l'écran."
                                    />
                                    <FeatureRow 
                                        icon={Zap} color="text-orange-400" bg="bg-orange-500/10"
                                        title="Ambiance Texturale"
                                        desc="Ajoutez une couche sonore immersive dans le Mixer : Pluie, craquement de Vinyle ou Vent pour donner de l'âme à votre son."
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'SHORTCUTS' && (
                        <motion.div 
                            key="shortcuts"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        >
                            <h2 className="text-3xl font-bold text-white mb-8">Raccourcis Clavier</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ShortcutKey keys={['Espace']} desc="Lecture / Pause" />
                                <ShortcutKey keys={['Ctrl', 'M']} desc="Ouvrir le Mixer / Sons" />
                                <ShortcutKey keys={['Ctrl', 'G']} desc="Générer avec l'IA" />
                                <ShortcutKey keys={['Ctrl', 'P']} desc="Pédalier FX" />
                                <ShortcutKey keys={['Suppr']} desc="Supprimer l'accord" />
                                <ShortcutKey keys={['Esc']} desc="Fermer les fenêtres" />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'TROUBLESHOOT' && (
                        <motion.div 
                            key="troubleshoot"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        >
                            <h2 className="text-3xl font-bold text-white mb-6">Dépannage</h2>
                            
                            <div className="space-y-6">
                                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500" /> Problème de Caméra ?
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Pour le Vision Coach, assurez-vous d'avoir autorisé l'accès à la caméra dans votre navigateur. Si l'image est noire, vérifiez qu'aucune autre application n'utilise la caméra.
                                    </p>
                                </div>

                                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500" /> Chargement des sons ?
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Le téléchargement d'une nouvelle banque (ex: Piano) peut prendre quelques secondes selon votre connexion. Une icône de chargement s'affiche dans le Mixer pendant l'opération.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>

      </div>
    </div>
  );
};

const FeatureRow = ({ icon: Icon, color, bg, title, desc }: any) => (
    <div className="flex gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className={`p-3 rounded-xl ${bg} ${color} h-fit`}>
            <Icon size={24} />
        </div>
        <div>
            <h3 className={`font-bold text-lg ${color}`}>{title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm mt-1">{desc}</p>
        </div>
    </div>
);

const ShortcutKey = ({ keys, desc }: { keys: string[], desc: string }) => (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <span className="text-slate-300 font-medium">{desc}</span>
        <div className="flex gap-2">
            {keys.map((k, i) => (
                <span key={i} className="px-3 py-1.5 bg-slate-900 border-b-2 border-slate-600 rounded-lg text-xs font-black text-slate-400 uppercase font-mono">
                    {k}
                </span>
            ))}
        </div>
    </div>
);
