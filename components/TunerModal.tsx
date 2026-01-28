
import React, { useEffect, useRef, useState } from 'react';
import { X, Mic } from 'lucide-react';
import { startTuner, stopTuner, getPitch } from '../services/audioService';

interface TunerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TunerModal: React.FC<TunerModalProps> = ({ isOpen, onClose }) => {
  const [note, setNote] = useState<string>('--');
  const [cents, setCents] = useState<number>(0);
  const [hz, setHz] = useState<number>(0);
  const animationRef = useRef<number>();
  const [isStarted, setIsStarted] = useState(false);

  // Fixed: Removed unused 'time' parameter to resolve "Expected 1 arguments, but got 0" when referenced by requestAnimationFrame
  const updatePitch = () => {
      const pitch = getPitch();
      if (pitch) {
          setNote(pitch.note.replace(/[0-9]/g, '')); // Remove octave number for display
          // Smooth cents for visuals
          setCents(prev => prev + (pitch.cents - prev) * 0.2);
          setHz(pitch.hz);
      }
      animationRef.current = requestAnimationFrame(updatePitch);
  };

  useEffect(() => {
    if (isOpen) {
        // Fix: Explicitly pass undefined to startTuner to satisfy the expected 1 argument (deviceId) from startTuner(deviceId?: string)
        startTuner(undefined).then(() => setIsStarted(true)).catch((e) => console.error("Mic error", e));
        requestAnimationFrame(updatePitch);
    } else {
        stopTuner();
        setIsStarted(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
        stopTuner();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getNeedleRotation = () => {
      const clampedCents = Math.max(-50, Math.min(50, cents));
      return clampedCents * 1.8; // Map -50..50 to -90..90 degrees
  };

  const isInTune = Math.abs(cents) < 5;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
       <button onClick={onClose} className="absolute top-6 right-6 text-white p-2">
           <X size={24} />
       </button>

       <div className="flex flex-col items-center justify-center w-full max-w-lg relative">
           
           <h2 className="text-2xl font-bold text-slate-400 mb-8 uppercase tracking-widest flex items-center gap-2">
               <Mic size={20} /> Chromatic Tuner
           </h2>

           {/* Tuner Display */}
           <div className="relative w-72 h-72 rounded-full border-8 border-slate-700 bg-slate-900 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
               
               {/* Tick Marks */}
               <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1 h-4 bg-green-500 z-10" />
               <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1 h-4 bg-slate-600 rotate-45 origin-[0_136px]" />
               <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1 h-4 bg-slate-600 -rotate-45 origin-[0_136px]" />
               
               {/* Center Note */}
               <div className={`text-8xl font-black transition-colors duration-200 ${isInTune ? 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]' : 'text-white'}`}>
                   {note}
               </div>
               <div className="absolute bottom-16 text-slate-400 font-mono text-sm">
                   {hz.toFixed(1)} Hz
               </div>

               {/* Needle */}
               <div 
                  className="absolute top-0 bottom-0 w-1 bg-red-500 origin-center transition-transform duration-75"
                  style={{ 
                      height: '50%', 
                      top: 'auto', 
                      bottom: '50%', 
                      transformOrigin: 'bottom center',
                      transform: `rotate(${getNeedleRotation()}deg)` 
                  }}
               >
                   <div className="w-4 h-4 rounded-full bg-red-500 absolute -bottom-2 -left-1.5 shadow-lg" />
               </div>
           </div>

           {/* Cents Indicator */}
           <div className="mt-8 flex items-center gap-4 text-slate-400 font-mono font-bold text-xl">
               <span className={cents < -5 ? 'text-red-400' : 'opacity-20'}>♭</span>
               <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden relative">
                   <div 
                     className={`absolute top-0 bottom-0 w-1 transition-all duration-75 ${isInTune ? 'bg-green-500' : 'bg-red-500'}`}
                     style={{ left: `${50 + cents}%` }}
                   />
               </div>
               <span className={cents > 5 ? 'text-red-400' : 'opacity-20'}>♯</span>
           </div>

           {!isStarted && <p className="mt-4 text-orange-400 animate-pulse">Waiting for microphone...</p>}
       </div>
    </div>
  );
};
