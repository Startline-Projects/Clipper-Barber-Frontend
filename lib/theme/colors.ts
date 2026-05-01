import { useTheme } from '@/lib/hooks/useTheme';

interface Palette {
  ink: string;
  bg: string;
  surface: string;
  card: string;
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  separator: string;
  separatorOpaque: string;
  green: string;
  red: string;
  orange: string;
  purple: string;
  blue: string;
  yellow: string;
  teal: string;
}

const light: Palette = {
  ink: '#0A0A0A',
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#1C1C1E',
  secondary: '#636366',
  tertiary: '#AEAEB2',
  quaternary: '#C7C7CC',
  separator: 'rgba(60,60,67,0.06)',
  separatorOpaque: '#E5E5EA',
  green: '#30D158',
  red: '#FF453A',
  orange: '#FF9F0A',
  purple: '#BF5AF2',
  blue: '#0A84FF',
  yellow: '#FFD60A',
  teal: '#64D2FF',
};

const dark: Palette = {
  ink: '#F5F5F7',
  bg: '#000000',
  surface: '#1C1C1E',
  card: '#2C2C2E',
  primary: '#F5F5F7',
  secondary: '#AEAEB2',
  tertiary: '#636366',
  quaternary: '#48484A',
  separator: 'rgba(255,255,255,0.08)',
  separatorOpaque: '#38383A',
  green: '#30D158',
  red: '#FF453A',
  orange: '#FF9F0A',
  purple: '#BF5AF2',
  blue: '#0A84FF',
  yellow: '#FFD60A',
  teal: '#64D2FF',
};

export type SemanticColors = Palette;
export type ColorToken = keyof Palette;

const palettes = { light, dark } as const;

export function useColors(): SemanticColors {
  const theme = useTheme();
  return palettes[theme];
}

export { light as lightColors, dark as darkColors };
