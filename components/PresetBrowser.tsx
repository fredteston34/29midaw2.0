
import React, { useState, useEffect } from 'react';
import { X, Search, Save, Download, Trash2, FolderOpen, Zap, Music, Cloud, Wand2, Loader2, Play, Users, Star } from 'lucide-react';
import clsx from 'clsx';
import { AmpPreset, GuitarEffects, PresetCategory } from '../types';
import { generateToneFromDescription } from '../services/geminiService';

interface PresetBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  currentEffects: GuitarEffects;
  onLoad: (effects: GuitarEffects) => void;
}

// Données d'usine simulées
const FACTORY_PRESETS: AmpPreset[] = [
    {
        id: 'fac_1', name: 'California Clean', category: 'CLEAN', author: 'VibeChord', date: Date.now(),
        effects: {
            noiseGateThreshold: -60, guitarMatch: { enabled: false, source: 'SINGLE_COIL', target: 'SINGLE_COIL' },
            routingMode: 'SINGLE', pathAMix: 1, pathBMix: 0,
            pathA: { enabled: true, drive: 0, amp: { model: 'CLEAN_TWIN', gain: 0.3, bass: 1, mid: -1, treble: 2, presence: 3, volume: 0.8, cabModel: '2x12' } },
            pathB: { enabled: false, drive: 0, amp: { model: 'CLEAN_TWIN', gain: 0.5, bass: 0, mid: 0, treble: 0, presence: 0, volume: 0.8, cabModel: '2x12' } },
            postFx: { chorus: { enabled: true, depth: 0.4, rate: 0.5, mix: 0.3 }, delay: { enabled: true, time: '8n.', feedback: 0.3, mix: 0.2 }, reverb: { enabled: true, decay: 2.5, mix: 0.3 }, eq: { enabled: false, low: 0, mid: 0, high: 0 } },
            masterGain: 0
        }
    },
    {
        id: 'fac_2', name: 'British Crunch', category: 'CRUNCH', author: 'VibeChord', date: Date.now(),
        effects: {
            noiseGateThreshold: -50, guitarMatch: { enabled: true, source: 'SINGLE_COIL', target: 'HUMBUCKER' },
            routingMode: 'SINGLE', pathAMix: 1, pathBMix: 0,
            pathA: { enabled: true, drive: 0.4, amp: { model: 'CRUNCH_PLEXI', gain: 0.7, bass: 2, mid: 6, treble: 4, presence: 2, volume: 0.9, cabModel: '4x12' } },
            pathB: { enabled: false, drive: 0, amp: { model: 'CLEAN_TWIN', gain: 0.5, bass: 0, mid: 0, treble: 0, presence: 0, volume: 0.8, cabModel: '2x12' } },
            postFx: { chorus: { enabled: false, depth: 0, rate: 0, mix: 0 }, delay: { enabled: false, time: '8n', feedback: 0, mix: 0 }, reverb: { enabled: true, decay: 1.5, mix: 0.15 }, eq: { enabled: false, low: 0, mid: 0, high: 0 } },
            masterGain: -1
        }
    },
    {
        id: 'fac_3', name: 'Modern Djent', category: 'HIGH_GAIN', author: 'VibeChord', date: Date.now(),
        effects: {
            noiseGateThreshold: -30, guitarMatch: { enabled: true, source: 'SINGLE_COIL', target: 'HUMBUCKER' },
            routingMode: 'SINGLE', pathAMix: 1, pathBMix: 0,
            pathA: { enabled: true, drive: 0.8, amp: { model: 'HIGH_RECTO', gain: 0.9, bass: 4, mid: -2, treble: 6, presence: 5, volume: 0.8, cabModel: '4x12' } },
            pathB: { enabled: false, drive: 0, amp: { model: 'CLEAN_TWIN', gain: 0.5, bass: 0, mid: 0, treble: 0, presence: 0, volume: 0.8, cabModel: '2x12' } },
            postFx: { chorus: { enabled: false, depth: 0, rate: 0, mix: 0 }, delay: { enabled: false, time: '8n', feedback: 0, mix: 0 }, reverb: { enabled: false, decay: 1.5, mix: 0 }, eq: { enabled: true, low: 2, mid: -4, high: 3 } },
            masterGain: -2
        }
    },
    {
        id: 'fac_4', name: 'Stereo Dream', category: 'AMBIENT', author: 'VibeChord', date: Date.now(),
        effects: {
            noiseGateThreshold: -60, guitarMatch: { enabled: false, source: 'SINGLE_COIL', target: 'SINGLE_COIL' },
            routingMode: 'DUAL_PARALLEL', pathAMix: 0.8, pathBMix: 0.8,
            pathA: { enabled: true, drive: 0, amp: { model: 'CLEAN_TWIN', gain: 0.4, bass: 2, mid: 0, treble: 4, presence: 5, volume: 0.8, cabModel: '2x12' } },
            pathB: { enabled: true, drive: 0.2, amp: { model: 'CRUNCH_AC30', gain: 0.6, bass: -2, mid: 4, treble: 8, presence: 6, volume: 0.8, cabModel: '2x12' } },
            postFx: { chorus: { enabled: true, depth: 0.8, rate: 0.2, mix: 0.5 }, delay: { enabled: true, time: '4n.', feedback: 0.6, mix: 0.4 }, reverb: { enabled: true, decay: 6, mix: 0.5 }, eq: { enabled: false, low: 0, mid: 0, high: 0 } },
            masterGain: -2
        }
    }
];

// Données Communautaires Simulées
const COMMUNITY_PRESETS: AmpPreset[] = [
    { ...FACTORY_PRESETS[2], id: 'comm_1', name: 'Metallica 1991', author: 'HetfieldFan', category: 'HIGH_GAIN' },
    { ...FACTORY_PRESETS[0], id: 'comm_2', name: 'John Mayer Clean', author: 'SlowHand', category: 'CLEAN' },
    { ...FACTORY_PRESETS[1], id: 'comm_3', name: 'SRV Texas Flood', author: 'BluesKing', category: 'CRUNCH' },
    { ...FACTORY_PRESETS[3], id: 'comm_4', name: 'Pink Floyd Pulse', author: 'Gilmourish', category: 'AMBIENT' },
];

export const PresetBrowser: React.FC<PresetBrowserProps> = ({ isOpen, onClose, currentEffects, onLoad }) => {
    const [activeTab, setActiveTab] = useState<'FACTORY' | 'USER' | 'COMMUNITY' | 'WIZARD'>('FACTORY');
    const [userPresets, setUserPresets] = useState<AmpPreset[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Wizard State
    const [wizardPrompt, setWizardPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPreset, setGeneratedPreset] = useState<AmpPreset | null>(null);
    
    // Save Form State
    const [newPresetName, setNewPresetName] = useState('');
    const [newPresetCategory, setNewPresetCategory] = useState<PresetCategory>('CLEAN');

    useEffect(() => {
        const stored = localStorage.getItem('vibechord_presets');
        if (stored) {
            try {
                setUserPresets(JSON.parse(stored));
            } catch (e) {
                console.error("Error loading presets", e);
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!newPresetName.trim()) return;

        // Use the generated preset effects if available, otherwise current effects
        const effectsToSave = (activeTab === 'WIZARD' && generatedPreset) ? generatedPreset.effects : currentEffects;

        const newPreset: AmpPreset = {
            id: crypto.randomUUID(),
            name: newPresetName,
            category: newPresetCategory,
            author: 'User',
            date: Date.now(),
            effects: effectsToSave
        };

        const updated = [...userPresets, newPreset];
        setUserPresets(updated);
        localStorage.setItem('vibechord_presets', JSON.stringify(updated));
        
        setIsSaving(false);
        setNewPresetName('');
        // If we were in wizard, clear it and go to User
        if (activeTab === 'WIZARD') {
            setGeneratedPreset(null);
            setWizardPrompt('');
        }
        setActiveTab('USER');
    };

    const handleDelete = (id: string) => {
        const updated = userPresets.filter(p => p.id !== id);
        setUserPresets(updated);
        localStorage.setItem('vibechord_presets', JSON.stringify(updated));
    };

    const handleWizardGenerate = async () => {
        if (!wizardPrompt.trim()) return;
        setIsGenerating(true);
        setGeneratedPreset(null);
        try {
            const result = await generateToneFromDescription(wizardPrompt);
            
            // Map AI result to GuitarEffects structure
            const newEffects: GuitarEffects = {
                noiseGateThreshold: -60,
                guitarMatch: { enabled: false, source: 'SINGLE_COIL', target: 'HUMBUCKER' }, // Default safe
                routingMode: 'SINGLE',
                pathAMix: 1,
                pathBMix: 0,
                pathA: {
                    enabled: true,
                    drive: result.pedals.drive.enabled ? result.pedals.drive.level : 0,
                    amp: {
                        model: result.ampModel,
                        gain: result.settings.gain,
                        bass: result.settings.bass,
                        mid: result.settings.mid,
                        treble: result.settings.treble,
                        presence: result.settings.presence,
                        volume: result.settings.volume,
                        cabModel: '4x12'
                    }
                },
                pathB: { enabled: false, drive: 0, amp: { model: 'CLEAN_TWIN', gain: 0.5, bass: 0, mid: 0, treble: 0, presence: 0, volume: 1, cabModel: '1x12' } },
                postFx: {
                    chorus: result.pedals.chorus,
                    delay: result.pedals.delay,
                    reverb: result.pedals.reverb,
                    eq: { enabled: false, low: 0, mid: 0, high: 0 }
                },
                masterGain: 0
            };

            setGeneratedPreset({
                id: 'temp_wiz',
                name: `AI: ${wizardPrompt}`,
                category: 'CRUNCH', // Default, user can change on save
                author: 'Gemini',
                date: Date.now(),
                effects: newEffects
            });

        } catch (error) {
            console.error(error);
            alert("Impossible de générer le son. Essayez un autre artiste.");
        } finally {
            setIsGenerating(false);
        }
    };

    const getPresetsForTab = () => {
        switch(activeTab) {
            case 'FACTORY': return FACTORY_PRESETS;
            case 'USER': return userPresets;
            case 'COMMUNITY': return COMMUNITY_PRESETS;
            default: return [];
        }
    };

    const displayedPresets = getPresetsForTab()
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!isOpen) return null;

    const CategoryBadge = ({ cat }: { cat: PresetCategory }) => {
        const colors = {
            CLEAN: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            CRUNCH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            HIGH_GAIN: 'bg-red-500/20 text-red-400 border-red-500/30',
            AMBIENT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            BASS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        };
        return (
            <span className={clsx("text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider", colors[cat] || colors.CLEAN)}>
                {cat.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="absolute inset-0 z-[100] bg-[#1a1a20] flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#121216]">
                <div className="flex items-center gap-3">
                    <FolderOpen className="text-yellow-500" size={20} />
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Preset Browser</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4 bg-zinc-900/50">
                <div className="flex bg-black/40 p-1 rounded-lg border border-zinc-800 w-fit overflow-x-auto">
                    <button 
                        onClick={() => { setActiveTab('FACTORY'); setIsSaving(false); }}
                        className={clsx("px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'FACTORY' && !isSaving ? "bg-zinc-700 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}
                    >
                        <Zap size={14} /> Factory
                    </button>
                    <button 
                        onClick={() => { setActiveTab('COMMUNITY'); setIsSaving(false); }}
                        className={clsx("px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'COMMUNITY' && !isSaving ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}
                    >
                        <Users size={14} /> Community
                    </button>
                    <button 
                        onClick={() => { setActiveTab('USER'); setIsSaving(false); }}
                        className={clsx("px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'USER' && !isSaving ? "bg-zinc-700 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}
                    >
                        <FolderOpen size={14} /> My Tones
                    </button>
                    <button 
                        onClick={() => { setActiveTab('WIZARD'); setIsSaving(false); }}
                        className={clsx("px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'WIZARD' ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}
                    >
                        <Wand2 size={14} /> AI Tone Wizard
                    </button>
                </div>

                {activeTab !== 'WIZARD' && (
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Rechercher un preset..."
                            className="w-full bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all"
                        />
                    </div>
                )}

                {activeTab !== 'WIZARD' && (
                    <button 
                        onClick={() => setIsSaving(!isSaving)}
                        className={clsx("px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border", isSaving ? "bg-yellow-600 border-yellow-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white")}
                    >
                        <Save size={16} /> {isSaving ? 'Cancel' : 'Save Current'}
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#151518]">
                
                {isSaving ? (
                    <div className="max-w-md mx-auto mt-10 bg-zinc-900 border border-zinc-700 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Save size={24} className="text-yellow-500"/> Save Preset</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Nom du Preset</label>
                                <input 
                                    autoFocus
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                    placeholder="Ex: My Dream Lead"
                                    className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-500 transition-all font-bold"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Catégorie</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['CLEAN', 'CRUNCH', 'HIGH_GAIN', 'AMBIENT', 'BASS'].map(cat => (
                                        <button 
                                            key={cat}
                                            onClick={() => setNewPresetCategory(cat as any)}
                                            className={clsx(
                                                "p-2 rounded-lg text-xs font-bold border transition-all text-left",
                                                newPresetCategory === cat 
                                                    ? "bg-yellow-600/20 border-yellow-500 text-yellow-400" 
                                                    : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700"
                                            )}
                                        >
                                            {cat.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={!newPresetName.trim()}
                                className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white rounded-xl font-bold mt-4 shadow-lg transition-all"
                            >
                                Confirm Save
                            </button>
                        </div>
                    </div>
                ) : activeTab === 'WIZARD' ? (
                    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-8 animate-in fade-in zoom-in-95">
                        <div className="space-y-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-900/50">
                                <Wand2 size={40} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Le Sorcier du Son</h2>
                            <p className="text-zinc-400 max-w-md mx-auto">
                                Entrez le nom d'un artiste ou d'une chanson célèbre. L'IA analysera le style et configurera votre ampli instantanément.
                            </p>
                        </div>

                        <div className="w-full relative">
                            <input 
                                value={wizardPrompt}
                                onChange={(e) => setWizardPrompt(e.target.value)}
                                placeholder="Ex: Pink Floyd - Comfortably Numb, Metallica - Enter Sandman..."
                                className="w-full bg-black/50 border border-zinc-700 focus:border-purple-500 rounded-2xl p-6 text-xl text-white text-center focus:outline-none transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleWizardGenerate()}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Search className="text-zinc-600" />
                            </div>
                        </div>

                        <button 
                            onClick={handleWizardGenerate}
                            disabled={isGenerating || !wizardPrompt.trim()}
                            className="px-10 py-4 bg-white text-black hover:bg-zinc-200 rounded-full font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <Zap fill="currentColor" />}
                            {isGenerating ? "Analyse en cours..." : "GÉNÉRER LE RIG"}
                        </button>

                        {generatedPreset && (
                            <div className="w-full bg-zinc-900/80 border border-purple-500/50 p-6 rounded-2xl mt-8 text-left animate-in slide-in-from-bottom flex items-center justify-between">
                                <div>
                                    <div className="text-purple-400 font-bold text-xs uppercase mb-1">Résultat IA</div>
                                    <h3 className="text-xl font-bold text-white">{generatedPreset.name.replace('AI: ', '')}</h3>
                                    <p className="text-xs text-zinc-500 mt-1">Config: {generatedPreset.effects.pathA.amp.model} + Pedals</p>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => { onLoad(generatedPreset.effects); onClose(); }}
                                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm shadow-lg"
                                    >
                                        LOAD
                                    </button>
                                    <button 
                                        onClick={() => { setIsSaving(true); setNewPresetName(wizardPrompt); }}
                                        className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-bold text-sm"
                                    >
                                        SAVE
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {displayedPresets.length === 0 ? (
                            <div className="text-center py-20 text-zinc-600 font-medium">Aucun preset trouvé.</div>
                        ) : (
                            displayedPresets.map(preset => (
                                <div 
                                    key={preset.id}
                                    className="group bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 p-4 rounded-xl flex items-center justify-between transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        {activeTab === 'COMMUNITY' ? (
                                            <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold border border-blue-800">
                                                {preset.author.substring(0,2).toUpperCase()}
                                            </div>
                                        ) : (
                                            <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center shadow-inner", 
                                                preset.category === 'CLEAN' ? "bg-cyan-900/30 text-cyan-400" :
                                                preset.category === 'HIGH_GAIN' ? "bg-red-900/30 text-red-400" :
                                                "bg-orange-900/30 text-orange-400"
                                            )}>
                                                <Music size={20} />
                                            </div>
                                        )}
                                        
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-white font-bold text-sm">{preset.name}</h4>
                                                <CategoryBadge cat={preset.category} />
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                                                <span>by {preset.author}</span>
                                                {activeTab === 'COMMUNITY' && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1 text-yellow-500"><Star size={10} fill="currentColor"/> 4.8</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1"><Download size={10}/> 1.2k</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {activeTab === 'USER' && (
                                            <button 
                                                onClick={() => handleDelete(preset.id)}
                                                className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => { onLoad(preset.effects); onClose(); }}
                                            className="flex items-center gap-2 px-4 py-2 bg-zinc-200 hover:bg-white text-black rounded-lg text-xs font-black uppercase tracking-wide transition-all shadow-lg hover:shadow-xl"
                                        >
                                            <Download size={14} /> Load
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
