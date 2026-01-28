import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Play, FolderHeart } from 'lucide-react';
import { ChordData, BackingTrackStyle, SavedProgression } from '../types';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChords: ChordData[];
  currentBpm: number;
  currentStyle: BackingTrackStyle;
  currentLyrics: string;
  onLoad: (chords: ChordData[], bpm: number, style: BackingTrackStyle, lyrics: string) => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  currentChords,
  currentBpm,
  currentStyle,
  currentLyrics,
  onLoad
}) => {
  const [saves, setSaves] = useState<SavedProgression[]>([]);
  const [newSaveName, setNewSaveName] = useState('');

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('vibechord_library');
    if (stored) {
      try {
        setSaves(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse library", e);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!newSaveName.trim()) return;

    const newProgression: SavedProgression = {
      id: crypto.randomUUID(),
      name: newSaveName.trim(),
      date: Date.now(),
      bpm: currentBpm,
      style: currentStyle,
      chords: currentChords,
      lyrics: currentLyrics
    };

    const updatedSaves = [newProgression, ...saves];
    setSaves(updatedSaves);
    localStorage.setItem('vibechord_library', JSON.stringify(updatedSaves));
    setNewSaveName('');
  };

  const handleDelete = (id: string) => {
    const updatedSaves = saves.filter(s => s.id !== id);
    setSaves(updatedSaves);
    localStorage.setItem('vibechord_library', JSON.stringify(updatedSaves));
  };

  const handleLoad = (prog: SavedProgression) => {
    onLoad(prog.chords, prog.bpm, prog.style, prog.lyrics || '');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-pink-400">
            <FolderHeart size={24} />
            <h2 className="text-xl font-bold text-white">My Library</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Save Current Section */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-6">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Save Current Vibe</label>
          <div className="flex gap-2">
            <input 
              value={newSaveName}
              onChange={(e) => setNewSaveName(e.target.value)}
              placeholder="e.g. Funky Sunday Jam"
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button 
              onClick={handleSave}
              disabled={!newSaveName.trim()}
              className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </div>

        {/* Saved List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {saves.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <p>No saved progressions yet.</p>
              <p className="text-sm">Save your masterpiece above!</p>
            </div>
          ) : (
            saves.map(save => (
              <div key={save.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between group hover:border-pink-500/30 transition-colors">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="text-white font-bold truncate">{save.name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                    <span className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{save.chords.length} chords</span>
                    <span className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{save.bpm} BPM</span>
                    <span className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 capitalize">{save.style.toLowerCase()}</span>
                    <span>{new Date(save.date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleLoad(save)}
                    className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-lg hover:shadow-green-500/20 transition-all"
                    title="Load"
                  >
                    <Play size={18} fill="currentColor" />
                  </button>
                  <button 
                    onClick={() => handleDelete(save.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};