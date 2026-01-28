import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top', 
  delay = 0.3,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  let timeout: ReturnType<typeof setTimeout>;

  const showTooltip = () => {
    timeout = setTimeout(() => setIsVisible(true), delay * 1000);
  };

  const hideTooltip = () => {
    clearTimeout(timeout);
    setIsVisible(false);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div 
      className={clsx("relative flex items-center justify-center", className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 5 : -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              "absolute z-[100] px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-[10px] font-bold rounded-lg shadow-xl whitespace-nowrap pointer-events-none uppercase tracking-wide",
              positionClasses[position]
            )}
          >
            {content}
            {/* Arrow */}
            <div 
                className={clsx(
                    "absolute w-2 h-2 bg-slate-900 border-slate-700 rotate-45",
                    position === 'top' && "bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b",
                    position === 'bottom' && "top-[-5px] left-1/2 -translate-x-1/2 border-l border-t",
                    position === 'left' && "right-[-5px] top-1/2 -translate-y-1/2 border-r border-t",
                    position === 'right' && "left-[-5px] top-1/2 -translate-y-1/2 border-l border-b"
                )} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};