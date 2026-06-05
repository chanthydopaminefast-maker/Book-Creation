
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
        
        if (!envKeys) {
            envKeys = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEYS || "";
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

function isQuotaError(error: any): boolean {
    const msg = error?.message?.toLowerCase() || "";
    return msg.includes("quota") || msg.includes("429") || msg.includes("resource_exhausted") || msg.includes("limit") || msg.includes("capacity") || msg.includes("balance") || msg.includes("invalid") || msg.includes("key");
}

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
 * Executes operation with automatic rotation between keys on quota exhaustion.
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
      if (isQuotaError(e) && i < availableKeys.length - 1) {
        console.warn(`[Node Rotation] Key #${i + 1} exhausted/invalid. Switching node...`);
        continue;
      }
      throw e;
    }
  }
  throw lastError || new Error("All AI Laboratory Nodes are currently at capacity. Try again later.");
}

export const generateTracingWords = async (prompt: string, count: number = 3): Promise<string[]> => {
  return await runWithFallback(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the topic: "${prompt}", generate exactly ${count} educational words suitable for kids. Return JSON with 'words' array.`,
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
    // Grid size based on level (1-10) -> 10x10 to 18x18
    const gridSize = 8 + Math.floor(level);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a word search grid of size ${gridSize}x${gridSize}. 
      Include these words: ${words.join(', ')}. 
      Level ${level} difficulty (1 is easy/horizontal only, 10 is complex/all directions).
      Return JSON with 'grid' property as a 2D array of characters.`,
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
    const base64Data = imageUri.split(',')[1];
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Data
          }
        },
        {
          text: `This is a hidden object scene. The user is looking for these items: ${items.join(', ')}. Pick ONE item that is moderately difficult to find and describe its exact location in the image in a friendly, helpful way (e.g., "The cat is hiding behind the blue chimney in the top right corner"). Keep it concise.`
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
      model: "gemini-3-pro-preview",
      contents: `Generate a story titled "${titleHint}" in ${language}. Pages ${startPage} to ${startPage + pageCount - 1}. ${wordsPerPage} words/page. Tone: ${tone}. Level ${level}. Return JSON.`,
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
    return JSON.parse(response.text);
  });
};

export const generateIllustration = async (prompt: string, heroAvatars: string[] = []): Promise<string> => {
  return await runWithFallback(async (ai: any) => {
    const interaction = await ai.interactions.create({
      model: 'gemini-3.1-flash-image',
      input: `Digital art: ${prompt}. Professional.`,
      response_modalities: ['image', 'text'],
      generation_config: {
        image_config: { aspect_ratio: "1:1" }
      }
    });

    for (const step of interaction.steps) {
      if (step.type === 'model_output') {
        const imageContent = step.content?.find((c: any) => c.type === 'image');
        if (imageContent && imageContent.data) {
          const mimeType = imageContent.mime_type || 'image/png';
          return `data:${mimeType};base64,${imageContent.data}`;
        }
      }
    }
    throw new Error("Image node response empty.");
  });
};

export const generateTTS = async (text: string, voiceName: string = 'Kore') => {
  return await runWithFallback(async (ai: any) => {
    const interaction = await ai.interactions.create({
      model: 'gemini-3.1-flash-tts-preview',
      input: text,
      response_modalities: ['AUDIO'],
      generation_config: {
        speech_config: {
          voice_config: {
            prebuilt_voice_config: { voice_name: voiceName }
          }
        }
      }
    });

    for (const step of interaction.steps) {
      if (step.type === 'model_output') {
        const audioContent = step.content?.find((c: any) => c.type === 'audio');
        if (audioContent && audioContent.data) {
          return audioContent.data;
        }
      }
    }
    return "";
  });
};
