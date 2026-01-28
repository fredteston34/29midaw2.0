
export interface ChordTemplate {
  name: string;
  fingering: number[];
}

export interface ChordCategory {
  title: string;
  chords: ChordTemplate[];
}

// Map common chords to multiple voicings (Open, Barre, High)
const VOICINGS: Record<string, number[][]> = {
    'C':  [[-1, 3, 2, 0, 1, 0], [8, 10, 10, 9, 8, 8], [-1, -1, 10, 9, 8, 8]], // Open, Barre 8, Triad
    'D':  [[-1, -1, 0, 2, 3, 2], [5, 5, 7, 7, 7, 5], [-1, 5, 7, 7, 7, 5]], // Open, Barre 5
    'E':  [[0, 2, 2, 1, 0, 0], [7, 7, 9, 9, 9, 7], [-1, 7, 9, 9, 9, 7]], // Open, Barre 7
    'F':  [[1, 3, 3, 2, 1, 1], [8, 8, 10, 10, 10, 8], [-1, -1, 3, 2, 1, 1]], // Barre 1, Barre 8
    'G':  [[3, 2, 0, 0, 0, 3], [3, 5, 5, 4, 3, 3], [10, 12, 12, 12, 10, 10]], // Open, Barre 3
    'A':  [[-1, 0, 2, 2, 2, 0], [5, 7, 7, 6, 5, 5], [-1, -1, 7, 6, 5, 5]], // Open, Barre 5
    'B':  [[-1, 2, 4, 4, 4, 2], [7, 9, 9, 8, 7, 7], [-1, -1, 4, 4, 4, 2]], // Barre 2, Barre 7
    
    'Am': [[-1, 0, 2, 2, 1, 0], [5, 7, 7, 5, 5, 5], [-1, -1, 7, 5, 5, 5]],
    'Em': [[0, 2, 2, 0, 0, 0], [7, 7, 9, 9, 8, 7], [-1, 7, 9, 9, 8, 7]],
    'Dm': [[-1, -1, 0, 2, 3, 1], [5, 5, 7, 7, 6, 5], [10, 12, 12, 10, 10, 10]],
    
    'G7': [[3, 2, 0, 0, 0, 1], [3, 5, 3, 4, 3, 3]],
    'C7': [[-1, 3, 2, 3, 1, 0], [8, 10, 8, 9, 8, 8]],
};

export const CHORD_CATEGORIES: ChordCategory[] = [
  {
    title: "Majeurs",
    chords: [
      { name: "C", fingering: [-1, 3, 2, 0, 1, 0] },
      { name: "D", fingering: [-1, -1, 0, 2, 3, 2] },
      { name: "E", fingering: [0, 2, 2, 1, 0, 0] },
      { name: "F", fingering: [1, 3, 3, 2, 1, 1] },
      { name: "G", fingering: [3, 2, 0, 0, 0, 3] },
      { name: "A", fingering: [-1, 0, 2, 2, 2, 0] },
      { name: "B", fingering: [-1, 2, 4, 4, 4, 2] },
    ]
  },
  {
    title: "Mineurs",
    chords: [
      { name: "Cm", fingering: [-1, 3, 5, 5, 4, 3] },
      { name: "Dm", fingering: [-1, -1, 0, 2, 3, 1] },
      { name: "Em", fingering: [0, 2, 2, 0, 0, 0] },
      { name: "Fm", fingering: [1, 3, 3, 1, 1, 1] },
      { name: "Gm", fingering: [3, 5, 5, 3, 3, 3] },
      { name: "Am", fingering: [-1, 0, 2, 2, 1, 0] },
      { name: "Bm", fingering: [-1, 2, 4, 4, 3, 2] },
    ]
  },
  {
    title: "7ème / Dom",
    chords: [
      { name: "C7", fingering: [-1, 3, 2, 3, 1, 0] },
      { name: "D7", fingering: [-1, -1, 0, 2, 1, 2] },
      { name: "E7", fingering: [0, 2, 0, 1, 0, 0] },
      { name: "G7", fingering: [3, 2, 0, 0, 0, 1] },
      { name: "A7", fingering: [-1, 0, 2, 0, 2, 0] },
      { name: "B7", fingering: [-1, 2, 1, 2, 0, 2] },
    ]
  },
  {
    title: "Maj7 / m7",
    chords: [
      { name: "Cmaj7", fingering: [-1, 3, 2, 0, 0, 0] },
      { name: "Gmaj7", fingering: [3, -1, 0, 0, 0, 2] },
      { name: "Fmaj7", fingering: [-1, -1, 3, 2, 1, 0] },
      { name: "Am7", fingering: [-1, 0, 2, 0, 1, 0] },
      { name: "Dm7", fingering: [-1, -1, 0, 2, 1, 1] },
      { name: "Em7", fingering: [0, 2, 0, 0, 0, 0] },
    ]
  },
  {
    title: "Suspendus & Plus",
    chords: [
      { name: "Csus4", fingering: [-1, 3, 3, 0, 1, -1] },
      { name: "Dsus4", fingering: [-1, -1, 0, 2, 3, 3] },
      { name: "Esus4", fingering: [0, 2, 2, 2, 0, 0] },
      { name: "Asus4", fingering: [-1, 0, 2, 2, 3, 0] },
      { name: "Cadd9", fingering: [-1, 3, 2, 0, 3, 0] },
      { name: "Dadd9", fingering: [-1, -1, 0, 2, 5, 2] },
    ]
  }
];

export const getFingeringForChord = (name: string): number[] | null => {
    if (!name) return null;
    let searchName = name.trim().toUpperCase();
    for (const cat of CHORD_CATEGORIES) {
        const match = cat.chords.find(c => c.name.toUpperCase() === searchName);
        if (match) return match.fingering;
    }
    return null;
};

// Returns the next available voicing for a chord
export const getNextVoicing = (name: string, currentFingering: number[]): number[] | null => {
    // Basic root matching to find voicings
    const rootMatch = name.match(/^([A-G][#b]?m?7?)/); 
    const key = rootMatch ? rootMatch[1] : name;
    
    const options = VOICINGS[key] || VOICINGS[name];
    if (!options) return null;

    // Find current index
    const currentStr = JSON.stringify(currentFingering);
    const idx = options.findIndex(opt => JSON.stringify(opt) === currentStr);
    
    if (idx === -1) return options[0]; // Default to first if unknown
    
    return options[(idx + 1) % options.length]; // Cycle next
};

// Return all available voicings for a chord name (for the Browser)
export const getVoicingOptions = (name: string): number[][] => {
    const rootMatch = name.match(/^([A-G][#b]?m?7?)/); 
    const key = rootMatch ? rootMatch[1] : name;
    return VOICINGS[key] || VOICINGS[name] || [];
};
