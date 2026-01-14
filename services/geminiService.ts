
import { GoogleGenAI, Type } from "@google/genai";
import { AiSuggestion } from "../types";

export const analyzeImageForAscii = async (imageBase64: string): Promise<AiSuggestion> => {
  // Use API_KEY from Vite's environment variables
  const apiKey = import.meta.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set. Please add it to your .env.local file.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64.split(',')[1],
          },
        },
        {
          text: `You are an ASCII Art Master. Analyze this image (likely a cobra or similar complex subject).
          
          1. Detect the primary textures (e.g., diamond scales, smooth skin, sharp fangs).
          2. Recommend a 'palette' of 12 characters from high density to low density.
          3. Choose a 'renderMode': 'standard' (chars), 'braille' (dots), or 'blocks' (Unicode blocks).
          4. Suggest a 'recommendedWidth' (100-250) for maximum detail.
          5. Provide an 'artisticStyle' label (e.g., 'Cyberpunk Neon', 'Old School Terminal', 'Fine-Line Ink').
          
          Return JSON.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          palette: { type: Type.STRING },
          renderMode: { type: Type.STRING, enum: ['standard', 'braille', 'blocks', 'geometric'] },
          description: { type: Type.STRING },
          recommendedWidth: { type: Type.NUMBER },
          artisticStyle: { type: Type.STRING }
        },
        required: ["palette", "renderMode", "description", "recommendedWidth", "artisticStyle"]
      }
    }
  });

  const jsonStr = response.text ?? '{}';
  return JSON.parse(jsonStr) as AiSuggestion;
};
