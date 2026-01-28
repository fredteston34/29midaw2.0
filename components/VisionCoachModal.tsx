
import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, Sparkles, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import { analyzeHandPosture } from '../services/geminiService';

interface VisionCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  chordName: string;
}

export const VisionCoachModal: React.FC<VisionCoachModalProps> = ({ isOpen, onClose, chordName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !image) startCamera();
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const data = canvas.toDataURL('image/jpeg');
      setImage(data);
      stopCamera();
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsLoading(true);
    const base64 = image.split(',')[1];
    const result = await analyzeHandPosture(base64, chordName);
    setFeedback(result);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 flex flex-col gap-6 shadow-2xl">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-purple-400 flex items-center gap-2 uppercase tracking-widest"><Camera size={20}/> Vision Coach</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
        </div>

        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border-2 border-slate-800">
            {!image ? (
                <>
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <button onClick={capture} className="absolute bottom-4 left-1/2 -translate-x-1/2 p-4 bg-white text-black rounded-full shadow-xl active:scale-90 transition-all"><Camera size={24}/></button>
                </>
            ) : (
                <img src={image} className="w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>

        {image && !feedback && (
            <button 
                onClick={handleAnalyze} 
                disabled={isLoading}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="animate-spin"/> : <Sparkles size={20}/>} {isLoading ? "ANALYSE EN COURS..." : "ANALYSER MA POSITION"}
            </button>
        )}

        {feedback && (
            <div className="bg-slate-800 p-4 rounded-xl border border-purple-500/30 animate-in fade-in slide-in-from-bottom">
                <div className="flex items-center gap-2 text-purple-400 font-bold mb-2"><CheckCircle2 size={16}/> Verdict Pro</div>
                <p className="text-sm text-slate-300 leading-relaxed italic">"{feedback}"</p>
                <button onClick={() => {setImage(null); setFeedback(null); startCamera();}} className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white"><RotateCcw size={12}/> Réessayer</button>
            </div>
        )}

        <p className="text-[10px] text-slate-500 text-center uppercase font-bold tracking-widest">Photographiez votre main sur le manche pour {chordName}</p>
      </div>
    </div>
  );
};
