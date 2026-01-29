
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

// Expanded Amp Models (30+) mapped to DSP Profiles
export type AmpModel = 
  | 'CLEAN_TWIN' | 'CLEAN_JAZZ' | 'CLEAN_BOUTIQUE' | 'CLEAN_MODERN'
  | 'CRUNCH_TWEED' | 'CRUNCH_AC30' | 'CRUNCH_PLEXI' | 'CRUNCH_JCM800' | 'CRUNCH_ORANGE'
  | 'HIGH_RECTO' | 'HIGH_5150' | 'HIGH_DIEZEL' | 'HIGH_SLO' | 'HIGH_INVADER'
  | 'METAL_MODERN' | 'METAL_DJENT' | 'METAL_DOOM'
  | 'ACOUSTIC_DREAD' | 'ACOUSTIC_JUMBO' | 'ACOUSTIC_NYLON'
  | 'BASS_SVT' | 'BASS_B15';

export type PickupType = 'OFF' | 'SINGLE_COIL' | 'HUMBUCKER' | 'P90' | 'ACTIVE' | 'ACOUSTIC';

export interface AmpSettings {
    model: AmpModel;
    gain: number;
    bass: number;
    mid: number;
    treble: number;
    presence: number;
    volume: number;
    cabModel: string;
}

export interface GuitarEffects {
  // Global Input
  noiseGateThreshold: number;
  guitarMatch: {
      enabled: boolean;
      source: PickupType;
      target: PickupType;
  };

  // Dual Path Routing
  routingMode: 'SINGLE' | 'DUAL_PARALLEL';
  pathAMix: number; // 0 to 1
  pathBMix: number; // 0 to 1

  // Path A
  pathA: {
      enabled: boolean;
      amp: AmpSettings;
      drive: number; // Boost pedal
  };

  // Path B (Optional)
  pathB: {
      enabled: boolean;
      amp: AmpSettings;
      drive: number;
  };

  // Post FX (Shared)
  postFx: {
      chorus: { enabled: boolean; depth: number; rate: number; mix: number };
      delay: { enabled: boolean; time: string; feedback: number; mix: number };
      reverb: { enabled: boolean; decay: number; mix: number };
      eq: { enabled: boolean; low: number; mid: number; high: number };
      order?: string[]; // ['chorus', 'delay', 'reverb', 'eq']
  };

  masterGain: number;
  
  // Legacy support for older components (optional)
  ampModel?: AmpModel; 
  distortion?: number;
  eq?: { low: number; mid: number; high: number };
  chorus?: number;
  reverb?: number;
  delay?: number;
}

export type PresetCategory = 'CLEAN' | 'CRUNCH' | 'HIGH_GAIN' | 'AMBIENT' | 'BASS';

export interface AmpPreset {
    id: string;
    name: string;
    category: PresetCategory;
    author: string;
    date: number;
    effects: GuitarEffects;
}

export interface AudioClip {
    id: string;
    trackId: string; 
    type: 'RECORDING' | 'IMPORT';
    url: string;
    name: string;
    startBeat: number; 
    duration: number; 
    offset: number; 
    muted: boolean;
    color: string;
}
