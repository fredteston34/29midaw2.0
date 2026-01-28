
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, AlertCircle, Copy, Save } from 'lucide-react';
import clsx from 'clsx';

export type ToastType = 'SUCCESS' | 'INFO' | 'ERROR';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'SUCCESS', isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const icons = {
    SUCCESS: <Check size={18} />,
    INFO: <Info size={18} />,
    ERROR: <AlertCircle size={18} />
  };

  const colors = {
    SUCCESS: 'bg-green-600 border-green-500 text-white',
    INFO: 'bg-indigo-600 border-indigo-500 text-white',
    ERROR: 'bg-red-600 border-red-500 text-white'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
        >
          <div className={clsx(
            "flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border backdrop-blur-md font-bold text-sm",
            colors[type]
          )}>
            {icons[type]}
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
