
import React, { useEffect, useState, useRef } from 'react';
import { X, Mic, MicOff, Zap, Speaker, ArrowRight, Save, Download, Sliders, Power, Disc, MoveRight, Radio, Box, Cable, Guitar, Camera, Layers, Repeat, Split, ArrowDownRight, ArrowUpRight, CircleDot, FolderOpen, GripVertical } from 'lucide-react';
import clsx from 'clsx';
import { updateGuitarEffects, toggleLiveGuitarInput, getAvailableAudioInputs } from '../services/audioService';
import { GuitarEffects, AmpModel, PickupType } from '../types';
import { PresetBrowser } from './PresetBrowser';
import { Reorder } from 'framer-motion';

interface PedalboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEffects: GuitarEffects;
  onEffectsChange: (effects: GuitarEffects) => void;
}

// --- DEVICE DEFINITIONS (DATA) ---

type DeviceType = 'AMP' | 'PEDAL_DRIVE' | 'CAB' | 'PEDAL_MOD' | 'PEDAL_TIME' | 'SPLITTER' | 'PEDAL_EQ';

interface DeviceDef {
    id: string;
    type: DeviceType;
    name: string;
    description: string;
    color: string;
    knobs: { id: string; label: string; min: number; max: number; def: number }[];
    // Visual hints
    texture?: string;
    faceplateColor?: string;
    knobStyle?: 'black' | 'gold' | 'chrome' | 'cream' | 'modern';
}

const DEVICE_CATALOG: DeviceDef[] = [
    // --- AMPS ---
    {
        id: 'CLEAN_TWIN', type: 'AMP', name: 'US Twin 65', description: 'Legendary California Clean',
        color: 'bg-zinc-900', faceplateColor: 'bg-zinc-300', knobStyle: 'black',
        knobs: [
            { id: 'gain', label: 'Gain', min: 0, max: 1, def: 0.4 },
            { id: 'bass', label: 'Bass', min: -10, max: 10, def: 0 },
            { id: 'mid', label: 'Middle', min: -10, max: 10, def: 0 },
            { id: 'treble', label: 'Treble', min: -10, max: 10, def: 0 },
            { id: 'presence', label: 'Bright', min: 0, max: 1, def: 0 },
            { id: 'volume', label: 'Master', min: 0, max: 1, def: 0.8 }
        ]
    },
    {
        id: 'CRUNCH_PLEXI', type: 'AMP', name: 'Brit 1959', description: 'The Sound of Rock',
        color: 'bg-zinc-800', faceplateColor: 'bg-[#eecfa1]', knobStyle: 'gold',
        knobs: [
            { id: 'gain', label: 'Pre-Amp', min: 0, max: 1, def: 0.7 },
            { id: 'bass', label: 'Bass', min: -10, max: 10, def: 2 },
            { id: 'mid', label: 'Contour', min: -10, max: 10, def: 5 },
            { id: 'treble', label: 'Treble', min: -10, max: 10, def: 4 },
            { id: 'presence', label: 'Pres', min: 0, max: 1, def: 0.5 },
            { id: 'volume', label: 'Master', min: 0, max: 1, def: 0.9 }
        ]
    },
    {
        id: 'HIGH_RECTO', type: 'AMP', name: 'Cali Recto', description: 'Modern High Gain Wall',
        color: 'bg-zinc-900', faceplateColor: 'bg-zinc-800', knobStyle: 'chrome',
        knobs: [
            { id: 'gain', label: 'Gain', min: 0, max: 1, def: 0.8 },
            { id: 'bass', label: 'Low', min: -10, max: 10, def: 4 },
            { id: 'mid', label: 'Mid', min: -10, max: 10, def: -2 },
            { id: 'treble', label: 'High', min: -10, max: 10, def: 5 },
            { id: 'presence', label: 'Pres', min: 0, max: 1, def: 0.5 },
            { id: 'volume', label: 'Master', min: 0, max: 1, def: 0.8 }
        ]
    },
    // --- PEDALS: DRIVE ---
    {
        id: 'DRIVE_TS', type: 'PEDAL_DRIVE', name: 'Green Screamer', description: 'Classic Overdrive',
        color: 'bg-green-600', knobStyle: 'cream',
        knobs: [
            { id: 'drive', label: 'Drive', min: 0, max: 1, def: 0.5 },
            { id: 'tone', label: 'Tone', min: 0, max: 1, def: 0.5 },
            { id: 'level', label: 'Level', min: 0, max: 1, def: 0.8 }
        ]
    },
    {
        id: 'DRIVE_DIST', type: 'PEDAL_DRIVE', name: 'Orange Dist', description: 'Hard Clipping Distortion',
        color: 'bg-orange-500', knobStyle: 'black',
        knobs: [
            { id: 'drive', label: 'Dist', min: 0, max: 1, def: 0.7 },
            { id: 'tone', label: 'Filter', min: 0, max: 1, def: 0.5 },
            { id: 'level', label: 'Vol', min: 0, max: 1, def: 0.6 }
        ]
    },
    // --- CABS (With IR Models) ---
    {
        id: '1x12', type: 'CAB', name: '1x12 Deluxe', description: 'Focused, boxy tone',
        color: 'bg-zinc-800', knobs: [] 
    },
    {
        id: '2x12', type: 'CAB', name: '2x12 British', description: 'Balanced open back',
        color: 'bg-zinc-900', knobs: [] 
    },
    {
        id: '4x12', type: 'CAB', name: '4x12 Stack', description: 'Massive low end',
        color: 'bg-black', knobs: [] 
    },
    {
        id: 'ACOUSTIC', type: 'CAB', name: 'Acoustic Body', description: 'Wood resonance',
        color: 'bg-amber-900', knobs: [] 
    },
    // --- SPLITTER ---
    {
        id: 'SPLITTER_AB', type: 'SPLITTER', name: 'A/B Splitter', description: 'Dual Path Routing',
        color: 'bg-slate-700', knobStyle: 'modern',
        knobs: [
            { id: 'mixA', label: 'Level A', min: 0, max: 1, def: 0.8 },
            { id: 'mixB', label: 'Level B', min: 0, max: 1, def: 0.8 }
        ]
    },
    // --- POST FX ---
    {
        id: 'chorus', type: 'PEDAL_MOD', name: 'Super Chorus', description: 'Stereo Chorus',
        color: 'bg-cyan-500', knobStyle: 'black',
        knobs: [
            { id: 'mix', label: 'Mix', min: 0, max: 1, def: 0.3 },
            { id: 'rate', label: 'Rate', min: 0.1, max: 5, def: 0.5 },
            { id: 'depth', label: 'Depth', min: 0, max: 1, def: 0.5 }
        ]
    },
    {
        id: 'delay', type: 'PEDAL_TIME', name: 'Digital Delay', description: 'Precise Repeats',
        color: 'bg-blue-600', knobStyle: 'cream',
        knobs: [
            { id: 'mix', label: 'Mix', min: 0, max: 1, def: 0.3 },
            { id: 'feedback', label: 'F.Back', min: 0, max: 0.9, def: 0.4 },
            { id: 'time', label: 'Time', min: 0, max: 1, def: 0.5 }
        ]
    },
    {
        id: 'reverb', type: 'PEDAL_TIME', name: 'Studio Plate', description: 'Lush Reverb',
        color: 'bg-slate-500', knobStyle: 'chrome',
        knobs: [
            { id: 'mix', label: 'Mix', min: 0, max: 1, def: 0.3 },
            { id: 'decay', label: 'Decay', min: 0.1, max: 10, def: 2 }
        ]
    },
    {
        id: 'eq', type: 'PEDAL_EQ', name: 'GE-7 EQ', description: '7 Band EQ',
        color: 'bg-zinc-300', knobStyle: 'black', faceplateColor: 'text-black',
        knobs: [
            { id: 'low', label: 'Low', min: -10, max: 10, def: 0 },
            { id: 'mid', label: 'Mid', min: -10, max: 10, def: 0 },
            { id: 'high', label: 'High', min: -10, max: 10, def: 0 }
        ]
    }
];

// --- REALISTIC KNOB COMPONENT ---
const RealisticKnob = ({ value, min, max, label, style = 'black', onChange }: any) => {
    const norm = (value - min) / (max - min);
    const rotation = -135 + (norm * 270);

    const styles: any = {
        black: "bg-zinc-900 border-zinc-700 shadow-black",
        gold: "bg-yellow-600 border-yellow-800 shadow-yellow-900/50",
        chrome: "bg-gradient-to-br from-zinc-200 to-zinc-400 border-zinc-300 shadow-zinc-500/50",
        cream: "bg-[#f5f5dc] border-[#e0e0c0] shadow-zinc-500/30 text-black",
        modern: "bg-slate-800 border-slate-600 shadow-xl text-white"
    };

    const indicatorColor = style === 'black' || style === 'modern' ? 'bg-white' : 'bg-black';

    return (
        <div className="flex flex-col items-center gap-2 group cursor-ns-resize">
            <div className={clsx("relative w-16 h-16 rounded-full border-4 shadow-xl flex items-center justify-center transition-transform active:scale-95", styles[style])}>
                <div 
                    className="absolute w-full h-full rounded-full"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <div className={clsx("absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-4 rounded-full", indicatorColor)} />
                </div>
                <input 
                    type="range" min={min} max={max} step={(max-min)/100} value={value} 
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    title={`${label}: ${value}`}
                />
            </div>
            <span className={clsx("text-[10px] font-black uppercase tracking-widest pointer-events-none select-none", style === 'gold' ? "text-zinc-900" : "text-zinc-400 group-hover:text-white")}>
                {label}
            </span>
        </div>
    );
};

// --- PEDAL VISUAL COMPONENT ---
const Pedal = ({ id, label, isActive, color, onClick, onDoubleClick, isSelected, children }: any) => {
    return (
        <div 
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            className={clsx(
                "relative flex-shrink-0 w-28 h-40 rounded-xl border-b-4 border-r-4 transition-all flex flex-col items-center shadow-xl group overflow-hidden",
                color,
                isSelected ? "border-yellow-400 scale-105 z-10 ring-4 ring-yellow-500/30" : "border-black/30 opacity-90 hover:opacity-100 hover:scale-105",
                !isActive && "brightness-50 grayscale-[0.5]"
            )}
        >
            {/* Texture Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-20 pointer-events-none mix-blend-overlay" />
            
            {/* Top Jack Area */}
            <div className="w-full h-4 bg-black/20 border-b border-white/10 mb-2" />

            {/* Label */}
            <div className="px-2 w-full text-center z-10">
                <span className="text-[10px] font-black uppercase text-white/90 drop-shadow-md bg-black/20 px-2 py-0.5 rounded-full border border-white/10 truncate block">
                    {label}
                </span>
            </div>

            {/* Knobs Preview (Abstract) */}
            <div className="flex justify-center gap-1 mt-2 z-10">
                <div className="w-4 h-4 rounded-full bg-black/40 border border-white/20 shadow-inner" />
                <div className="w-4 h-4 rounded-full bg-black/40 border border-white/20 shadow-inner" />
                <div className="w-4 h-4 rounded-full bg-black/40 border border-white/20 shadow-inner" />
            </div>

            {/* Footswitch */}
            <div className="mt-auto mb-4 w-12 h-12 bg-zinc-300 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.5)] border-4 border-zinc-400 flex items-center justify-center relative active:scale-95 transition-transform">
                <div className="w-8 h-8 rounded-full border border-zinc-500 bg-zinc-200" />
            </div>

            {/* LED */}
            <div className={clsx("absolute top-16 w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] transition-all", isActive ? "bg-red-500 text-red-500" : "bg-red-900 text-red-900")} />

            {children}
        </div>
    );
};

export const PedalboardModal: React.FC<PedalboardModalProps> = ({ 
  isOpen, onClose, currentEffects, onEffectsChange
}) => {
  const [localEffects, setLocalEffects] = useState<GuitarEffects>(currentEffects);
  // selectedSlot: string ID instead of index for more robust handling
  const [selectedSlotId, setSelectedSlotId] = useState<string>('ampA'); 
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [isPresetBrowserOpen, setIsPresetBrowserOpen] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Cab Finder State
  const [micPos, setMicPos] = useState({ x: 0.5, y: 0.5 });
  const cabRef = useRef<HTMLDivElement>(null);

  // Quick Snap
  const [activeSnap, setActiveSnap] = useState<number | null>(null);
  const [snaps, setSnaps] = useState<Record<number, GuitarEffects>>({});

  useEffect(() => {
    if (isOpen) {
        setLocalEffects(currentEffects);
        updateGuitarEffects(currentEffects);
    }
  }, [isOpen]);

  const updateFx = (newFx: GuitarEffects) => {
      setLocalEffects(newFx);
      onEffectsChange(newFx);
      updateGuitarEffects(newFx);
      if (activeSnap !== null) setSnaps(prev => ({ ...prev, [activeSnap]: newFx }));
  };

  const handleSnapClick = (index: number) => {
    const existingSnap = snaps[index];
    if (existingSnap) {
        setLocalEffects(existingSnap);
        onEffectsChange(existingSnap);
        updateGuitarEffects(existingSnap);
    } else {
        setSnaps(prev => ({ ...prev, [index]: localEffects }));
    }
    setActiveSnap(index);
  };

  const toggleSplitter = () => {
      const isSplit = localEffects.routingMode === 'DUAL_PARALLEL';
      const newFx = { ...localEffects, routingMode: isSplit ? 'SINGLE' : 'DUAL_PARALLEL' } as GuitarEffects;
      if (!isSplit && !newFx.pathB.enabled) {
          newFx.pathB = {
              enabled: true,
              drive: 0,
              amp: { ...newFx.pathA.amp, model: 'HIGH_RECTO' }
          };
          newFx.pathBMix = 0.8;
      }
      updateFx(newFx);
  };

  const handleDeviceChange = (device: DeviceDef) => {
      let newFx = { ...localEffects };
      
      if (selectedSlotId === 'ampA') {
          newFx.pathA.amp.model = device.id as AmpModel;
          device.knobs.forEach(k => { (newFx.pathA.amp as any)[k.id] = k.def; });
      } else if (selectedSlotId === 'ampB') {
          newFx.pathB.amp.model = device.id as AmpModel;
          device.knobs.forEach(k => { (newFx.pathB.amp as any)[k.id] = k.def; });
      } else if (selectedSlotId === 'driveA') {
          newFx.pathA.drive = device.id === 'DRIVE_TS' ? 0.3 : 0.8;
      } else if (selectedSlotId === 'driveB') {
          newFx.pathB.drive = device.id === 'DRIVE_TS' ? 0.3 : 0.8;
      } else if (selectedSlotId === 'cabA') {
          newFx.pathA.amp.cabModel = device.id;
      } else if (selectedSlotId === 'cabB') {
          newFx.pathB.amp.cabModel = device.id;
      }
      
      updateFx(newFx);
      setIsBrowserOpen(false);
  };

  const handleKnobChange = (knobId: string, val: number) => {
      const newFx = { ...localEffects };
      
      if (selectedSlotId === 'ampA') (newFx.pathA.amp as any)[knobId] = val;
      else if (selectedSlotId === 'ampB') (newFx.pathB.amp as any)[knobId] = val;
      else if (selectedSlotId === 'driveA') { if (knobId === 'drive') newFx.pathA.drive = val; }
      else if (selectedSlotId === 'driveB') { if (knobId === 'drive') newFx.pathB.drive = val; }
      else if (selectedSlotId === 'splitter') {
          if (knobId === 'mixA') newFx.pathAMix = val;
          if (knobId === 'mixB') newFx.pathBMix = val;
      }
      else {
          // Post FX
          if (localEffects.postFx[selectedSlotId as keyof typeof localEffects.postFx]) {
             const fxObj = newFx.postFx[selectedSlotId as keyof typeof localEffects.postFx] as any;
             if (fxObj) fxObj[knobId] = val;
          }
      }
      updateFx(newFx);
  };

  const handleMicDrag = (e: React.MouseEvent) => {
      if (!cabRef.current || e.buttons !== 1) return;
      const rect = cabRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      setMicPos({ x, y });
      
      const newFx = { ...localEffects };
      const isPathB = selectedSlotId === 'cabB';
      const targetAmp = isPathB ? newFx.pathB.amp : newFx.pathA.amp;

      const distanceFromCenter = Math.abs(x - 0.5) * 2; 
      targetAmp.presence = 1 - distanceFromCenter; // Simulates Mic brightness on axis
      targetAmp.treble = (1 - distanceFromCenter) * 10 - 5; 
      // Bass response increases as you move to edge (proximity/phase) but simplifying here
      targetAmp.bass = (1 - y) * 10 - 2; 

      updateFx(newFx);
  };

  const toggleMonitoring = async () => {
      const newState = !isMonitoring;
      await toggleLiveGuitarInput(newState);
      setIsMonitoring(newState);
  };

  if (!isOpen) return null;

  const isSplit = localEffects.routingMode === 'DUAL_PARALLEL';
  const currentAmpA = DEVICE_CATALOG.find(d => d.id === localEffects.pathA.amp.model) || DEVICE_CATALOG[0];
  const currentAmpB = DEVICE_CATALOG.find(d => d.id === localEffects.pathB.amp.model) || DEVICE_CATALOG[2];
  
  // Resolve Selected Device for the Main View
  let selectedDevice: DeviceDef | null = null;
  if (selectedSlotId === 'splitter') selectedDevice = DEVICE_CATALOG.find(d => d.type === 'SPLITTER') || null;
  else if (selectedSlotId === 'ampA') selectedDevice = currentAmpA;
  else if (selectedSlotId === 'ampB') selectedDevice = currentAmpB;
  else if (selectedSlotId === 'driveA') selectedDevice = DEVICE_CATALOG.find(d => d.id === 'DRIVE_TS') || DEVICE_CATALOG[3];
  else if (selectedSlotId === 'driveB') selectedDevice = DEVICE_CATALOG.find(d => d.id === 'DRIVE_TS') || DEVICE_CATALOG[3];
  else if (selectedSlotId === 'cabA') selectedDevice = DEVICE_CATALOG.find(d => d.id === (localEffects.pathA.amp.cabModel || '2x12')) || DEVICE_CATALOG[6];
  else if (selectedSlotId === 'cabB') selectedDevice = DEVICE_CATALOG.find(d => d.id === (localEffects.pathB.amp.cabModel || '2x12')) || DEVICE_CATALOG[6];
  else {
      // Post FX
      selectedDevice = DEVICE_CATALOG.find(d => d.id === selectedSlotId) || null;
  }

  // Current Post FX Order
  const postFxOrder = localEffects.postFx.order || ['chorus', 'delay', 'reverb', 'eq'];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 md:p-4 bg-black/95 animate-in fade-in duration-300">
      <div className="w-full max-w-[95vw] h-full md:h-[90vh] bg-[#1a1a20] border border-zinc-800 rounded-none md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* PRESET BROWSER OVERLAY */}
        <PresetBrowser 
            isOpen={isPresetBrowserOpen} 
            onClose={() => setIsPresetBrowserOpen(false)} 
            currentEffects={localEffects}
            onLoad={(effects) => {
                updateFx(effects);
                setIsPresetBrowserOpen(false);
            }}
        />

        {/* HEADER */}
        <div className="h-16 bg-[#121216] border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-2">
                <Sliders className="text-yellow-500" size={20} />
                <h2 className="text-xl font-black text-white italic tracking-tighter">VIBE<span className="text-zinc-500">RIG</span></h2>
            </div>
            
            <div className="flex gap-4">
                <button onClick={toggleSplitter} className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border", isSplit ? "bg-indigo-600 border-indigo-400 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400")}>
                    <Split size={14} /> {isSplit ? 'DUAL' : 'SINGLE'}
                </button>

                <button onClick={() => setIsPresetBrowserOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-zinc-800 border-zinc-700 text-yellow-500 hover:text-white hover:border-yellow-500">
                    <FolderOpen size={14} /> PRESETS
                </button>
            </div>

            <div className="flex gap-2">
                <button onClick={toggleMonitoring} className={clsx("p-2 rounded-lg border transition-all", isMonitoring ? "bg-red-900/50 border-red-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-500")}>
                    <Power size={18} />
                </button>
                <button onClick={onClose} className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white"><X size={18}/></button>
            </div>
        </div>

        {/* 1. SIGNAL CHAIN RAIL */}
        <div className="h-64 bg-[#0a0a0c] border-b border-zinc-800 flex items-center overflow-x-auto custom-scrollbar px-8 relative gap-4">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none fixed" />
            
            {/* Input Node */}
            <div className="flex flex-col items-center opacity-50 shrink-0">
                <span className="text-[9px] font-bold text-zinc-600">IN</span>
                <ArrowRight size={24} className="text-zinc-600" />
            </div>

            {/* PRE-AMP SECTION (Fixed) */}
            <div className="flex flex-col gap-2 shrink-0">
                {isSplit ? (
                    <>
                        {/* Path A */}
                        <div className="flex items-center gap-2 p-2 bg-zinc-900/50 rounded-xl border border-white/5">
                            <Pedal 
                                id="driveA" label="Drive A" color="bg-green-600"
                                isActive={localEffects.pathA.drive > 0} 
                                onClick={() => setSelectedSlotId('driveA')}
                                onDoubleClick={() => { setSelectedSlotId('driveA'); setIsBrowserOpen(true); }}
                                isSelected={selectedSlotId === 'driveA'}
                            />
                            <div className="w-8 flex items-center justify-center text-zinc-700"><ArrowRight size={16} /></div>
                            <Pedal 
                                id="ampA" label="Amp A" color="bg-zinc-800"
                                isActive={true} 
                                onClick={() => setSelectedSlotId('ampA')}
                                onDoubleClick={() => { setSelectedSlotId('ampA'); setIsBrowserOpen(true); }}
                                isSelected={selectedSlotId === 'ampA'}
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none"><Zap size={48} /></div>
                            </Pedal>
                        </div>
                        {/* Path B */}
                        <div className="flex items-center gap-2 p-2 bg-zinc-900/50 rounded-xl border border-white/5">
                            <Pedal 
                                id="driveB" label="Drive B" color="bg-orange-600"
                                isActive={localEffects.pathB.drive > 0} 
                                onClick={() => setSelectedSlotId('driveB')}
                                onDoubleClick={() => { setSelectedSlotId('driveB'); setIsBrowserOpen(true); }}
                                isSelected={selectedSlotId === 'driveB'}
                            />
                            <div className="w-8 flex items-center justify-center text-zinc-700"><ArrowRight size={16} /></div>
                            <Pedal 
                                id="ampB" label="Amp B" color="bg-zinc-700"
                                isActive={true} 
                                onClick={() => setSelectedSlotId('ampB')}
                                onDoubleClick={() => { setSelectedSlotId('ampB'); setIsBrowserOpen(true); }}
                                isSelected={selectedSlotId === 'ampB'}
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none"><Zap size={48} /></div>
                            </Pedal>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <Pedal 
                            id="driveA" label="Stomp" color="bg-green-600"
                            isActive={localEffects.pathA.drive > 0} 
                            onClick={() => setSelectedSlotId('driveA')}
                            onDoubleClick={() => { setSelectedSlotId('driveA'); setIsBrowserOpen(true); }}
                            isSelected={selectedSlotId === 'driveA'}
                        />
                        <div className="w-8 flex items-center justify-center text-zinc-700"><ArrowRight size={16} /></div>
                        <Pedal 
                            id="ampA" label="Head" color="bg-zinc-900"
                            isActive={true} 
                            onClick={() => setSelectedSlotId('ampA')}
                            onDoubleClick={() => { setSelectedSlotId('ampA'); setIsBrowserOpen(true); }}
                            isSelected={selectedSlotId === 'ampA'}
                        >
                            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none"><Zap size={48} /></div>
                        </Pedal>
                        <div className="w-8 flex items-center justify-center text-zinc-700"><ArrowRight size={16} /></div>
                        <Pedal 
                            id="cabA" label={localEffects.pathA.amp.cabModel || '2x12'} color="bg-black"
                            isActive={true} 
                            onClick={() => setSelectedSlotId('cabA')}
                            onDoubleClick={() => { setSelectedSlotId('cabA'); setIsBrowserOpen(true); }}
                            isSelected={selectedSlotId === 'cabA'}
                        >
                            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none"><GridPattern /></div>
                        </Pedal>
                    </div>
                )}
            </div>

            {/* SPLITTER NODE (Visual only in single mode, functional in dual) */}
            {isSplit && (
                <div onClick={() => setSelectedSlotId('splitter')} className={clsx("flex flex-col items-center justify-center px-4 cursor-pointer", selectedSlotId === 'splitter' ? "text-indigo-400" : "text-zinc-600")}>
                    <div className="h-full w-[2px] bg-zinc-800" />
                    <div className="p-2 border-2 border-current rounded-full bg-black z-10"><Split size={20} /></div>
                    <div className="h-full w-[2px] bg-zinc-800" />
                </div>
            )}

            {!isSplit && <div className="w-8 flex items-center justify-center text-zinc-700 shrink-0"><ArrowRight size={16} /></div>}

            {/* POST FX SECTION (Reorderable) */}
            <Reorder.Group axis="x" values={postFxOrder} onReorder={(newOrder) => updateFx({...localEffects, postFx: { ...localEffects.postFx, order: newOrder }})} className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-zinc-800/50">
                {postFxOrder.map(fxId => {
                    const def = DEVICE_CATALOG.find(d => d.id === fxId);
                    const fxState = (localEffects.postFx as any)[fxId];
                    if (!def || !fxState) return null;

                    return (
                        <Reorder.Item key={fxId} value={fxId} className="relative">
                            <Pedal 
                                id={fxId} label={def.name} color={def.color}
                                isActive={fxState.enabled}
                                onClick={() => setSelectedSlotId(fxId)}
                                isSelected={selectedSlotId === fxId}
                            >
                                <div className="absolute top-2 right-2 text-white/50 cursor-grab active:cursor-grabbing hover:text-white">
                                    <GripVertical size={14} />
                                </div>
                            </Pedal>
                        </Reorder.Item>
                    );
                })}
            </Reorder.Group>

            {/* Output */}
            <div className="flex flex-col items-center opacity-50 shrink-0 ml-4">
                <ArrowRight size={24} className="text-zinc-600" />
                <span className="text-[9px] font-bold text-zinc-600">OUT</span>
            </div>
        </div>

        {/* 2. MAIN DEVICE VIEW */}
        <div className="flex-1 bg-[#151518] relative flex items-center justify-center p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#222_0%,_#111_100%)]" />
            
            {selectedDevice ? (
                <div className={clsx(
                    "relative transition-all duration-500 shadow-2xl flex flex-col items-center animate-in zoom-in-95",
                    selectedDevice.type === 'AMP' ? "w-full max-w-3xl h-80 rounded-xl" : 
                    selectedDevice.type === 'CAB' ? "w-[500px] h-[500px] rounded-sm" : 
                    "w-72 h-[450px] rounded-2xl",
                    selectedDevice.color
                )}>
                    {/* Texture Overlay */}
                    <div className="absolute inset-0 opacity-30 mix-blend-multiply pointer-events-none rounded-[inherit]" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/leather.png)' }} />
                    
                    {/* --- SPECIFIC UI FOR CAB FINDER --- */}
                    {selectedDevice.type === 'CAB' ? (
                        <div className="relative w-full h-full bg-[#111] border-[16px] border-[#222] shadow-inner flex items-center justify-center overflow-hidden group cursor-crosshair"
                             ref={cabRef}
                             onMouseMove={(e) => e.buttons === 1 && handleMicDrag(e)}
                             onMouseDown={handleMicDrag}
                        >
                            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, #333 2px, #333 4px)' }} />
                            
                            {/* Speaker Cone Visualization */}
                            <div className="w-[350px] h-[350px] rounded-full bg-black/80 border-4 border-zinc-800 shadow-[0_0_50px_black] flex items-center justify-center relative">
                                <div className="w-32 h-32 rounded-full bg-zinc-900/90 border border-zinc-700 shadow-xl" />
                            </div>

                            {/* Mic Visualization */}
                            <div 
                                className="absolute transition-transform duration-75 ease-out drop-shadow-2xl z-20 pointer-events-none"
                                style={{ left: `${micPos.x * 100}%`, top: `${micPos.y * 100}%`, transform: 'translate(-50%, -50%)' }}
                            >
                                <div className="w-4 h-12 bg-zinc-300 rounded-full border border-black shadow-xl relative">
                                    <div className="w-5 h-6 bg-black rounded-t-lg absolute -top-1 -left-0.5 border border-zinc-700" />
                                </div>
                                <div className="absolute top-14 left-1/2 -translate-x-1/2 text-[10px] font-black text-white whitespace-nowrap bg-black/50 px-2 rounded">
                                    SM57 (Sim)
                                </div>
                            </div>

                            <div className="absolute top-4 left-4 text-white font-bold bg-black/50 px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest text-xs pointer-events-none">
                                {selectedDevice.name}
                            </div>
                            <div className="absolute bottom-4 text-white/30 text-xs pointer-events-none animate-pulse">
                                DRAG MIC TO ADJUST TONE
                            </div>
                        </div>
                    ) : (
                        // --- STANDARD KNOBS UI ---
                        <div className={clsx(
                            "z-10 flex",
                            selectedDevice.type === 'AMP' 
                                ? `absolute top-4 left-4 right-4 h-24 ${selectedDevice.faceplateColor || 'bg-zinc-300'} rounded flex items-center justify-around px-8 shadow-inner border-b-2 border-black/20`
                                : "flex-col items-center justify-start pt-12 gap-10 h-full w-full"
                        )}>
                            {selectedDevice.type === 'AMP' && (
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black italic text-2xl text-black/80 tracking-tighter" style={{ fontFamily: 'serif' }}>
                                    {selectedDevice.name.split(' ')[0]}
                                </div>
                            )}

                            {/* Pedal Name */}
                            {selectedDevice.type.includes('PEDAL') && (
                                <div className="bg-black/20 px-4 py-1 rounded-full border border-white/10 mb-4">
                                    <h3 className="font-black text-xl text-white/90 uppercase tracking-tighter">{selectedDevice.name}</h3>
                                </div>
                            )}

                            <div className={clsx("flex", selectedDevice.type === 'AMP' ? "gap-6 ml-auto" : "flex-wrap justify-center gap-8 px-4")}>
                                {selectedDevice.knobs.map(knob => (
                                    <RealisticKnob 
                                        key={knob.id}
                                        {...knob}
                                        value={
                                            selectedDevice?.type === 'SPLITTER' ? (knob.id === 'mixA' ? localEffects.pathAMix : localEffects.pathBMix) :
                                            selectedDevice?.type === 'AMP' ? ((selectedSlotId === 'ampB' ? localEffects.pathB.amp : localEffects.pathA.amp) as any)[knob.id] : 
                                            selectedDevice?.type === 'PEDAL_DRIVE' ? ((selectedSlotId === 'driveB' ? localEffects.pathB : localEffects.pathA) as any)[knob.id] :
                                            ((localEffects.postFx as any)[selectedDevice!.id] as any)[knob.id]
                                        }
                                        style={selectedDevice.knobStyle}
                                        onChange={(val: number) => handleKnobChange(knob.id, val)}
                                    />
                                ))}
                            </div>

                            {selectedDevice.type.includes('PEDAL') && (
                                <div className="mt-auto mb-12 relative w-full flex justify-center">
                                    <div 
                                        onClick={() => {
                                            const newFx = { ...localEffects };
                                            if (selectedSlotId === 'driveA') newFx.pathA.drive = newFx.pathA.drive > 0 ? 0 : 0.5;
                                            else if (selectedSlotId === 'driveB') newFx.pathB.drive = newFx.pathB.drive > 0 ? 0 : 0.5;
                                            else {
                                                const fxObj = (newFx.postFx as any)[selectedSlotId];
                                                if (fxObj) fxObj.enabled = !fxObj.enabled;
                                            }
                                            updateFx(newFx);
                                        }}
                                        className="w-24 h-32 bg-zinc-300 rounded-lg shadow-2xl flex items-center justify-center border-t border-white/50 cursor-pointer active:scale-95 active:shadow-none transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full border-4 border-zinc-400 bg-zinc-200 group-hover:bg-zinc-100" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedDevice.type === 'AMP' && (
                        <div className="absolute bottom-4 left-4 right-4 top-32 bg-[#1a1a1a] rounded shadow-inner overflow-hidden border border-zinc-700">
                            <div className="w-full h-full opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 6px)' }} />
                            <div className="absolute bottom-4 right-4 font-bold text-zinc-500 text-xs tracking-[0.2em] border border-zinc-600 px-2 py-1">VIBE RIG</div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-zinc-600 font-bold uppercase tracking-widest animate-pulse">Sélectionnez un module</div>
            )}
        </div>

        {/* 3. QUICK SNAP FOOTER */}
        <div className="h-20 bg-[#121216] border-t border-zinc-800 flex items-center justify-center gap-8 shrink-0">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Quick Snap</span>
            <div className="flex gap-4">
                {[0, 1, 2, 3].map(i => (
                    <button
                        key={i}
                        onClick={() => handleSnapClick(i)}
                        className={clsx(
                            "w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-sm transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden group",
                            activeSnap === i 
                                ? "bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.6)]" 
                                : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {i + 1}
                        {activeSnap === i && <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />}
                    </button>
                ))}
            </div>
        </div>

        {/* DEVICE BROWSER DRAWER */}
        {isBrowserOpen && (
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-[#1a1a20] border-t border-zinc-700 shadow-[0_-10px_50px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-bottom duration-300 flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-black/20">
                    <span className="text-xs font-bold text-white uppercase tracking-widest">
                        Remplacer : <span className="text-yellow-500">Module</span>
                    </span>
                    <button onClick={() => setIsBrowserOpen(false)}><X size={16} className="text-zinc-500 hover:text-white" /></button>
                </div>
                <div className="flex-1 overflow-x-auto p-4 flex gap-4">
                    {DEVICE_CATALOG.filter(d => {
                        if (selectedSlotId === 'ampA' || selectedSlotId === 'ampB') return d.type === 'AMP';
                        if (selectedSlotId === 'driveA' || selectedSlotId === 'driveB') return d.type === 'PEDAL_DRIVE';
                        if (selectedSlotId === 'cabA' || selectedSlotId === 'cabB') return d.type === 'CAB';
                        // For Post FX, show relevant pedals
                        return false; 
                    }).map(device => (
                        <button 
                            key={device.id}
                            onClick={() => handleDeviceChange(device)}
                            className="flex-shrink-0 w-48 bg-zinc-900 border border-zinc-700 hover:border-yellow-500 hover:bg-zinc-800 rounded-xl p-4 flex flex-col gap-2 transition-all group text-left"
                        >
                            <div className="font-bold text-white group-hover:text-yellow-400">{device.name}</div>
                            <div className="text-[10px] text-zinc-500 leading-tight">{device.description}</div>
                            <div className="mt-auto h-1 w-full bg-zinc-800 rounded overflow-hidden">
                                <div className={clsx("h-full w-full", device.color)} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

// Helper for Cab Pattern
const GridPattern = () => (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
                <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
);
