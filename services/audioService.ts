
import * as Tone from 'tone';
import { ChordData, GuitarEffects, InstrumentType, AudioClip, RiffData, AmpModel, AmpSettings } from '../types';

// --- AUDIO GRAPH NODES ---
let masterOutput: Tone.Volume | null = null;
let masterLimiter: Tone.Limiter | null = null; // Protection
let masterCompressor: Tone.Compressor | null = null; // Studio Magic

let recorder: Tone.Recorder | null = null;
let guitarInput: Tone.UserMedia | null = null;
let inputGate: Tone.Gate | null = null;
let guitarMatchEQ: Tone.EQ3 | null = null; 
let guitarMatchFilter: Tone.Filter | null = null; 

// Splitter / Merger
let pathAGain: Tone.Gain | null = null;
let pathBGain: Tone.Gain | null = null;

// PATH A Nodes
let pathADrive: Tone.Distortion | null = null;
let pathATube: Tone.Chebyshev | null = null;
let pathAEQ: Tone.EQ3 | null = null; 
// PRO FEATURE: Convolution Reverb acting as Cabinet Simulator
// Using native ConvolverNode as Tone.Convolver is deprecated/removed in v14+
let pathACabConvolver: ConvolverNode | null = null; 
let pathACabEq: Tone.EQ3 | null = null; // Post-Cab Mic positioning EQ

// PATH B Nodes
let pathBDrive: Tone.Distortion | null = null;
let pathBTube: Tone.Chebyshev | null = null;
let pathBEQ: Tone.EQ3 | null = null;
let pathBCabConvolver: ConvolverNode | null = null;
let pathBCabEq: Tone.EQ3 | null = null;

// POST FX Nodes
let postChorus: Tone.Chorus | null = null;
let postDelay: Tone.FeedbackDelay | null = null;
let postReverb: Tone.Reverb | null = null;
let postEQ: Tone.EQ3 | null = null;

// PANNING NODES (New)
let guitarPanner: Tone.Panner | null = null;
let backingPanner: Tone.Panner | null = null;

let analyser: Tone.Analyser | null = null;
let guitarSampler: Tone.Sampler | null = null;
let guitarVol: Tone.Volume | null = null;
let isInitializing = false;

let tunerAnalyser: Tone.Analyser | null = null;
let ambientPlayer: Tone.Player | null = null;
let backingTrackPlayer: Tone.Player | null = null;
const dawPlayers = new Map<string, Tone.Player>();

// Standard Tuning frequencies for correct transposition
const TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

const SOUND_BANKS = {
    'ELECTRIC_CLEAN': 'electric_guitar_clean-mp3',
    'ELECTRIC_DIST': 'electric_guitar_distorted-mp3',
    'ACOUSTIC': 'acoustic_guitar_steel-mp3',
    'NYLON': 'nylon_guitar-mp3',
    'JAZZ': 'jazz_guitar-mp3',
    'SYNTH_PAD': 'synth_pad-mp3',
    'PIANO': 'acoustic_grand_piano-mp3',
};

// --- PROCEDURAL CAB IR GENERATOR ---
const generateCabIR = async (type: '1x12' | '2x12' | '4x12' | 'ACOUSTIC'): Promise<AudioBuffer> => {
    const toneBuffer = await Tone.Offline(() => {
        const noise = new Tone.Noise("white").start();
        const envelope = new Tone.AmplitudeEnvelope({
            attack: 0.001,
            decay: type === '4x12' ? 0.3 : 0.15,
            sustain: 0,
            release: 0.1
        }).triggerAttackRelease(0.5);

        // Shaping the frequency response of the cabinet
        const filter = new Tone.Filter();
        const eq = new Tone.EQ3();

        if (type === '4x12') {
            filter.type = "lowpass"; filter.frequency.value = 4000; filter.Q.value = 2;
            eq.low.value = 6; eq.mid.value = -3; eq.high.value = 2;
        } else if (type === '2x12') {
            filter.type = "lowpass"; filter.frequency.value = 6000; filter.Q.value = 1;
            eq.low.value = 2; eq.mid.value = 3; eq.high.value = 4;
        } else if (type === '1x12') {
            filter.type = "bandpass"; filter.frequency.value = 2000; filter.Q.value = 0.8;
            eq.low.value = -5; eq.mid.value = 8; eq.high.value = 0;
        } else {
            filter.type = "peaking"; filter.frequency.value = 150; filter.Q.value = 3;
            eq.low.value = 5; eq.mid.value = -5; eq.high.value = 8;
        }

        noise.connect(envelope);
        envelope.connect(filter);
        filter.connect(eq);
        eq.toDestination();
    }, 0.5);

    // Unwrap the Tone.Buffer to get the native AudioBuffer required by ConvolverNode
    return toneBuffer.get() as AudioBuffer;
};

export const initAudio = async (): Promise<boolean> => {
  if (isInitializing) return true;
  isInitializing = true;

  if (Tone.context.state !== 'running') {
      await Tone.start();
  }
  
  Tone.context.lookAhead = 0.05; 

  if (!masterOutput) {
      // MASTER CHAIN
      masterOutput = new Tone.Volume(0).toDestination();
      masterLimiter = new Tone.Limiter(-1); // Safety
      
      // Init with Studio Magic OFF (Ratio 1 = No compression, Threshold 0)
      // Tone.Compressor does not support 'wet' property directly.
      masterCompressor = new Tone.Compressor({
          threshold: 0,
          ratio: 1,
          attack: 0.003,
          release: 0.25
      });

      analyser = new Tone.Analyser("fft", 64);
      recorder = new Tone.Recorder();
      
      // Wiring Master
      masterCompressor.connect(masterLimiter);
      masterLimiter.connect(masterOutput);
      masterOutput.connect(analyser);
      masterOutput.connect(recorder);

      // --- PANNING ---
      guitarPanner = new Tone.Panner(0);
      backingPanner = new Tone.Panner(0);

      // --- INPUT SECTION ---
      try {
        inputGate = new Tone.Gate({ threshold: -50, attack: 0.05 });
      } catch (e) {
        inputGate = new Tone.Gate(-50, 0.05);
      }
      
      guitarMatchEQ = new Tone.EQ3(0, 0, 0); 
      guitarMatchFilter = new Tone.Filter(2000, "peaking");
      
      // --- DUAL PATH ARCHITECTURE ---
      // PATH A
      pathADrive = new Tone.Distortion(0); pathADrive.oversample = '4x';
      pathATube = new Tone.Chebyshev(2);
      pathAEQ = new Tone.EQ3(0, 0, 0);
      
      // Use Native ConvolverNode
      pathACabConvolver = Tone.context.createConvolver();
      pathACabConvolver.normalize = true;
      
      pathACabEq = new Tone.EQ3(0, 0, 0);
      pathAGain = new Tone.Gain(1);

      // PATH B
      pathBDrive = new Tone.Distortion(0); pathBDrive.oversample = '4x';
      pathBTube = new Tone.Chebyshev(2);
      pathBEQ = new Tone.EQ3(0, 0, 0);
      
      pathBCabConvolver = Tone.context.createConvolver();
      pathBCabConvolver.normalize = true;
      
      pathBCabEq = new Tone.EQ3(0, 0, 0);
      pathBGain = new Tone.Gain(0); 

      // --- POST FX SECTION ---
      postChorus = new Tone.Chorus(4, 2.5, 0.5).start(); postChorus.wet.value = 0;
      postDelay = new Tone.FeedbackDelay("8n", 0.5); postDelay.wet.value = 0;
      postReverb = new Tone.Reverb(1.5); postReverb.wet.value = 0; await postReverb.generate();
      postEQ = new Tone.EQ3(0, 0, 0);

      // --- WIRING ---
      if (inputGate && guitarMatchEQ && guitarMatchFilter) {
        guitarMatchEQ.connect(guitarMatchFilter);
        guitarMatchFilter.connect(inputGate);
        
        // Path A
        inputGate.connect(pathADrive!); 
        pathADrive!.connect(pathATube!); 
        pathATube!.connect(pathAEQ!);
        
        // Tone -> Native Convolver -> Tone
        // Use Tone.connect to handle native nodes if possible or manual connect
        pathAEQ!.connect(pathACabConvolver);
        // Connect Native Node to Tone Node
        Tone.connect(pathACabConvolver, pathACabEq!);
        
        pathACabEq!.connect(pathAGain!);

        // Path B
        inputGate.connect(pathBDrive!); 
        pathBDrive!.connect(pathBTube!); 
        pathBTube!.connect(pathBEQ!);
        
        pathBEQ!.connect(pathBCabConvolver!);
        Tone.connect(pathBCabConvolver!, pathBCabEq!);
        
        pathBCabEq!.connect(pathBGain!);
      }

      // Chain: Amp Path -> Post FX -> Panner -> Master Compressor -> Limiter -> Output
      pathAGain!.connect(postChorus);
      pathBGain!.connect(postChorus);
      postChorus.connect(postDelay);
      postDelay.connect(postReverb);
      postReverb.connect(postEQ);
      postEQ.connect(guitarPanner!);
      guitarPanner!.connect(masterCompressor!);

      // Sampler Input
      guitarVol = new Tone.Volume(-2).connect(guitarMatchEQ!);
      await loadSoundBank('ELECTRIC_CLEAN');
      
      const defaultIR = await generateCabIR('2x12');
      if (pathACabConvolver) pathACabConvolver.buffer = defaultIR;
      if (pathBCabConvolver) pathBCabConvolver.buffer = defaultIR;
  }

  isInitializing = false;
  return true;
};

// ... [Helper functions same as before] ...
const applyGuitarMatch = (source: string, target: string) => {
    if (!guitarMatchEQ || !guitarMatchFilter) return;
    guitarMatchEQ.low.value = 0; guitarMatchEQ.mid.value = 0; guitarMatchEQ.high.value = 0;
    guitarMatchFilter.frequency.value = 2000; guitarMatchFilter.gain.value = 0;
    if (source === 'OFF' || source === target || !target) return;
    if (target === 'HUMBUCKER') {
        guitarMatchEQ.low.value = 4; guitarMatchEQ.mid.value = 2; guitarMatchEQ.high.value = -3;
        guitarMatchFilter.frequency.value = 500; guitarMatchFilter.gain.value = 6;
    } else if (target === 'SINGLE_COIL') {
        guitarMatchEQ.low.value = -3; guitarMatchEQ.mid.value = -2; guitarMatchEQ.high.value = 6;
        guitarMatchFilter.frequency.value = 3500; guitarMatchFilter.gain.value = 4;
    } else if (target === 'ACOUSTIC') {
        guitarMatchEQ.low.value = 4; guitarMatchEQ.mid.value = -12; guitarMatchEQ.high.value = 10;
        guitarMatchFilter.frequency.value = 800; guitarMatchFilter.gain.value = -10;
    }
};

const loadedCabs = { A: '', B: '' };
const applyAmpProfile = async (settings: AmpSettings, path: 'A' | 'B') => {
    const tube = path === 'A' ? pathATube : pathBTube;
    const eq = path === 'A' ? pathAEQ : pathBEQ;
    const cabEq = path === 'A' ? pathACabEq : pathBCabEq;
    const cabConv = path === 'A' ? pathACabConvolver : pathBCabConvolver;
    
    if (!tube || !eq || !cabEq || !cabConv) return;
    
    if (settings.model.includes('CLEAN')) tube.order = 2; 
    else if (settings.model.includes('CRUNCH')) tube.order = 4; 
    else tube.order = 8; 
    
    let baseLow = 0, baseMid = 0, baseHigh = 0;
    switch (settings.model) {
        case 'CLEAN_TWIN': baseMid = -5; baseHigh = 5; break;
        case 'CRUNCH_AC30': baseMid = 3; baseHigh = 8; baseLow = -3; break;
        case 'CRUNCH_PLEXI': baseMid = 6; baseHigh = 3; break;
        case 'HIGH_RECTO': baseLow = 8; baseMid = -4; baseHigh = 4; break;
        case 'METAL_DJENT': baseLow = -2; baseMid = 4; baseHigh = 8; break;
        case 'ACOUSTIC_DREAD': baseLow = 2; baseMid = -10; baseHigh = 12; break;
    }
    eq.low.value = baseLow + (settings.bass * 2);
    eq.mid.value = baseMid + (settings.mid * 2);
    eq.high.value = baseHigh + (settings.treble * 2);

    const targetCab = settings.cabModel || '2x12';
    if (loadedCabs[path] !== targetCab) {
        const irBuffer = await generateCabIR(targetCab as any);
        cabConv.buffer = irBuffer;
        loadedCabs[path] = targetCab;
    }
    cabEq.high.value = (settings.presence * 10); 
};

export const updateGuitarEffects = async (fx: GuitarEffects) => {
    if (!guitarMatchEQ) return;
    if (inputGate) {
        const threshParam = (inputGate as any).threshold;
        if (typeof threshParam === 'object' && 'value' in threshParam) threshParam.value = fx.noiseGateThreshold;
        else (inputGate as any).threshold = fx.noiseGateThreshold;
    }
    if (fx.guitarMatch.enabled) applyGuitarMatch(fx.guitarMatch.source, fx.guitarMatch.target);
    else applyGuitarMatch('OFF', 'OFF');
    
    if (pathAGain) pathAGain.gain.rampTo(fx.routingMode === 'DUAL_PARALLEL' ? fx.pathAMix : 1, 0.1);
    if (pathADrive) pathADrive.distortion = fx.pathA.drive;
    await applyAmpProfile(fx.pathA.amp, 'A');
    
    if (fx.routingMode === 'DUAL_PARALLEL') {
        if (pathBGain) pathBGain.gain.rampTo(fx.pathBMix, 0.1);
        if (pathBDrive) pathBDrive.distortion = fx.pathB.drive;
        await applyAmpProfile(fx.pathB.amp, 'B');
    } else {
        if (pathBGain) pathBGain.gain.rampTo(0, 0.1); 
    }
    
    if (pathAGain && pathBGain && postChorus && postDelay && postReverb && postEQ && masterOutput && guitarPanner) {
        pathAGain.disconnect(); pathBGain.disconnect(); postChorus.disconnect(); postDelay.disconnect(); postReverb.disconnect(); postEQ.disconnect();
        const nodes: Record<string, Tone.AudioNode> = { 'chorus': postChorus, 'delay': postDelay, 'reverb': postReverb, 'eq': postEQ };
        const order = fx.postFx.order || ['chorus', 'delay', 'reverb', 'eq'];
        const firstEffect = nodes[order[0]];
        pathAGain.connect(firstEffect); pathBGain.connect(firstEffect);
        let current = firstEffect;
        for (let i = 1; i < order.length; i++) {
            const next = nodes[order[i]];
            current.connect(next);
            current = next;
        }
        current.connect(guitarPanner);
    }
    if (postChorus) { postChorus.wet.value = fx.postFx.chorus.enabled ? fx.postFx.chorus.mix : 0; postChorus.depth = fx.postFx.chorus.depth; }
    if (postDelay) { postDelay.wet.value = fx.postFx.delay.enabled ? fx.postFx.delay.mix : 0; postDelay.feedback.value = fx.postFx.delay.feedback; }
    if (postReverb) { postReverb.wet.value = fx.postFx.reverb.enabled ? fx.postFx.reverb.mix : 0; postReverb.decay = fx.postFx.reverb.decay; }
    if (postEQ) { postEQ.low.value = fx.postFx.eq.low; postEQ.mid.value = fx.postFx.eq.mid; postEQ.high.value = fx.postFx.eq.high; }
    if (masterOutput) masterOutput.volume.value = fx.masterGain;
};

// ... [Keep standard exports] ...

export const toggleLiveGuitarInput = async (active: boolean, deviceId?: string): Promise<boolean> => {
    if (!active) {
        if (guitarInput) { guitarInput.close(); guitarInput = null; }
        return false;
    }
    try {
        await initAudio();
        guitarInput = new Tone.UserMedia();
        const constraints: MediaTrackConstraints = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
        if (deviceId && typeof deviceId === 'string' && deviceId.trim().length > 0) constraints.deviceId = { exact: deviceId };
        await guitarInput.open(constraints);
        if (guitarMatchEQ) guitarInput.connect(guitarMatchEQ);
        return true;
    } catch (e) { console.error("Failed to open input", e); return false; }
};

export const loadSoundBank = async (bankId: keyof typeof SOUND_BANKS): Promise<boolean> => {
    if (!guitarVol) return false; 
    return new Promise((resolve) => {
        const newSampler = new Tone.Sampler({
            urls: { "E2": "E2.mp3", "A2": "A2.mp3", "D3": "D3.mp3", "G3": "G3.mp3", "B3": "B3.mp3", "E4": "E4.mp3" },
            baseUrl: `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${SOUND_BANKS[bankId] || SOUND_BANKS['ELECTRIC_CLEAN']}/`,
            attack: 0.01, release: 1.5,
            onload: () => {
                if (guitarSampler) guitarSampler.dispose();
                guitarSampler = newSampler;
                guitarSampler.connect(guitarVol!);
                resolve(true);
            }
        });
    });
};

export const setInputGain = (val: number) => {};

// NEW FUNCTIONS FOR MIXER
export const setInstrumentPan = (i: InstrumentType, pan: number) => {
    if (i === 'guitar' && guitarPanner) guitarPanner.pan.rampTo(pan, 0.1);
    if (i === 'vocals' && backingPanner) backingPanner.pan.rampTo(pan, 0.1);
};

export const toggleMasterCompressor = (active: boolean) => {
    // FIX: Manipulate threshold and ratio directly as .wet is not available on Tone.Compressor
    if (masterCompressor) {
        masterCompressor.threshold.rampTo(active ? -20 : 0, 0.5);
        masterCompressor.ratio.rampTo(active ? 4 : 1, 0.5);
    }
};

export const setInstrumentVolume = (i: InstrumentType, v: number) => {
    if (i === 'guitar' && guitarVol) guitarVol.volume.value = v;
    if (i === 'master' && masterOutput) masterOutput.volume.value = v;
    if (i === 'vocals' && backingTrackPlayer) backingTrackPlayer.volume.value = v;
};

// ... [Existing playback engine] ...
export const stopPlayback = () => {
    Tone.Transport.stop(); Tone.Transport.seconds = 0; 
    if (guitarSampler) guitarSampler.releaseAll();
    dawPlayers.forEach(p => p.stop());
    if (backingTrackPlayer) backingTrackPlayer.stop();
};

export const updateDAWClips = async (clips: AudioClip[]) => {
    await initAudio();
    const clipIds = new Set(clips.map(c => c.id));
    dawPlayers.forEach((p, id) => { if (!clipIds.has(id)) { p.dispose(); dawPlayers.delete(id); } });
    for (const clip of clips) {
        if (!dawPlayers.has(clip.id)) {
            const player = new Tone.Player({
                url: clip.url,
                onload: () => {
                    player.connect(masterOutput!);
                    player.sync().start(clip.startBeat * Tone.Time("4n").toSeconds(), clip.offset * Tone.Time("4n").toSeconds());
                    player.mute = clip.muted;
                }
            });
            dawPlayers.set(clip.id, player);
        } else { const p = dawPlayers.get(clip.id); if (p) p.mute = clip.muted; }
    }
};

export const playProgression = async (chords: ChordData[], bpm: number, onChordChange: (index: number) => void, onBeat: (beat: number) => void, onFinish: () => void, loop: boolean = false, capo: number = 0) => {
    await initAudio();
    Tone.Transport.cancel(); Tone.Transport.bpm.value = bpm; Tone.Transport.loop = loop;
    let totalBeats = 0;
    chords.forEach((chord, idx) => {
        const chordStartBeat = totalBeats;
        for (let b = 0; b < chord.beats; b++) {
            const absoluteBeat = chordStartBeat + b;
            const beatTime = absoluteBeat * Tone.Time("4n").toSeconds();
            Tone.Transport.schedule((t) => {
                Tone.Draw.schedule(() => { onBeat(b); if (b === 0) onChordChange(idx); }, t);
                const humanize = (Math.random() * 0.02) - 0.01;
                if (b === 0 || chord.strummingPattern === 'DOWN') strumChord(chord, t + humanize, capo, 'down');
                else if (chord.strummingPattern === 'DU') { strumChord(chord, t + humanize, capo, 'down'); strumChord(chord, t + Tone.Time("8n").toSeconds() + humanize, capo, 'up'); } 
                else if (chord.strummingPattern === 'DDU') { strumChord(chord, t + humanize, capo, 'down'); strumChord(chord, t + Tone.Time("8n").toSeconds() + humanize, capo, 'down'); strumChord(chord, t + Tone.Time("4n").toSeconds() - Tone.Time("16n").toSeconds() + humanize, capo, 'up'); }
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
    Tone.Transport.cancel(); Tone.Transport.bpm.value = riff.bpm;
    riff.notes.forEach(note => {
        const beatTime = note.beat * Tone.Time("4n").toSeconds();
        Tone.Transport.schedule((t) => {
            if (guitarSampler && guitarSampler.loaded) {
                const vel = 0.7 + Math.random() * 0.3;
                const timeShift = (Math.random() * 0.01) - 0.005;
                const noteName = Tone.Frequency(TUNING[note.string]).transpose(note.fret).toNote();
                guitarSampler.triggerAttackRelease(noteName, note.duration * Tone.Time("4n").toSeconds(), t + timeShift, vel);
            }
        }, beatTime);
    });
    const maxBeat = Math.max(...riff.notes.map(n => n.beat + n.duration), 8);
    Tone.Transport.schedule((t) => { Tone.Draw.schedule(onFinish, t); }, maxBeat * Tone.Time("4n").toSeconds());
    Tone.Transport.start();
};

const strumChord = (chord: ChordData, time: number, capo: number = 0, direction: 'down' | 'up' = 'down') => {
    if (!guitarSampler || !guitarSampler.loaded) return;
    const strumSpeed = 0.06 + Math.random() * 0.02; const stringDelay = strumSpeed / 6;
    chord.fingering.forEach((fret, stringIndex) => {
        const playOrderIndex = direction === 'down' ? stringIndex : (5 - stringIndex);
        const actualFret = chord.fingering[stringIndex];
        if (actualFret !== -1) {
            const note = Tone.Frequency(TUNING[stringIndex]).transpose(actualFret + capo).toNote();
            const actualTime = time + (playOrderIndex * stringDelay);
            let velocity = 0.6 + Math.random() * 0.3; if (playOrderIndex < 2) velocity += 0.15; 
            guitarSampler.triggerAttackRelease(note, "1n", actualTime, velocity);
        }
    });
};

export const getAnalyserData = () => analyser?.getValue() as Float32Array || null;
export const previewChord = (chord: ChordData) => strumChord(chord, Tone.now());
export const playNote = (s: number, f: number, capo: number = 0) => {
    if (!guitarSampler) return;
    const note = Tone.Frequency(TUNING[s]).transpose(f + capo).toNote();
    guitarSampler.triggerAttackRelease(note, "2n", Tone.now(), 0.8);
};
export const startTuner = async (deviceId?: string) => {
    if (!tunerAnalyser) tunerAnalyser = new Tone.Analyser("fft", 4096);
    if (guitarInput) { guitarInput.connect(tunerAnalyser); } 
    else { guitarInput = new Tone.UserMedia(); await guitarInput.open(deviceId); guitarInput.connect(tunerAnalyser); }
};
export const stopTuner = () => { if (guitarInput && tunerAnalyser) try { guitarInput.disconnect(tunerAnalyser); } catch(e){} };
export const setAmbientTexture = async (tId: string) => {
    if (ambientPlayer) ambientPlayer.dispose();
    if (tId === 'NONE') return;
    const urls: any = { 'RAIN': 'https://www.soundjay.com/nature/rain-01.mp3', 'VINYL': 'https://www.soundjay.com/misc/sounds/vinyl-record-crackles-01.mp3', 'WIND': 'https://www.soundjay.com/nature/wind-howl-01.mp3' };
    if (urls[tId]) {
        ambientPlayer = new Tone.Player(urls[tId]).toDestination();
        ambientPlayer.loop = true; ambientPlayer.volume.value = -10;
        await Tone.loaded(); ambientPlayer.start();
    }
};
export const getAvailableAudioInputs = async () => { const devices = await navigator.mediaDevices.enumerateDevices(); return devices.filter(d => d.kind === 'audioinput'); };
export const startInputRecording = async () => { await initAudio(); if (recorder && recorder.state !== 'started') recorder.start(); };
export const stopInputRecording = async (): Promise<string | null> => { if (!recorder || recorder.state === 'stopped') return null; const recording = await recorder.stop(); return URL.createObjectURL(recording); };
export const playBackingTrack = async (url: string) => {
    await initAudio();
    if (backingTrackPlayer) backingTrackPlayer.stop();
    // Connect backing track to its panner, then to master
    if (backingPanner && masterCompressor) {
        backingTrackPlayer = new Tone.Player(url).connect(backingPanner);
        backingPanner.connect(masterCompressor);
    } else {
        backingTrackPlayer = new Tone.Player(url).toDestination();
    }
    backingTrackPlayer.loop = true;
    await Tone.loaded(); backingTrackPlayer.start();
};
export const stopBackingTrack = () => { if (backingTrackPlayer) backingTrackPlayer.stop(); };
export const loadVocalTrack = async (f: any) => {}; export const removeVocalTrack = () => {}; export const getPitch = () => null;
