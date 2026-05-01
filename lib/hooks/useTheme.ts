import { useColorScheme } from 'react-native';
import { useThemePreference } from '@/lib/stores/theme';

export type ResolvedTheme = 'light' | 'dark';

export function useTheme(): ResolvedTheme {
  const preference = useThemePreference();
  const systemScheme = useColorScheme();

  if (preference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }

  return preference;
}
