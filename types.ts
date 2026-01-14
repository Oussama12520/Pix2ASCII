
export type RenderMode = 'standard' | 'braille' | 'blocks' | 'geometric';

export interface ConversionSettings {
  width: number;
  contrast: number;
  brightness: number;
  sharpness: number;
  characters: string;
  isColor: boolean;
  isInverted: boolean;
  renderMode: RenderMode;
  useAiPalette: boolean;
  zoom: number;
}

export interface AiSuggestion {
  palette: string;
  renderMode: RenderMode;
  description: string;
  recommendedWidth: number;
  artisticStyle: string;
}
