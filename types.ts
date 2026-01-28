
export interface ChordData {
  id: string;
  name: string; 
  beats: number; 
  fingering: number[]; // Fret numbers
  fingers?: (string | null)[]; 
  strummingPattern?: StrummingPattern;
  section?: string; // e.g. "Intro", "Verse", "Chorus"
}

export type StrummingPattern = 'ONCE' | 'DOWN' | 'DU' | 'DDU' | 'FOLK';

export interface PlaybackState {
  isPlaying: boolean;
  currentChordIndex: number;
  bpm: number;
}

export interface GenerateRequest {
  prompt: string;
  style?: string;
}

export interface RiffNote {
  string: number;
  fret: number;
  beat: number;
  duration: number;
}

export interface RiffData {
  id: string;
  name: string;
  notes: RiffNote[];
  bpm: number;
}

export interface ProgressionVariation {
  name: string;
  description: string;
  chords: ChordData[];
}

export interface AnalysisResult {
  analysis: string;
  variations: ProgressionVariation[];
}

export type BackingTrackStyle = 'ROCK' | 'JAZZ' | 'FUNK' | 'BLUES' | 'REGGAE' | 'LOFI' | 'METAL' | 'COUNTRY' | 'LATIN';

export interface SavedProgression {
  id: string;
  name: string;
  date: number;
  bpm: number;
  style: BackingTrackStyle;
  chords: ChordData[];
  lyrics?: string;
}

export type InstrumentType = 'master' | 'guitar' | 'bass' | 'drums' | 'lead' | 'vocals';
export type AmpModel = 'CLEAN' | 'TWEED' | 'CITRUS' | 'METAL' | 'BRITISH' | 'PLEXI' | 'BOUTIQUE' | 'ACOUSTIC_SIM';

export interface GuitarEffects {
  ampModel: AmpModel;
  eq: { low: number; mid: number; high: number };
  distortion: number;
  chorus: number;
  reverb: number;
  delay: number;
  masterGain: number;
  noiseGateThreshold?: number; // Added for feedback control
}

export interface AudioClip {
    id: string;
    trackId: string; // Lien avec la piste DAW
    type: 'RECORDING' | 'IMPORT';
    url: string;
    name: string;
    startBeat: number; // Position on timeline
    duration: number; // Duration in beats
    offset: number; // Start offset within the audio file
    muted: boolean;
    color: string;
}
