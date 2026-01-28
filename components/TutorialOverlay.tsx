
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import clsx from 'clsx';

export interface TutorialStep {
  title: string;
  desc: string;
  position: string;
  icon: any;
  color: string;
  highlightArea?: string;
}

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TutorialStep[];
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose, steps }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen || !steps || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
      setTimeout(() => setCurrentStep(0), 300); // Reset for next time
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Dynamic positioning classes
  const getPositionClasses = () => {
      // Allows passing direct Tailwind classes in position or using presets
      if (step.position.includes('top-') || step.position.includes('bottom-') || step.position.includes('left-') || step.position.includes('right-')) {
          return step.position; // Custom class passed directly
      }

      switch (step.position) {
          case 'center': return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
          case 'top-center': return "top-[20%] left-1/2 -translate-x-1/2";
          case 'bottom-center': return "bottom-[20%] left-1/2 -translate-x-1/2";
          default: return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      }
  };

  return (
    <div className="fixed inset-0 z-[200] pointer-events-auto">
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-500" />

      {/* Spotlight Effect (Optional visual cue) */}
      {step.highlightArea && (
           <div className={clsx("absolute border-2 border-white/30 bg-white/5 shadow-[0_0_100px_rgba(255,255,255,0.1)] rounded-xl transition-all duration-500", step.highlightArea)} />
      )}

      {/* Tutorial Card */}
      <AnimatePresence mode='wait'>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={clsx(
                "absolute w-full max-w-md bg-[#1e293b] border border-slate-600 rounded-2xl shadow-2xl overflow-hidden",
                getPositionClasses()
            )}
          >
             <div className={clsx("h-1.5 w-full", step.color)} />
             <div className="p-6">
                 <div className="flex items-start gap-4">
                     <div className={clsx("p-3 rounded-xl shrink-0 text-white shadow-lg", step.color)}>
                         <step.icon size={24} />
                     </div>
                     <div>
                         <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                         <p className="text-slate-300 text-sm leading-relaxed">{step.desc}</p>
                     </div>
                 </div>

                 <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-700">
                     <div className="flex gap-1">
                         {steps.map((_, i) => (
                             <div key={i} className={clsx("w-2 h-2 rounded-full transition-colors", i === currentStep ? step.color : "bg-slate-700")} />
                         ))}
                     </div>
                     <div className="flex gap-3">
                         <button 
                            onClick={onClose} 
                            className="text-xs font-bold text-slate-500 hover:text-white px-3 py-2"
                         >
                             PASSER
                         </button>
                         <button 
                            onClick={handleNext}
                            className={clsx(
                                "flex items-center gap-2 px-5 py-2 rounded-lg text-white font-bold text-sm shadow-lg hover:brightness-110 transition-all active:scale-95",
                                step.color
                            )}
                         >
                             {isLast ? "C'EST PARTI !" : "SUIVANT"}
                             {isLast ? <Check size={16} /> : <ChevronRight size={16} />}
                         </button>
                     </div>
                 </div>
             </div>
          </motion.div>
      </AnimatePresence>
    </div>
  );
};
