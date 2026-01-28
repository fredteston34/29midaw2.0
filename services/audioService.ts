
import * as Tone from 'tone';
import { ChordData, GuitarEffects, InstrumentType, AudioClip, RiffData } from '../types';

const SOUND_BANKS = {
    'ELECTRIC_CLEAN': 'electric_guitar_clean-mp3',
    'ELECTRIC_DIST': 'electric_guitar_distorted-mp3',
    'ACOUSTIC': 'acoustic_guitar_steel-mp3',
    'NYLON': 'nylon_guitar-mp3',
    'JAZZ': 'jazz_guitar-mp3',
    'SYNTH_PAD': 'synth_pad-mp3',
    'PIANO': 'acoustic_grand_piano-mp3',
};

let masterOutput: Tone.Volume | null = null;
let analyser: Tone.Analyser | null = null;
let guitarSampler: Tone.Sampler | null = null;
let guitarVol: Tone.Volume | null = null;
let guitarChainStart: Tone.Gain | null = null;
let isInitializing = false;

let micNode: Tone.UserMedia | null = null;
let tunerAnalyser: Tone.Analyser | null = null;
let ambientPlayer: Tone.Player | null = null;
const dawPlayers = new Map<string, Tone.Player>();

const TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

export const initAudio = async (): Promise<boolean> => {
  if (isInitializing) return true;
  isInitializing = true;

  if (Tone.context.state !== 'running') {
      await Tone.start();
  }
  
  if (!masterOutput) {
      masterOutput = new Tone.Volume(0).toDestination();
      analyser = new Tone.Analyser("fft", 64);
      masterOutput.connect(analyser);
  }

  if (!guitarChainStart) {
      guitarVol = new Tone.Volume(-3).connect(masterOutput);
      guitarChainStart = new Tone.Gain(1).connect(guitarVol);
      await loadSoundBank('ELECTRIC_CLEAN');
  }

  isInitializing = false;
  return true;
};

export const loadSoundBank = async (bankId: keyof typeof SOUND_BANKS): Promise<boolean> => {
    if (!guitarChainStart) return false; 
    return new Promise((resolve) => {
        const newSampler = new Tone.Sampler({
            urls: { "E2": "E2.mp3", "A2": "A2.mp3", "D3": "D3.mp3", "G3": "G3.mp3", "B3": "B3.mp3", "E4": "E4.mp3" },
            baseUrl: `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${SOUND_BANKS[bankId] || SOUND_BANKS['ELECTRIC_CLEAN']}/`,
            onload: () => {
                if (guitarSampler) guitarSampler.dispose();
                guitarSampler = newSampler;
                guitarSampler.connect(guitarChainStart!);
                resolve(true);
            }
        });
    });
};

export const stopPlayback = () => {
    Tone.Transport.stop();
    Tone.Transport.seconds = 0; 
    if (guitarSampler) guitarSampler.releaseAll();
    dawPlayers.forEach(p => p.stop());
};

export const updateDAWClips = async (clips: AudioClip[]) => {
    await initAudio();
    
    // Nettoyage des joueurs qui ne sont plus dans la liste
    const clipIds = new Set(clips.map(c => c.id));
    dawPlayers.forEach((p, id) => {
        if (!clipIds.has(id)) {
            p.dispose();
            dawPlayers.delete(id);
        }
    });

    // Synchronisation des clips
    for (const clip of clips) {
        if (!dawPlayers.has(clip.id)) {
            const player = new Tone.Player({
                url: clip.url,
                onload: () => {
                    player.connect(masterOutput!);
                    player.sync().start(
                        clip.startBeat * Tone.Time("4n").toSeconds(), 
                        clip.offset * Tone.Time("4n").toSeconds()
                    );
                    player.mute = clip.muted;
                }
            });
            dawPlayers.set(clip.id, player);
        } else {
            const p = dawPlayers.get(clip.id);
            if (p) p.mute = clip.muted;
        }
    }
};

export const playProgression = async (
    chords: ChordData[], bpm: number, 
    onChordChange: (index: number) => void, onBeat: (beat: number) => void, onFinish: () => void,
    loop: boolean = false, capo: number = 0
) => {
    await initAudio();
    Tone.Transport.cancel(); 
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.loop = loop;

    let totalBeats = 0;
    chords.forEach((chord, idx) => {
        const chordStartBeat = totalBeats;
        for (let b = 0; b < chord.beats; b++) {
            const absoluteBeat = chordStartBeat + b;
            const beatTime = absoluteBeat * Tone.Time("4n").toSeconds();
            Tone.Transport.schedule((t) => {
                Tone.Draw.schedule(() => {
                    onBeat(b);
                    if (b === 0) onChordChange(idx);
                }, t);
                if (b === 0 || chord.strummingPattern === 'DOWN') {
                    strumChord(chord, t, capo);
                }
            }, beatTime);
        }
        totalBeats += chord.beats;
    });

    if (loop) Tone.Transport.loopEnd = totalBeats * Tone.Time("4n").toSeconds();
    Tone.Transport.schedule((t) => Tone.Draw.schedule(onFinish, t), totalBeats * Tone.Time("4n").toSeconds());
    
    Tone.Transport.start();
};

export const playRiff = async (riff: RiffData, onFinish: () => void) => {
    await initAudio();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = riff.bpm;
    
    riff.notes.forEach(note => {
        const beatTime = note.beat * Tone.Time("4n").toSeconds();
        Tone.Transport.schedule((t) => {
            if (guitarSampler) {
                const noteName = Tone.Frequency(TUNING[note.string]).transpose(note.fret).toNote();
                guitarSampler.triggerAttackRelease(noteName, note.duration * Tone.Time("4n").toSeconds(), t);
            }
        }, beatTime);
    });

    const maxBeat = Math.max(...riff.notes.map(n => n.beat + n.duration), 8);
    Tone.Transport.schedule((t) => {
        Tone.Draw.schedule(onFinish, t);
    }, maxBeat * Tone.Time("4n").toSeconds());

    Tone.Transport.start();
};

const strumChord = (chord: ChordData, time: number, capo: number = 0) => {
    if (!guitarSampler) return;
    chord.fingering.forEach((fret, s) => {
        if (fret !== -1) {
            const note = Tone.Frequency(TUNING[s]).transpose(fret + capo).toNote();
            guitarSampler?.triggerAttackRelease(note, "2n", time + (s * 0.02), 0.7);
        }
    });
};

export const getAnalyserData = () => analyser?.getValue() as Float32Array || null;
export const setInstrumentVolume = (i: InstrumentType, v: number) => {
    if (i === 'guitar' && guitarVol) guitarVol.volume.value = v;
    if (i === 'master' && masterOutput) masterOutput.volume.value = v;
};
export const previewChord = (chord: ChordData) => strumChord(chord, Tone.now());
export const playNote = (s: number, f: number, capo: number = 0) => {
    if (!guitarSampler) return;
    const note = Tone.Frequency(TUNING[s]).transpose(f + capo).toNote();
    guitarSampler.triggerAttackRelease(note, "2n");
};
export const startTuner = async (deviceId?: string) => {
    if (!tunerAnalyser) tunerAnalyser = new Tone.Analyser("fft", 4096);
    if (!micNode) micNode = new Tone.UserMedia();
    await micNode.open(deviceId);
    micNode.connect(tunerAnalyser);
};
export const stopTuner = () => micNode?.close();
export const setAmbientTexture = async (tId: string) => {
    if (ambientPlayer) ambientPlayer.dispose();
    if (tId === 'NONE') return;
    const urls: any = { 'RAIN': 'https://www.soundjay.com/nature/rain-01.mp3' };
    ambientPlayer = new Tone.Player(urls[tId]).toDestination();
    ambientPlayer.loop = true;
    await Tone.loaded();
    ambientPlayer.start();
};
export const updateGuitarEffects = (e: any) => {};
export const getAvailableAudioInputs = async () => [];
export const toggleLiveGuitarInput = async (s: boolean, deviceId?: string) => false;
export const setInputGain = (v: number) => {};
export const startInputRecording = () => {};
export const stopInputRecording = () => {};
export const loadVocalTrack = async (f: any) => {};
export const removeVocalTrack = () => {};
export const getPitch = () => null;
