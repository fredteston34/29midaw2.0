
// Utilities for Music Theory mapping

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STRING_TUNING = ['E', 'A', 'D', 'G', 'B', 'E']; // Standard Tuning

// Normalize notes to Sharps for easy comparison
export const normalizeNote = (note: string): string => {
    if (!note) return '';
    let n = note.trim();
    
    // Fix: Only treat as flat if it contains 'b' or '♭' NOT if the note is 'B'
    if (n.length > 1 && (n.includes('b') || n.includes('♭'))) {
        const root = n.charAt(0).toUpperCase();
        const rootIdx = NOTES.indexOf(root);
        // Move back one semitone for flat
        const newIdx = (rootIdx - 1 + 12) % 12;
        return NOTES[newIdx];
    }
    
    return n.toUpperCase().replace('♯', '#');
};

export const getNoteIndex = (note: string) => NOTES.indexOf(normalizeNote(note));

export interface FretPosition {
    string: number; // 0-5 (Low E to High e)
    fret: number;   // 0-12+
    note: string;
    interval: string; // 'R' (Root), '3', '5', '7', etc.
    isChordTone: boolean;
}

export const getFretboardMap = (chordName: string, scaleType: 'PENTATONIC' | 'CHORD_TONES' = 'CHORD_TONES'): FretPosition[] => {
    const match = chordName.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return [];
    
    const root = normalizeNote(match[1]);
    const suffix = match[2] || '';
    
    const rootIdx = NOTES.indexOf(root);
    const isMinor = suffix.includes('m') && !suffix.includes('maj');
    
    let intervals: number[] = [];
    
    if (scaleType === 'CHORD_TONES') {
        intervals.push(0); // Root
        if (isMinor) intervals.push(3); else intervals.push(4); // 3rd
        intervals.push(7); // 5th
        if (suffix.includes('maj7')) intervals.push(11);
        else if (suffix.includes('7')) intervals.push(10);
    } else {
        // Pentatonic
        intervals = isMinor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9];
    }

    const positions: FretPosition[] = [];

    STRING_TUNING.forEach((stringNote, stringIdx) => {
        const stringBaseIdx = NOTES.indexOf(stringNote);
        for (let fret = 0; fret <= 15; fret++) {
            const currentNoteIdx = (stringBaseIdx + fret) % 12;
            const distance = (currentNoteIdx - rootIdx + 12) % 12;
            
            if (intervals.includes(distance)) {
                let iName = '';
                if (distance === 0) iName = 'R';
                else if (distance === 3) iName = 'b3';
                else if (distance === 4) iName = '3';
                else if (distance === 7) iName = '5';
                else if (distance === 10) iName = 'b7';
                else if (distance === 11) iName = '7';

                positions.push({
                    string: stringIdx,
                    fret: fret,
                    note: NOTES[currentNoteIdx],
                    interval: iName,
                    isChordTone: [0, 3, 4, 7, 10, 11].includes(distance)
                });
            }
        }
    });
    return positions;
};

export const getScaleName = (chordName: string, scaleType: 'PENTATONIC' | 'CHORD_TONES' = 'CHORD_TONES'): string => {
    const match = chordName.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return '';
    const root = match[1];
    const suffix = match[2] || '';
    const isMinor = suffix.includes('m') && !suffix.includes('maj');

    if (scaleType === 'PENTATONIC') {
        return `${root} ${isMinor ? 'Minor' : 'Major'} Pentatonic`;
    } else {
        return `${chordName} Arpeggio`;
    }
};

export const getRomanNumeral = (chordName: string, keyRootName: string): string => {
    const root = normalizeNote(chordName.match(/^([A-G][#b]?)/)?.[1] || '');
    const keyRoot = normalizeNote(keyRootName.match(/^([A-G][#b]?)/)?.[1] || '');
    if (!root || !keyRoot) return '';

    const semitones = (NOTES.indexOf(root) - NOTES.indexOf(keyRoot) + 12) % 12;
    const isMinor = chordName.includes('m') && !chordName.includes('maj');
    
    let numeral = ['I', 'bII', 'II', 'bIII', 'III', 'IV', 'bV', 'V', 'bVI', 'VI', 'bVII', 'VII'][semitones];
    return isMinor ? numeral.toLowerCase() : numeral;
};

export const analyzeDifficulty = (fingering: number[] | undefined) => {
    if (!fingering) return null;
    const active = fingering.filter(f => f > 0);
    if (active.length === 0) return { label: 'Open', color: 'text-green-400 border-green-400' };
    const min = Math.min(...active);
    const max = Math.max(...active);
    if (fingering.filter(f => f === 0).length === 0 && active.length >= 4) 
        return { label: 'Barre', color: 'text-orange-400 border-orange-400' };
    if (max - min >= 4) return { label: 'Wide', color: 'text-red-400 border-red-400' };
    return { label: 'Open', color: 'text-cyan-400 border-cyan-400' };
};
