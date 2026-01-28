
import { ChordData } from './types';

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const getNoteIndex = (note: string) => {
  const sharpIndex = NOTES_SHARP.indexOf(note);
  if (sharpIndex !== -1) return sharpIndex;
  return NOTES_FLAT.indexOf(note);
};

const transposeRoot = (root: string, semitones: number): string => {
  const index = getNoteIndex(root);
  if (index === -1) return root;
  
  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  return NOTES_SHARP[newIndex]; 
};

export const transposeChord = (chord: ChordData, semitones: number): ChordData | null => {
  // 1. Transpose Fingering
  let newFingering: number[] | undefined;
  
  if (chord.fingering) {
    newFingering = chord.fingering.map(fret => {
      if (fret === -1) return -1; // Muted stays muted
      return fret + semitones;
    });

    // Validation: Check for physically impossible frets (negative)
    if (newFingering.some(f => f < 0 && f !== -1)) {
      return null;
    }
  }

  // 2. Transpose Name
  const match = chord.name.match(/^([A-G][#b]?)(.*)$/);
  let newName = chord.name;
  
  if (match) {
    const root = match[1];
    const suffix = match[2];
    const newRoot = transposeRoot(root, semitones);
    newName = newRoot + suffix;
  }

  return {
    ...chord,
    name: newName,
    fingering: newFingering || chord.fingering
  };
};
