
import { GoogleGenAI, Type } from "@google/genai";
import { ChordData, AnalysisResult, GuitarEffects } from "../types";
import { ChordTemplate } from "./chordDictionary";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is missing.");
  return new GoogleGenAI({ apiKey });
};

const PRO_MODEL_ID = "gemini-3-pro-preview";
const VISION_MODEL_ID = "gemini-3-pro-image-preview";
const FLASH_MODEL_ID = "gemini-3-flash-preview";

// Fix: Analyzes hand posture from an image using vision capabilities
export const analyzeHandPosture = async (base64Image: string, chordName: string): Promise<string> => {
  try {
    // Fix: Mandatory API key selection for Gemini 3 Pro Image models
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    const ai = getAiClient();
    // Fix: Using the correct contents: { parts: [...] } format for multimodal
    const response = await ai.models.generateContent({
      model: VISION_MODEL_ID,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: `Tu es un professeur de guitare expert. Analyse cette photo de ma main jouant l'accord de ${chordName}. 
            Donne des conseils précis sur : 1. La position du pouce. 2. L'angle des doigts. 3. Les cordes qui pourraient friser. 
            Réponds de manière concise et encourageante en français.`
          }
        ]
      }
    });
    return response.text || "Désolé, je n'ai pas pu analyser la photo.";
  } catch (error: any) {
    console.error("Vision Error:", error);
    // Fix: Reset key if requested entity was not found
    if (error.message?.includes("Requested entity was not found.") && typeof window !== 'undefined' && (window as any).aistudio) {
       await (window as any).aistudio.openSelectKey();
    }
    return "Erreur d'analyse de l'image.";
  }
};

// Fix: Generates a chord progression and guitar effects based on a text prompt
export const generateChordProgression = async (prompt: string): Promise<{ chords: ChordData[], effects: GuitarEffects }> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: PRO_MODEL_ID,
    contents: `Génère une progression d'accords pour guitare: "${prompt}". Retourne du JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          progression: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                beats: { type: Type.INTEGER },
                fingering: { type: Type.ARRAY, items: { type: Type.INTEGER } }
              },
              required: ["name", "beats", "fingering"]
            }
          },
          soundSettings: {
            type: Type.OBJECT,
            properties: {
              distortion: { type: Type.NUMBER },
              chorus: { type: Type.NUMBER },
              reverb: { type: Type.NUMBER },
              delay: { type: Type.NUMBER },
              masterGain: { type: Type.NUMBER }
            },
            required: ["distortion", "chorus", "reverb", "delay", "masterGain"]
          }
        },
        required: ["progression", "soundSettings"]
      }
    }
  });

  const raw = JSON.parse(response.text);
  return {
    chords: raw.progression.map((c: any) => ({ ...c, id: crypto.randomUUID(), strummingPattern: 'ONCE' })),
    effects: { ...raw.soundSettings, ampModel: 'CLEAN', eq: { low: 0, mid: 0, high: 0 } }
  };
};

// Fix: Suggests next chords for a given sequence
export const getNextChordSuggestions = async (currentChords: ChordData[]): Promise<ChordTemplate[]> => {
  try {
    const ai = getAiClient();
    const chordNames = currentChords.map(c => c.name).join(', ');
    const response = await ai.models.generateContent({
      model: FLASH_MODEL_ID,
      contents: `Suggère 4 prochains accords pour: [${chordNames}]. Retourne un tableau JSON d'objets {name, fingering}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              fingering: { type: Type.ARRAY, items: { type: Type.INTEGER } }
            },
            required: ["name", "fingering"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch { return []; }
};

// Fix: Analyzes the current chord progression and suggests variations
export const analyzeChordProgression = async (chords: ChordData[]): Promise<AnalysisResult> => {
  const ai = getAiClient();
  const chordNames = chords.map(c => c.name).join(' - ');
  const response = await ai.models.generateContent({
    model: FLASH_MODEL_ID,
    contents: `Analyse cette progression d'accords : [${chordNames}]. 
    Donne une brève analyse harmonique et suggère 3 variations intéressantes (même structure, accords différents).
    Retourne du JSON correspondant à l'interface AnalysisResult.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING },
          variations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                chords: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      beats: { type: Type.INTEGER },
                      fingering: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                    },
                    required: ["name", "beats", "fingering"]
                  }
                }
              },
              required: ["name", "description", "chords"]
            }
          }
        },
        required: ["analysis", "variations"]
      }
    }
  });

  const data = JSON.parse(response.text);
  data.variations.forEach((v: any) => {
    v.chords = v.chords.map((c: any) => ({ ...c, id: crypto.randomUUID(), strummingPattern: 'ONCE' }));
  });
  return data;
};

// Fix: Transcribes chords from an audio file using multimodal capabilities
export const transcribeChordsFromAudio = async (base64: string, mimeType: string): Promise<ChordData[]> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL_ID,
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: "Transcris les accords de cette piste audio. Retourne un tableau JSON d'objets avec 'name', 'beats' et 'fingering' (tableau de 6 entiers)." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            beats: { type: Type.INTEGER },
            fingering: { type: Type.ARRAY, items: { type: Type.INTEGER } }
          },
          required: ["name", "beats", "fingering"]
        }
      }
    }
  });
  const raw = JSON.parse(response.text);
  return raw.map((c: any) => ({ ...c, id: crypto.randomUUID(), strummingPattern: 'ONCE' }));
};

// Fix: Generates lyrics based on chords and a topic
export const generateLyrics = async (chords: ChordData[], topic: string): Promise<string> => {
  const ai = getAiClient();
  const chordProg = chords.map(c => c.name).join(', ');
  const response = await ai.models.generateContent({
    model: PRO_MODEL_ID,
    contents: `Écris les paroles d'une chanson basée sur cette progression d'accords : [${chordProg}]. Sujet : ${topic}. Réponds en français.`,
  });
  return response.text || "";
};

// Fix: Finds rhymes for a specific word
export const findRhymes = async (word: string): Promise<string[]> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL_ID,
    contents: `Donne 10 rimes riches pour le mot : "${word}". Retourne uniquement un tableau JSON de chaînes de caractères.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text);
};
