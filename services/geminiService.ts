
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryGenre, Language, StoryGenerationResponse, AgeGroup, LanguageTone } from "../types";

// ==========================================
//  KEY ROTATION ENGINE (Supports 2+ Keys)
// ==========================================
const getGeminiKeys = (): string[] => {
    let envKeys = "";
    try {
        const metaEnv = (import.meta as any).env;
        envKeys = metaEnv?.VITE_GEMINI_API_KEYS || metaEnv?.GEMINI_API_KEY || "";
    } catch (e) {
        console.error("Meta environment lookup fallback", e);
    }
        
    try {
        if (!envKeys && typeof process !== 'undefined' && process.env) {
            envKeys = (process.env as any).VITE_GEMINI_API_KEYS || (process.env as any).GEMINI_API_KEYS || (process.env as any).GEMINI_API_KEY || "";
        }
    } catch (e) {
        console.error("Environment key lookup failed", e);
    }

    if (typeof envKeys !== 'string') envKeys = String(envKeys);
    if (envKeys === 'undefined' || envKeys === 'null' || !envKeys) envKeys = "";

    const keys = envKeys.split(',').map(k => k.trim().replace(/['"]/g, '')).filter(k => k.length > 5 && k !== 'undefined');

    const defaults = [
      "AIzaSyDM0-uHXjX_LYwOLcs_j9virMFUL3eX2Xs", // Requested default
      "AIzaSyAMdJJiItIVmN3zjzWqhZZX94cL8PzGJ7M",
      "AIzaSyAqaqCaDHw2LQaYIke5CJ8ctM4oevspRig",
      "AIzaSyApBrvFBVOGsyzTKxJ5eBts70Hy6VMslp0"
    ].filter(Boolean);

    if (keys.length > 0) {
        return Array.from(new Set([...keys, ...defaults]));
    }
    return defaults;
};

const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = 1,
  delay: number = 1500
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
};

/**
 * Executes operation with automatic rotation between keys on ANY failure.
 */
async function runWithFallback<T>(operation: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  const availableKeys = Array.from(new Set(getGeminiKeys()));
  let lastError: any;

  for (let i = 0; i < availableKeys.length; i++) {
    try {
      return await withRetry(async () => {
        const ai = new GoogleGenAI({ apiKey: availableKeys[i] });
        return await operation(ai);
      });
    } catch (e: any) {
      lastError = e;
      console.warn(`[Node Rotation] Error with key #${i + 1} (${e?.message || e}): Switching node...`);
      if (i < availableKeys.length - 1) {
        continue;
      }
    }
  }
  throw lastError || new Error("All AI Laboratory Nodes are currently exhausted. Try again in 1 minute.");
}

export const generateTracingWords = async (prompt: string, count: number = 3): Promise<string[]> => {
  return await runWithFallback(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Based on the topic: "${prompt}", generate exactly ${count} educational vocabulary words suitable for kids. Return JSON with 'words' array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { words: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["words"]
        }
      }
    });
    return JSON.parse(response.text || '{"words":[]}').words;
  });
};

export const generateWordSearch = async (words: string[], level: number): Promise<string[][]> => {
  return await runWithFallback(async (ai) => {
    const gridSize = 8 + Math.floor(level);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Create a word search grid of size ${gridSize}x${gridSize}. 
      Include these words: ${words.join(', ')}. 
      Level ${level} difficulty.
      Return JSON with 'grid' property as a 2D array of uppercase characters.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grid: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          },
          required: ["grid"]
        }
      }
    });
    const result = JSON.parse(response.text || '{"grid":[]}');
    return result.grid;
  });
};

export const generateObjectHint = async (imageUri: string, items: string[]): Promise<string> => {
  return await runWithFallback(async (ai) => {
    const base64Data = imageUri.includes(',') ? imageUri.split(',')[1] : imageUri;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Data
          }
        },
        {
          text: `This is a hidden object scene. The user is looking for these items: ${items.join(', ')}. Pick ONE item and describe its exact location in the image in a friendly, helpful way. Keep it concise.`
        }
      ]
    });
    return response.text || "I can't quite see the objects right now. Try looking near the center!";
  });
};

export const generateBookStory = async (
  titleHint: string, genre: StoryGenre, ageGroup: AgeGroup, level: number,
  characters: string, setting: string, pageCount: number, wordsPerPage: number,
  language: Language, tone: LanguageTone, contextFiles: any[] = [], heroAvatars: string[] = [],
  vocabularyEnabled: boolean = false, startPage: number = 1
): Promise<StoryGenerationResponse> => {
  return await runWithFallback(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate an engaging kids book or story titled "${titleHint}" in language ${language}. 
      Age focus: ${ageGroup}, Genre: ${genre}, Tone: ${tone}, Vocabulary Level ${level}.
      This is chunk of story containing pages ${startPage} to ${startPage + pageCount - 1} out of a complete book.
      Each page should be about ${wordsPerPage} words.
      Characters description: ${characters || "A young courageous hero"}, Setting: ${setting || "A mystical fantasy land"}.
      If vocabularyEnabled is true, make sure to include rich terms appropriate for kids learning.
      Return the response in a structured JSON schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pageNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  text: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["pageNumber", "text", "imagePrompt"]
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

// =======================================================
//  INDESTRUCTIBLE IMAGE GENERATOR WITH GRAPHIC FALLBACK
// =======================================================
export const generateIllustration = async (prompt: string, heroAvatars: string[] = []): Promise<string> => {
  try {
    return await runWithFallback(async (ai) => {
      // Create a generic or stylized prompt to reduce copyright blocking chances
      const safePrompt = `A stylized, generic vector character inspired by the concept of "${prompt}". Black and white line art coloring book style, clear crisp styling lines, professional illustration.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: safePrompt,
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      const imgPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!imgPart?.inlineData?.data) throw new Error("Image node response empty or blocked by safety filters.");
      return `data:image/png;base64,${imgPart.inlineData.data}`;
    });
  } catch (e) {
    console.warn("Gemini Image Gen failed, executing SVG Drawing Fallback node to keep workbook operational:", e);
    
    // Create a beautiful, printable vector line art SVG template dynamically based on the prompt!
    // This allows the colouring book or quest to always render and look amazing
    const cleanPromptName = prompt.split(',')[0].replace(/STRICT BLACK AND WHITE ONLY|bold line art|coloring book style/gi, '').trim();
    
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <!-- Frame style elements -->
        <rect x="20" y="20" width="460" height="460" rx="15" fill="none" stroke="#000000" stroke-width="4" stroke-dasharray="8 4"/>
        
        <!-- Stars or Sparkles deco -->
        <path d="M 50,55 L 53,45 L 63,42 L 53,39 L 50,29 L 47,39 L 37,42 L 47,45 Z" fill="none" stroke="#000000" stroke-width="2"/>
        <path d="M 440,55 L 443,45 L 453,42 L 443,39 L 440,29 L 437,39 L 427,42 L 437,45 Z" fill="none" stroke="#000000" stroke-width="2"/>
        <path d="M 440,435 L 443,425 L 453,422 L 443,419 L 440,409 L 437,419 L 427,422 L 437,425 Z" fill="none" stroke="#000000" stroke-width="2"/>
        <path d="M 50,435 L 53,425 L 63,422 L 53,419 L 50,409 L 47,419 L 37,422 L 47,425 Z" fill="none" stroke="#000000" stroke-width="2"/>

        <!-- Central Character Silhouette or Sketch-Box for Colouring -->
        <circle cx="250" cy="220" r="90" fill="none" stroke="#000000" stroke-dasharray="3 3" stroke-width="3"/>
        <path d="M 180,310 C 180,260 320,260 320,310 Z" fill="none" stroke="#000000" stroke-width="4"/>
        
        <!-- Cute landscape lines -->
        <path d="M 40,360 Q 250,300 460,360" fill="none" stroke="#000000" stroke-width="3"/>
        <path d="M 40,390 Q 250,340 460,390" fill="none" stroke="#000000" stroke-width="2" stroke-dasharray="5 5"/>

        <text x="250" y="225" font-family="'Inter', Arial, sans-serif" font-size="14" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="2">COLOR ME!</text>
        <text x="250" y="420" font-family="'Inter', Arial, sans-serif" font-size="18" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="1">${cleanPromptName.toUpperCase()}</text>
        <text x="250" y="445" font-family="'Inter', Arial, sans-serif" font-size="10" font-weight="bold" fill="#64748b" text-anchor="middle">Design &amp; Color your own adventure scene</text>
      </svg>
    `;

    const encodedSvg = btoa(unescape(encodeURIComponent(svgContent)));
    return `data:image/svg+xml;base64,${encodedSvg}`;
  }
};

// =======================================================
//  TEXT TO SPEECH SYSTEM WITH BROWSER SPEECH SYNTH FALLBACK
// =======================================================
export const generateTTS = async (text: string, voiceName: string = 'Kore') => {
  try {
    return await runWithFallback(async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    });
  } catch (e) {
    console.warn("Gemini TTS node did not respond, initiating Browser Web Speech synthesis player fallback.", e);
    
    // We register speech trigger dynamically or return a special browser intent marker code!
    // Since we output base64 data, we can intercept and trigger standard Speak browser Synthesis!
    // Simply return the raw text encoded in a browser synthesis fallback marker!
    return `BROWSER_SPEECH_MAPPED_FALLBACK:${btoa(unescape(encodeURIComponent(text)))}`;
  }
};
