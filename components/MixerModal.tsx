
import React, { useEffect, useState } from 'react';
import { X, Sliders, Speaker, Music, Zap, Guitar, Mic, Settings2, Power, Activity, Disc, Loader2, Waves } from 'lucide-react';
import clsx from 'clsx';
import { InstrumentType } from '../types';
import { setInstrumentVolume, initAudio, getAvailableAudioInputs, toggleLiveGuitarInput, setInputGain, loadSoundBank, setAmbientTexture } from '../services/audioService';

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

  const [currentBank, setCurrentBank] = useState('ELECTRIC_CLEAN');
  const [currentTexture, setCurrentTexture] = useState('NONE');
  const [isChangingBank, setIsChangingBank] = useState(false);

  useEffect(() => {
      if (isOpen) initAudio();
  }, [isOpen]);

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

  const Slider = ({ label, type, icon: Icon }: { label: string, type: InstrumentType, icon: any }) => (
      <div className="flex flex-col items-center gap-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 min-w-[80px]">
          <div className="text-slate-400 mb-1">{<Icon size={20} />}</div>
          <div className="h-40 relative flex justify-center py-2">
              <input 
                  type="range" min="-60" max="6" value={volumes[type]}
                  onChange={(e) => {
                      const val = Number(e.target.value);
                      setVolumes(prev => ({ ...prev, [type]: val }));
                      setInstrumentVolume(type, val);
                  }}
                  className="appearance-none w-2 h-36 bg-slate-700 rounded-lg outline-none cursor-pointer vertical-slider shadow-inner"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '8px' }}
              />
          </div>
          <span className="text-xs font-bold text-slate-300 uppercase">{label}</span>
      </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Sliders size={24} className="text-cyan-400" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Audio Studio & Banques</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            <div className="lg:col-span-2 space-y-8">
                {/* BANQUE DE SONS */}
                <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Disc size={14} /> Banque de Sons (Instrument)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {SOUND_BANKS.map(bank => (
                            <button
                                key={bank.id}
                                onClick={() => handleBankChange(bank.id)}
                                disabled={isChangingBank}
                                className={clsx(
                                    "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                    currentBank === bank.id ? "bg-indigo-600 border-indigo-400 shadow-lg" : "bg-slate-900 border-slate-800 hover:bg-slate-700"
                                )}
                            >
                                {isChangingBank && currentBank === bank.id ? <Loader2 size={20} className="animate-spin"/> : <bank.icon size={20} className={currentBank === bank.id ? "text-white" : "text-slate-500"} />}
                                <span className="text-[10px] font-black uppercase text-center">{bank.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* AMBIANCES */}
                <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={14} /> Couche Texturale (Ambient)
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {TEXTURES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => handleTextureChange(t.id)}
                                className={clsx(
                                    "px-6 py-3 rounded-full border flex items-center gap-2 font-bold text-xs transition-all",
                                    currentTexture === t.id ? "bg-cyan-600 border-cyan-400 text-white" : "bg-slate-900 border-slate-800 text-slate-500"
                                )}
                            >
                                <t.icon size={14} /> {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 flex flex-wrap justify-center gap-4">
                 <Slider label="Master" type="master" icon={Speaker} />
                 <Slider label="Instrument" type="guitar" icon={Guitar} />
                 <Slider label="Backing" type="vocals" icon={Mic} />
            </div>
        </div>

      </div>
    </div>
  );
};
