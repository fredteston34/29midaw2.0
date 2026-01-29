
import React, { useEffect, useState, useRef } from 'react';
import { X, Sliders, Speaker, Music, Zap, Guitar, Mic, Settings2, Power, Activity, Disc, Loader2, Waves, MoveHorizontal, Wand2, Headphones, MicOff } from 'lucide-react';
import clsx from 'clsx';
import { InstrumentType } from '../types';
import { setInstrumentVolume, initAudio, loadSoundBank, setAmbientTexture, setInstrumentPan, toggleMasterCompressor } from '../services/audioService';
import * as Tone from 'tone';

const SOUND_BANKS = [
    { id: 'ELECTRIC_CLEAN', label: 'Electric Clean', icon: Guitar },
    { id: 'ELECTRIC_DIST', label: 'Overdriven Rock', icon: Zap },
    { id: 'ACOUSTIC', label: 'Acoustic Steel', icon: Music },
    { id: 'NYLON', label: 'Spanish Nylon', icon: Music },
    { id: 'JAZZ', label: 'Jazz Box', icon: Disc },
    { id: 'SYNTH_PAD', label: 'Atmospheric Pad', icon: Waves },
    { id: 'PIANO', label: 'Grand Piano', icon: Settings2 },
];

const TEXTURES = [
    { id: 'NONE', label: 'Aucune', icon: X },
    { id: 'RAIN', label: 'Pluie Chill', icon: Activity },
    { id: 'VINYL', label: 'Vinyle Lo-fi', icon: Disc },
    { id: 'WIND', label: 'Vent Éthéré', icon: Waves },
];

interface MixerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MixerModal: React.FC<MixerModalProps> = ({ isOpen, onClose }) => {
  const [volumes, setVolumes] = useState<Record<InstrumentType, number>>({
      master: -2, guitar: -3, bass: -4, drums: -2, lead: -4, vocals: 0
  });
  const [pans, setPans] = useState<Record<InstrumentType, number>>({
      master: 0, guitar: 0, bass: 0, drums: 0, lead: 0, vocals: 0
  });
  const [eqs, setEqs] = useState<Record<InstrumentType, { low: number, mid: number, high: number }>>({
      master: { low: 0, mid: 0, high: 0 },
      guitar: { low: 0, mid: 0, high: 0 },
      vocals: { low: 0, mid: 0, high: 0 },
      bass: { low: 0, mid: 0, high: 0 },
      drums: { low: 0, mid: 0, high: 0 },
      lead: { low: 0, mid: 0, high: 0 }
  });
  const [mutes, setMutes] = useState<Record<InstrumentType, boolean>>({
      master: false, guitar: false, vocals: false, bass: false, drums: false, lead: false
  });
  const [solos, setSolos] = useState<Record<InstrumentType, boolean>>({
      master: false, guitar: false, vocals: false, bass: false, drums: false, lead: false
  });

  const [currentBank, setCurrentBank] = useState('ELECTRIC_CLEAN');
  const [currentTexture, setCurrentTexture] = useState('NONE');
  const [isChangingBank, setIsChangingBank] = useState(false);
  const [studioMagic, setStudioMagic] = useState(false);

  // Fake VU Meter Animation
  const [vuLevels, setVuLevels] = useState<Record<InstrumentType, number>>({
      master: 0, guitar: 0, vocals: 0, bass: 0, drums: 0, lead: 0
  });

  useEffect(() => {
      if (isOpen) initAudio();
      
      // Simulate VU Meter movement based on volume state (just visual approximation)
      const interval = setInterval(() => {
          if (!isOpen) return;
          setVuLevels(prev => {
              const newLevels = { ...prev };
              (['guitar', 'vocals', 'master'] as InstrumentType[]).forEach(key => {
                  const vol = volumes[key];
                  const isMuted = mutes[key];
                  if (isMuted || vol < -50) {
                      newLevels[key] = 0;
                  } else {
                      // Random jitter based on volume
                      const base = (vol + 60) / 66; // 0 to 1
                      const jitter = Math.random() * 0.2;
                      newLevels[key] = Math.max(0, Math.min(1, base - jitter));
                  }
              });
              return newLevels;
          });
      }, 100);

      return () => clearInterval(interval);
  }, [isOpen, volumes, mutes]);

  const handleBankChange = async (bankId: string) => {
      setIsChangingBank(true);
      await loadSoundBank(bankId as any);
      setCurrentBank(bankId);
      setIsChangingBank(false);
  };

  const handleTextureChange = async (textureId: string) => {
      await setAmbientTexture(textureId as any);
      setCurrentTexture(textureId);
  };

  const toggleMagic = () => {
      const newState = !studioMagic;
      setStudioMagic(newState);
      toggleMasterCompressor(newState);
  };

  const updateEq = (type: InstrumentType, band: 'low' | 'mid' | 'high', val: number) => {
      setEqs(prev => ({
          ...prev,
          [type]: { ...prev[type], [band]: val }
      }));
      // Note: Real EQ connection would happen here via audioService
  };

  const ChannelStrip = ({ label, type, icon: Icon, hasPan = false, hasEq = false }: { label: string, type: InstrumentType, icon: any, hasPan?: boolean, hasEq?: boolean }) => {
      const isMuted = mutes[type];
      const isSolo = solos[type];

      return (
        <div className="flex flex-col items-center gap-2 bg-[#1e1e24] p-3 rounded-xl border border-slate-700 shadow-xl min-w-[100px] relative group">
            {/* Header Icon */}
            <div className="text-slate-400 mb-1 p-2 bg-slate-900 rounded-full shadow-inner border border-slate-800">
                {<Icon size={16} />}
            </div>
            
            {/* EQ Section */}
            {hasEq && (
                <div className="flex flex-col gap-2 w-full bg-slate-900/50 p-2 rounded-lg border border-slate-800 mb-1">
                    <div className="flex justify-between items-center">
                        <span className="text-[8px] text-slate-500 font-mono">HI</span>
                        <input type="range" min="-10" max="10" value={eqs[type].high} onChange={(e) => updateEq(type, 'high', Number(e.target.value))} className="w-12 h-1 accent-slate-400 bg-slate-700 rounded-full appearance-none"/>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[8px] text-slate-500 font-mono">MID</span>
                        <input type="range" min="-10" max="10" value={eqs[type].mid} onChange={(e) => updateEq(type, 'mid', Number(e.target.value))} className="w-12 h-1 accent-slate-400 bg-slate-700 rounded-full appearance-none"/>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[8px] text-slate-500 font-mono">LO</span>
                        <input type="range" min="-10" max="10" value={eqs[type].low} onChange={(e) => updateEq(type, 'low', Number(e.target.value))} className="w-12 h-1 accent-slate-400 bg-slate-700 rounded-full appearance-none"/>
                    </div>
                </div>
            )}

            {/* Pan Knob */}
            {hasPan ? (
                <div className="flex flex-col items-center gap-1 w-full mb-2">
                    <input 
                        type="range" min="-1" max="1" step="0.1"
                        value={pans[type]}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setPans(prev => ({ ...prev, [type]: val }));
                            setInstrumentPan(type, val);
                        }}
                        className="w-12 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        title={`Pan: ${pans[type]}`}
                    />
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter flex items-center gap-1">
                        {pans[type] < 0 ? 'L' : pans[type] > 0 ? 'R' : 'C'}
                    </span>
                </div>
            ) : <div className="h-6" />}

            {/* Mute / Solo Buttons */}
            <div className="flex gap-2 w-full justify-center mb-2">
                <button 
                    onClick={() => {
                        const newVal = !mutes[type];
                        setMutes(prev => ({...prev, [type]: newVal}));
                        if (newVal) setInstrumentVolume(type, -100); // Simple mute logic
                        else setInstrumentVolume(type, volumes[type]);
                    }}
                    className={clsx("w-6 h-6 rounded flex items-center justify-center text-[8px] font-black border transition-all", isMuted ? "bg-red-600 border-red-400 text-white" : "bg-slate-800 border-slate-600 text-slate-500 hover:text-slate-300")}
                    title="Mute"
                >
                    M
                </button>
                <button 
                    onClick={() => setSolos(prev => ({...prev, [type]: !solos[type]}))}
                    className={clsx("w-6 h-6 rounded flex items-center justify-center text-[8px] font-black border transition-all", isSolo ? "bg-yellow-500 border-yellow-300 text-black" : "bg-slate-800 border-slate-600 text-slate-500 hover:text-slate-300")}
                    title="Solo"
                >
                    S
                </button>
            </div>

            <div className="flex gap-2 h-48 w-full justify-center">
                {/* Volume Fader */}
                <div className="h-full relative flex justify-center py-2 w-8 bg-black/40 rounded-lg border border-slate-800">
                    <input 
                        type="range" min="-60" max="6" value={volumes[type]}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setVolumes(prev => ({ ...prev, [type]: val }));
                            if (!mutes[type]) setInstrumentVolume(type, val);
                        }}
                        className="appearance-none w-full h-full bg-transparent outline-none cursor-pointer vertical-slider z-20 absolute inset-0"
                        style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '100%', opacity: 0 }} 
                    />
                    
                    {/* Visual Fader Track */}
                    <div className="absolute top-2 bottom-2 w-1 bg-slate-700 rounded-full pointer-events-none"></div>
                    
                    {/* Visual Fader Cap */}
                    <div 
                        className={clsx("absolute w-6 h-10 rounded shadow-md border-t border-white/20 pointer-events-none transition-all duration-75 z-10 flex items-center justify-center", type === 'master' ? "bg-red-600" : "bg-slate-600")}
                        style={{ bottom: `${((volumes[type] + 60) / 66) * 85}%` }}
                    >
                        <div className="w-4 h-[1px] bg-black/50" />
                    </div>
                </div>

                {/* VU Meter */}
                <div className="w-2 h-full bg-black/60 rounded-full border border-slate-800 overflow-hidden flex flex-col-reverse p-[1px]">
                    {Array.from({ length: 20 }).map((_, i) => {
                        const threshold = i / 20;
                        const isActive = vuLevels[type] > threshold;
                        let color = "bg-green-500";
                        if (i > 14) color = "bg-yellow-500";
                        if (i > 17) color = "bg-red-500";

                        return (
                            <div 
                                key={i} 
                                className={clsx("w-full flex-1 rounded-[1px] mb-[1px] transition-opacity duration-75", isActive ? color : "bg-slate-800/50")} 
                            />
                        );
                    })}
                </div>
            </div>

            <span className="text-[10px] font-black text-slate-300 uppercase bg-slate-900 px-2 py-1 rounded w-full text-center border border-slate-700/50 mt-2 truncate">
                {label}
            </span>
        </div>
      );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#15151a] border border-slate-700 rounded-3xl w-full max-w-7xl p-8 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-lg">
                <Sliders size={24} className="text-cyan-400" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Audio Studio Pro</h2>
                <p className="text-xs text-slate-400 font-medium">Console de Mixage Analogique & IR Loader</p>
            </div>
          </div>
          <div className="flex gap-4">
             <button 
                onClick={toggleMagic}
                className={clsx(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all flex items-center gap-2 shadow-lg",
                    studioMagic ? "bg-yellow-500 text-black border-yellow-400 shadow-yellow-500/20" : "bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300"
                )}
             >
                 <Wand2 size={14} /> Studio Magic {studioMagic ? 'ON' : 'OFF'}
             </button>
             <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"><X size={24} /></button>
          </div>
        </div>

        <div className="flex-1 flex gap-8 overflow-hidden">
            
            {/* LEFT COLUMN: BANKS & TEXTURES (Scrollable) */}
            <div className="w-64 flex flex-col gap-6 overflow-y-auto custom-scrollbar shrink-0 pr-2">
                {/* BANQUE DE SONS */}
                <div className="bg-[#1a1a20] p-4 rounded-2xl border border-slate-800 shadow-lg">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Disc size={12} /> Instrument (Tone)
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {SOUND_BANKS.map(bank => (
                            <button
                                key={bank.id}
                                onClick={() => handleBankChange(bank.id)}
                                disabled={isChangingBank}
                                className={clsx(
                                    "p-2 rounded-xl border flex flex-col items-center gap-2 transition-all relative overflow-hidden group",
                                    currentBank === bank.id ? "bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-900/20" : "bg-slate-800/50 border-slate-700 hover:bg-slate-700"
                                )}
                            >
                                <div className={clsx("p-1.5 rounded-full", currentBank === bank.id ? "bg-white/20 text-white" : "bg-slate-900 text-slate-500")}>
                                    {isChangingBank && currentBank === bank.id ? <Loader2 size={14} className="animate-spin"/> : <bank.icon size={14} />}
                                </div>
                                <span className={clsx("text-[8px] font-black uppercase text-center leading-tight", currentBank === bank.id ? "text-white" : "text-slate-400")}>{bank.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* AMBIANCES */}
                <div className="bg-[#1a1a20] p-4 rounded-2xl border border-slate-800 shadow-lg">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity size={12} /> Room (Texture)
                    </h3>
                    <div className="flex flex-col gap-2">
                        {TEXTURES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => handleTextureChange(t.id)}
                                className={clsx(
                                    "px-3 py-2 rounded-lg border flex items-center gap-3 font-bold text-[10px] transition-all",
                                    currentTexture === t.id ? "bg-cyan-900/50 border-cyan-500 text-cyan-200" : "bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-700"
                                )}
                            >
                                <t.icon size={14} /> {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: MIXER CONSOLE (Main Stage) */}
            <div className="flex-1 bg-[#121216] rounded-2xl border border-slate-800 shadow-inner flex flex-col overflow-hidden relative">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
                 
                 <div className="p-4 border-b border-slate-800/50 bg-black/20 flex justify-between items-center">
                     <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Sliders size={12} /> Console Principale
                     </h3>
                     <span className="text-[10px] font-mono text-slate-600">48kHz / 32-bit Float</span>
                 </div>

                 <div className="flex-1 flex justify-center items-end gap-2 md:gap-4 p-6 overflow-x-auto custom-scrollbar">
                     {/* Channels */}
                     <ChannelStrip label="Guitare" type="guitar" icon={Guitar} hasPan={true} hasEq={true} />
                     <ChannelStrip label="Backing" type="vocals" icon={Music} hasPan={true} hasEq={true} />
                     
                     {/* Spacer / Bus Separator */}
                     <div className="w-[1px] h-64 bg-slate-800 mx-2 self-center opacity-50" />
                     
                     {/* Master */}
                     <div className="bg-black/30 p-2 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-sm">
                        <ChannelStrip label="MASTER" type="master" icon={Speaker} hasPan={false} hasEq={true} />
                     </div>
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
};
