
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Reorder } from 'framer-motion';
import { ChordCard } from './components/ChordCard';
import { Controls } from './components/Controls';
import { GeminiModal } from './components/GeminiModal';
import { AnalysisModal } from './components/AnalysisModal';
import { LibraryModal } from './components/LibraryModal';
import { MixerModal } from './components/MixerModal';
import { AudioImportModal } from './components/AudioImportModal';
import { LyricsModal } from './components/LyricsModal';
import { PedalboardModal } from './components/PedalboardModal';
import { LavaDashboard } from './components/LavaDashboard'; 
import { TunerModal } from './components/TunerModal'; 
import { PracticeModal } from './components/PracticeModal'; 
import { LooperModal } from './components/LooperModal'; 
import { RiffModal } from './components/RiffModal'; 
import { AnimatedBackground } from './components/AnimatedBackground'; 
import { Visualizer } from './components/Visualizer';
import { WelcomeModal } from './components/WelcomeModal'; 
import { ChordBrowser } from './components/ChordBrowser';
import { SuggestionStrip } from './components/SuggestionStrip';
import { SongbookView } from './components/SongbookView';
import { TutorialOverlay, TutorialStep } from './components/TutorialOverlay';
import { StageMode } from './components/StageMode';
import { CircleOfFifths } from './components/CircleOfFifths'; 
import { SolfegeModal } from './components/SolfegeModal';
import { VibeBlast } from './components/VibeBlast';
import { VisionCoachModal } from './components/VisionCoachModal';
import { Toast, ToastType } from './components/Toast';
import { ChordData, GuitarEffects } from './types';
import { playProgression, stopPlayback, initAudio, updateGuitarEffects } from './services/audioService';
import { Guitar, Plus, Power, LayoutGrid, Camera, Disc, Sparkles } from 'lucide-react';
import { transposeChord } from './utils';

const INITIAL_CHORDS: ChordData[] = [
  { id: '1', name: 'C', beats: 4, fingering: [-1, 3, 2, 0, 1, 0], section: 'Intro', strummingPattern: 'DOWN' },
  { id: '2', name: 'G', beats: 4, fingering: [3, 2, 0, 0, 0, 3], section: 'Intro', strummingPattern: 'DU' },
];

const TUTORIAL_STEPS: TutorialStep[] = [
    { title: "Bienvenue !", desc: "Glissez les accords pour réorganiser votre grille.", position: "center", icon: Guitar, color: "bg-primary" },
    { title: "Vibes IA", desc: "Générez des progressions avec Gemini.", position: "bottom-center", icon: Sparkles, color: "bg-indigo-500" },
    { title: "Coach Vision", desc: "Vérifiez votre position de main via caméra.", position: "top-center", icon: Camera, color: "bg-purple-600" }
];

const GUITAR_PRESETS: Record<string, GuitarEffects> = {
    'ACOUSTIC': { ampModel: 'ACOUSTIC_SIM', eq: { low: 2, mid: 0, high: 4 }, distortion: 0, chorus: 0, reverb: 0.15, delay: 0, masterGain: 0 },
    'CLEAN': { ampModel: 'CLEAN', eq: { low: 0, mid: 0, high: 2 }, distortion: 0, chorus: 0.2, reverb: 0.3, delay: 0.1, masterGain: 0 },
    'ROCK': { ampModel: 'PLEXI', eq: { low: 2, mid: 4, high: 3 }, distortion: 0.6, chorus: 0, reverb: 0.2, delay: 0, masterGain: -2 },
};

function App() {
  const [chords, setChords] = useState<ChordData[]>(INITIAL_CHORDS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(90);
  const [lyrics, setLyrics] = useState("");
  const [guitarEffects, setGuitarEffects] = useState<GuitarEffects>(GUITAR_PRESETS.CLEAN);
  const [activeChordIndex, setActiveChordIndex] = useState<number>(-1);
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [blastTrigger, setBlastTrigger] = useState(0);
  const [coachChord, setCoachChord] = useState<string | null>(null);
  const [toast, setToast] = useState<{msg: string, type: ToastType} | null>(null);
  const isAudioInit = useRef(false);

  const [modals, setModals] = useState({
      welcome: true, gemini: false, analysis: false, library: false,
      mixer: false, import: false, lyrics: false, pedalboard: false,
      dashboard: false, looper: false, browser: false, stage: false, 
      theory: false, solfege: false, coach: false, tutorial: false,
      riff: false, tuner: false, practice: false
  });

  const toggleModal = useCallback((key: string, state: boolean) => {
    setModals(prev => ({ ...prev, [key]: state }));
  }, []);

  const handlePlayPause = async () => {
    if (!isAudioInit.current) {
        await initAudio();
        isAudioInit.current = true;
        updateGuitarEffects(guitarEffects);
    }
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
      setActiveChordIndex(-1);
    } else {
      setIsPlaying(true);
      playProgression(chords, bpm, 
          (i) => {
              setActiveChordIndex(i);
              setBlastTrigger(prev => prev + 1);
          },
          (b) => setActiveBeat(b), 
          () => {
              setIsPlaying(false);
              setActiveChordIndex(-1);
          }
      );
    }
  };

  const onTranspose = useCallback((semitones: number) => {
      const newChords = chords.map(c => transposeChord(c, semitones) || c);
      setChords(newChords);
      setToast({ msg: `Transposé de ${semitones > 0 ? '+' : ''}${semitones}`, type: 'SUCCESS' });
  }, [chords]);

  return (
    <div className="min-h-screen text-slate-100 pb-40 relative overflow-x-hidden bg-background font-sans">
      <AnimatedBackground />
      <VibeBlast trigger={blastTrigger} color="#22c55e" intensity="MED" />

      <header className="p-6 border-b border-slate-800/50 bg-background/50 sticky top-0 z-40 backdrop-blur-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => toggleModal('dashboard', true)} className="p-2 hover:bg-slate-800 rounded-lg text-primary transition-colors">
                <LayoutGrid size={24} />
            </button>
            <h1 className="text-2xl font-black italic select-none tracking-tighter">VIBE<span className="text-primary">CHORD</span></h1>
          </div>
          <div className="flex items-center gap-4">
              <Visualizer isPlaying={isPlaying} />
              <button onClick={() => toggleModal('stage', true)} className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-xs font-bold border border-slate-700">
                  <Power size={14} className="text-red-500" /> MODE SCÈNE
              </button>
          </div>
      </header>

      <main className="max-w-[95rem] mx-auto p-6">
        <SuggestionStrip suggestions={[]} isLoading={false} onAdd={(t) => setChords([...chords, { ...t, id: crypto.randomUUID(), beats: 4 }])} onRefresh={() => {}} isVisible={chords.length > 0} />
        
        <Reorder.Group axis="x" values={chords} onReorder={setChords} className="flex flex-wrap gap-8 justify-center lg:justify-start">
            {chords.map((chord, index) => (
                <Reorder.Item key={chord.id} value={chord}>
                  <ChordCard 
                      chord={chord} 
                      isActive={activeChordIndex === index}
                      activeBeat={activeBeat}
                      index={index}
                      onDelete={() => setChords(chords.filter(c => c.id !== chord.id))}
                      onDuplicate={() => {
                        const nc = [...chords];
                        nc.splice(index + 1, 0, { ...chord, id: crypto.randomUUID() });
                        setChords(nc);
                      }}
                      onOpenCoach={() => { setCoachChord(chord.name); toggleModal('coach', true); }}
                      onEditChord={(field, val) => {
                          const nc = [...chords];
                          nc[index] = { ...nc[index], [field]: val };
                          setChords(nc);
                      }}
                  />
                </Reorder.Item>
            ))}
            <button onClick={() => toggleModal('browser', true)} className="w-44 md:w-52 h-[520px] rounded-2xl border-4 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800 transition-all group">
                <Plus size={48} className="group-hover:scale-110 mb-4" />
                <span className="font-black text-xs uppercase tracking-widest">Ajouter</span>
            </button>
        </Reorder.Group>
      </main>

      <Controls 
        isPlaying={isPlaying} onPlayPause={handlePlayPause} onReset={() => {stopPlayback(); setIsPlaying(false); setActiveChordIndex(-1);}}
        bpm={bpm} setBpm={setBpm} onAddChord={() => toggleModal('browser', true)} onGenerate={() => toggleModal('gemini', true)}
        onUndo={() => {}} onRedo={() => {}} canUndo={false} canRedo={false}
        onOpenMixer={() => toggleModal('mixer', true)} onOpenPedalboard={() => toggleModal('pedalboard', true)}
        onOpenLibrary={() => toggleModal('library', true)} onOpenLyrics={() => toggleModal('lyrics', true)}
        onOpenLooper={() => toggleModal('looper', true)} onOpenTheory={() => toggleModal('theory', true)}
        onTranspose={onTranspose} onAnalyze={() => toggleModal('analysis', true)} onImportAudio={() => toggleModal('import', true)}
      />

      {/* MODALS RENDERING */}
      <VisionCoachModal isOpen={modals.coach} onClose={() => toggleModal('coach', false)} chordName={coachChord || ''} />
      <WelcomeModal isOpen={modals.welcome} onClose={() => toggleModal('welcome', false)} onOpenAI={() => toggleModal('gemini', true)} onLoadDemo={() => setChords(INITIAL_CHORDS)} onStartTutorial={() => toggleModal('tutorial', true)} />
      <TutorialOverlay isOpen={modals.tutorial} onClose={() => toggleModal('tutorial', false)} steps={TUTORIAL_STEPS} />
      <GeminiModal isOpen={modals.gemini} onClose={() => toggleModal('gemini', false)} onSuccess={(c) => setChords(c)} />
      <MixerModal isOpen={modals.mixer} onClose={() => toggleModal('mixer', false)} />
      <PedalboardModal isOpen={modals.pedalboard} onClose={() => toggleModal('pedalboard', false)} currentEffects={guitarEffects} onEffectsChange={setGuitarEffects} />
      <LibraryModal isOpen={modals.library} onClose={() => toggleModal('library', false)} currentChords={chords} currentBpm={bpm} currentStyle="ROCK" currentLyrics={lyrics} onLoad={(c, b, s, l) => { setChords(c); setBpm(b); setLyrics(l); }} />
      <LyricsModal isOpen={modals.lyrics} onClose={() => toggleModal('lyrics', false)} lyrics={lyrics} setLyrics={setLyrics} chords={chords} />
      <LooperModal isOpen={modals.looper} onClose={() => toggleModal('looper', false)} isPlaying={isPlaying} onTogglePlay={handlePlayPause} currentStyle="ROCK" onStyleChange={() => {}} bpm={bpm} chords={chords} />
      <RiffModal isOpen={modals.riff} onClose={() => toggleModal('riff', false)} bpm={bpm} />
      <TunerModal isOpen={modals.tuner} onClose={() => toggleModal('tuner', false)} />
      <PracticeModal isOpen={modals.practice} onClose={() => toggleModal('practice', false)} chords={chords} />
      <AnalysisModal isOpen={modals.analysis} onClose={() => toggleModal('analysis', false)} currentChords={chords} onApplyVariation={setChords} />
      <ChordBrowser isOpen={modals.browser} onClose={() => toggleModal('browser', false)} onAddChord={(t) => setChords([...chords, { ...t, id: crypto.randomUUID(), beats: 4 }])} />
      <StageMode isOpen={modals.stage} onClose={() => toggleModal('stage', false)} currentChord={activeChordIndex !== -1 ? chords[activeChordIndex] : null} nextChord={activeChordIndex !== -1 && activeChordIndex < chords.length - 1 ? chords[activeChordIndex + 1] : null} activeBeat={activeBeat} bpm={bpm} isPlaying={isPlaying} capo={0} />
      <CircleOfFifths isOpen={modals.theory} onClose={() => toggleModal('theory', false)} onAddChord={(t) => setChords([...chords, { ...t, id: crypto.randomUUID(), beats: 4 }])} />
      <LavaDashboard isOpen={modals.dashboard} onClose={() => toggleModal('dashboard', false)} onOpenApp={(id: any) => toggleModal(id, true)} />
      <SolfegeModal isOpen={modals.solfege} onClose={() => toggleModal('solfege', false)} />
      <AudioImportModal isOpen={modals.import} onClose={() => toggleModal('import', false)} currentTrackName={null} onTrackLoaded={() => {}} onChordsTranscribed={setChords} />
      
      {toast && <Toast message={toast.msg} type={toast.type} isVisible={!!toast} onClose={() => setToast(null)} />}
      <SongbookView chords={chords} lyrics={lyrics} bpm={bpm} capo={0} title="Ma Grille VibeChord" />
    </div>
  );
}

export default App;
