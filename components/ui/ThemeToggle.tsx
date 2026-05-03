import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { useSetThemePreference } from '@/lib/stores/theme';

export default function ThemeToggle() {
  const theme = useTheme();
  const setPreference = useSetThemePreference();
  const isDark = theme === 'dark';

  const toggle = () => setPreference(isDark ? 'light' : 'dark');

  return (
    <Pressable
      onPress={toggle}
      className="flex-row items-center justify-between py-4 px-0 active:opacity-70"
      accessibilityRole="switch"
      accessibilityState={{ checked: !isDark }}
      accessibilityLabel="Light mode"
    >
      <View className="flex-row items-center gap-3">
        <View className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Text className="text-lg">{isDark ? '🌙' : '☀️'}</Text>
        </View>
        <Text className="text-base font-medium text-gray-900 dark:text-white">
          Light Mode
        </Text>
      </View>

      <View
        className={`w-12 h-6 rounded-full justify-center px-1 ${
          isDark ? 'bg-gray-600' : 'bg-blue-500'
        }`}
      >
        <View
          className={`w-4 h-4 rounded-full bg-white shadow-sm ${
            isDark ? 'self-start' : 'self-end'
          }`}
        />
      </View>
    </Pressable>
  );
}
