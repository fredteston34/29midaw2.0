
import React, { useEffect, useState } from 'react';
import { X, Waves, Activity, Disc, Zap, Mic, MicOff, Headphones, AlertTriangle, Settings2 } from 'lucide-react';
import clsx from 'clsx';
import { updateGuitarEffects, toggleLiveGuitarInput, getAvailableAudioInputs, setInputGain } from '../services/audioService';
import { GuitarEffects, AmpModel } from '../types';

interface PedalboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEffects: GuitarEffects;
  onEffectsChange: (effects: GuitarEffects) => void;
}

export const PedalboardModal: React.FC<PedalboardModalProps> = ({ 
  isOpen, 
  onClose,
  currentEffects,
  onEffectsChange
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [availableInputs, setAvailableInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('');
  const [inputGainValue, setInputGainValue] = useState(1); // 1 = Unity Gain

  useEffect(() => {
    if (isOpen) {
        updateGuitarEffects(currentEffects);
        // Try to enumerate devices if permission already granted
        getAvailableAudioInputs().then(setAvailableInputs);
    }
  }, [isOpen, currentEffects]);

  const handleToggleMonitoring = async () => {
      const newState = !isMonitoring;
      try {
          const success = await toggleLiveGuitarInput(newState, selectedInputId || undefined);
          setIsMonitoring(success);
          if (success) {
              // Refresh device list after permission grant
              const devices = await getAvailableAudioInputs();
              setAvailableInputs(devices);
              if (!selectedInputId && devices.length > 0) {
                  setSelectedInputId(devices[0].deviceId);
              }
          }
      } catch (e) {
          console.error("Mic toggle failed", e);
          setIsMonitoring(false);
      }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newId = e.target.value;
      setSelectedInputId(newId);
      if (isMonitoring) {
          // Restart stream with new device
          await toggleLiveGuitarInput(false);
          await toggleLiveGuitarInput(true, newId);
      }
  };

  const updateEffect = (key: keyof GuitarEffects, value: any) => {
    const newEffects = { ...currentEffects, [key]: value };
    onEffectsChange(newEffects);
    updateGuitarEffects(newEffects);
  };

  const updateEQ = (band: 'low' | 'mid' | 'high', value: number) => {
      const newEQ = { ...currentEffects.eq, [band]: value };
      const newEffects = { ...currentEffects, eq: newEQ };
      onEffectsChange(newEffects);
      updateGuitarEffects(newEffects);
  };

  const handleInputGainChange = (val: number) => {
      setInputGainValue(val);
      setInputGain(val);
  };

  if (!isOpen) return null;

  const Knob = ({ label, value, onChange, min = 0, max = 1, step = 0.05, color = 'text-white' }: any) => {
     const normalized = (value - min) / (max - min);
     return (
         <div className="flex flex-col items-center gap-1.5">
             <div className="relative w-12 h-12 rounded-full bg-slate-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-slate-600 flex items-center justify-center group">
                 <div 
                    className="absolute w-0.5 h-5 bg-white rounded-full origin-bottom bottom-1/2"
                    style={{ transform: `rotate(${(normalized * 270) - 135}deg)` }}
                 />
                 <input 
                    type="range" 
                    min={min} 
                    max={max} 
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    title={`${label}: ${value}`}
                 />
             </div>
             <span className={`text-[9px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
         </div>
     );
  };

  const Pedal = ({ name, color, icon: Icon, children, isOn, onToggle }: any) => (
      <div className={clsx(
          "relative w-36 h-60 rounded-xl border-2 flex flex-col items-center p-3 shadow-2xl transition-all transform",
          isOn ? `border-${color}-500 bg-${color}-900/30 scale-105 ring-4 ring-${color}-500/20` : "border-slate-700 bg-slate-800/50 scale-100 grayscale-[0.8]"
      )}>
          <div className={clsx(
              "w-2.5 h-2.5 rounded-full mb-3 shadow-[0_0_15px_currentColor]",
              isOn ? `bg-${color}-400 text-${color}-400` : "bg-slate-900 text-transparent"
          )} />
          <div className="flex-1 flex flex-col justify-center gap-4 w-full">
              {children}
          </div>
          <button 
            onClick={onToggle}
            className="mt-4 w-full py-4 bg-gradient-to-b from-slate-600 to-slate-800 rounded-lg border-t border-slate-500 shadow-lg active:translate-y-1 transition-all flex flex-col items-center group"
          >
             <Icon size={22} className={clsx("mb-1 transition-transform group-hover:scale-110", isOn ? "text-white" : "text-slate-500")} />
             <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{name}</span>
          </button>
      </div>
  );

  const ampModels: { id: AmpModel; label: string; style: string }[] = [
      { id: 'CLEAN', label: 'US CLEAN', style: 'bg-slate-300 text-slate-900 border-slate-400' },
      { id: 'TWEED', label: 'TWEED 57', style: 'bg-yellow-200 text-yellow-900 border-yellow-400' },
      { id: 'BRITISH', label: 'BRITISH CHIME', style: 'bg-emerald-600 text-white border-emerald-800' },
      { id: 'PLEXI', label: 'PLEXI 59', style: 'bg-amber-900 text-amber-100 border-amber-950' },
      { id: 'CITRUS', label: 'CITRUS 30', style: 'bg-orange-500 text-white border-orange-700' },
      { id: 'BOUTIQUE', label: 'BOUTIQUE', style: 'bg-purple-900 text-purple-100 border-purple-950' },
      { id: 'METAL', label: 'METAL MONSTER', style: 'bg-zinc-900 text-zinc-100 border-black' },
      { id: 'ACOUSTIC_SIM', label: 'ACOUSTIC', style: 'bg-amber-100 text-amber-900 border-amber-300' },
  ];

  const currentAmp = ampModels.find(m => m.id === currentEffects.ampModel) || ampModels[0];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl flex flex-col items-center max-h-[95vh] overflow-y-auto custom-scrollbar">
        
        {/* Monitoring & Anti-Feedback Controls */}
        <div className="w-full max-w-4xl flex flex-col lg:flex-row justify-between items-center mb-6 px-4 gap-4">
             <div className="flex flex-wrap items-center gap-4">
                 <button 
                    onClick={handleToggleMonitoring}
                    className={clsx(
                        "flex items-center gap-3 px-6 py-3 rounded-full font-black uppercase text-xs tracking-widest transition-all shadow-xl",
                        isMonitoring ? "bg-red-500 text-white animate-pulse" : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
                    )}
                 >
                    {isMonitoring ? <Mic size={18} /> : <MicOff size={18} />}
                    {isMonitoring ? "LIVE INPUT : ON" : "LIVE INPUT : OFF"}
                 </button>
                 
                 {/* Device Selector */}
                 <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
                    <Settings2 size={16} className="text-slate-400 ml-2" />
                    <select 
                        value={selectedInputId}
                        onChange={handleInputChange}
                        className="bg-transparent text-xs text-white outline-none w-32 md:w-48 truncate"
                        disabled={!isMonitoring && availableInputs.length === 0}
                    >
                        {availableInputs.length === 0 && <option value="">Default Microphone</option>}
                        {availableInputs.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Input ${device.deviceId.slice(0, 5)}...`}
                            </option>
                        ))}
                    </select>
                 </div>
                 
                 {isMonitoring && (
                     <div className="flex items-center gap-3 bg-slate-900/50 border border-red-500/30 px-4 py-2 rounded-xl animate-in slide-in-from-left">
                        <AlertTriangle size={16} className="text-red-400" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-red-400 uppercase leading-none">Attention Larsen</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Headphones size={12} className="text-slate-300" />
                                <span className="text-[9px] text-slate-300 font-bold uppercase">Utilisez un casque !</span>
                            </div>
                        </div>
                     </div>
                 )}
             </div>

             <div className="flex items-center gap-6 bg-slate-800/40 p-3 rounded-2xl border border-slate-700">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Input Gain</span>
                    <Knob 
                        label="Pre-Amp" 
                        value={inputGainValue} 
                        min={0} 
                        max={3} 
                        step={0.1} 
                        onChange={handleInputGainChange} 
                        color="text-green-400" 
                    />
                </div>
                <div className="w-[1px] h-10 bg-slate-700" />
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Noise Gate</span>
                    <Knob 
                        label="Threshold" 
                        value={currentEffects.noiseGateThreshold ?? -40} 
                        min={-100} 
                        max={0} 
                        step={1} 
                        onChange={(v: number) => updateEffect('noiseGateThreshold', v)} 
                        color="text-red-400" 
                    />
                </div>
                <div className="w-[1px] h-10 bg-slate-700" />
                <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 rounded-full p-2 transition-colors">
                    <X size={24} />
                </button>
             </div>
        </div>

        <div className={clsx(
            "w-full max-w-4xl rounded-2xl border-4 shadow-2xl mb-10 flex flex-col relative overflow-hidden transition-all duration-500",
            currentAmp.style
        )}>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center p-8 gap-8 bg-black/5 backdrop-brightness-95">
                <div className="flex flex-col items-start w-40 border-r border-black/10 pr-6">
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-tight">
                        {currentAmp.label}
                    </h2>
                    <span className="text-[10px] font-black opacity-60 tracking-[0.2em] mb-4">AMPLIFICATION</span>
                    <div className="grid grid-cols-2 gap-1.5 w-full">
                        {ampModels.map(m => (
                            <button
                                key={m.id}
                                onClick={() => updateEffect('ampModel', m.id)}
                                className={clsx(
                                    "text-[8px] font-black uppercase px-2 py-1.5 rounded-md text-left transition-all border",
                                    currentEffects.ampModel === m.id 
                                        ? "bg-white text-black border-white shadow-md scale-105" 
                                        : "bg-black/10 hover:bg-black/20 border-transparent opacity-60"
                                )}
                            >
                                {m.id}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-3 md:grid-cols-6 gap-6 items-center">
                    <Knob label="Drive" value={currentEffects.distortion} onChange={(v: number) => updateEffect('distortion', v)} color="text-inherit" />
                    <Knob label="Bass" value={currentEffects.eq.low} min={-12} max={12} step={1} onChange={(v: number) => updateEQ('low', v)} color="text-inherit" />
                    <Knob label="Mid" value={currentEffects.eq.mid} min={-12} max={12} step={1} onChange={(v: number) => updateEQ('mid', v)} color="text-inherit" />
                    <Knob label="High" value={currentEffects.eq.high} min={-12} max={12} step={1} onChange={(v: number) => updateEQ('high', v)} color="text-inherit" />
                    <div className="w-[1px] h-12 bg-black/20 mx-auto hidden md:block" />
                    <Knob label="Output" value={(currentEffects.masterGain + 15) / 30} onChange={(v: number) => updateEffect('masterGain', (v * 30) - 15)} color="text-inherit" />
                </div>

                <div className="flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full bg-red-600 shadow-[0_0_15px_red] animate-pulse border-2 border-red-400" />
                    <span className="text-[10px] font-black mt-2 opacity-60">POWER</span>
                </div>
            </div>
        </div>

        <div className="flex flex-wrap justify-center gap-8 items-center pb-10">
            <Pedal 
                name="Chorus" color="cyan" icon={Waves} 
                isOn={currentEffects.chorus > 0}
                onToggle={() => updateEffect('chorus', currentEffects.chorus > 0 ? 0 : 0.6)}
            >
                <Knob label="Rate" value={currentEffects.chorus} onChange={(v: number) => updateEffect('chorus', v)} color="text-cyan-400" />
            </Pedal>
            
            <Pedal 
                name="Echo" color="purple" icon={Activity} 
                isOn={currentEffects.delay > 0}
                onToggle={() => updateEffect('delay', currentEffects.delay > 0 ? 0 : 0.4)}
            >
                <Knob label="Mix" value={currentEffects.delay} onChange={(v: number) => updateEffect('delay', v)} color="text-purple-400" />
            </Pedal>

            <Pedal 
                name="Ambience" color="amber" icon={Disc} 
                isOn={currentEffects.reverb > 0}
                onToggle={() => updateEffect('reverb', currentEffects.reverb > 0 ? 0 : 0.5)}
            >
                <Knob label="Space" value={currentEffects.reverb} onChange={(v: number) => updateEffect('reverb', v)} color="text-amber-400" />
            </Pedal>
            
            <Pedal 
                name="Overdrive" color="red" icon={Zap} 
                isOn={currentEffects.distortion > 0.3}
                onToggle={() => updateEffect('distortion', currentEffects.distortion > 0.3 ? 0 : 0.7)}
            >
                <Knob label="Hot" value={currentEffects.distortion} onChange={(v: number) => updateEffect('distortion', v)} color="text-red-400" />
            </Pedal>
        </div>
      </div>
    </div>
  );
};
