import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#0a0a12]">
      {/* Deep Base Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-[#0f0c29] to-[#0a0a12]" />

      {/* Moving Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1], 
          x: [0, 50, 0], 
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/20 blur-[100px]"
      />
      
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1], 
          x: [0, -30, 0], 
          y: [0, 50, 0],
          opacity: [0.2, 0.4, 0.2] 
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-900/20 blur-[120px]"
      />

      <motion.div 
         animate={{ 
          scale: [1, 1.3, 1], 
          opacity: [0.1, 0.3, 0.1] 
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-emerald-900/10 blur-[80px]"
      />

      {/* Grid Overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{ 
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px' 
        }}
      />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/80" />
    </div>
  );
};