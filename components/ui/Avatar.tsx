import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/hooks/useTheme';

export interface AvatarProps {
  name: string;
  size?: number;
  uri?: string;
}

const gradients = {
  light: ['#0A0A0A', '#2C2C2E'] as const,
  dark: ['#3A3A3C', '#48484A'] as const,
};

export default function Avatar({ name, size = 40, uri }: AvatarProps) {
  const theme = useTheme();
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const radius = size * 0.35;
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: 'hidden' as const,
    flexShrink: 0,
  };

  if (uri) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <LinearGradient
        colors={[...gradients[theme]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.75, y: 0.85 }}
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text
          style={{ fontSize: size * 0.34 }}
          className="text-white font-bold tracking-[0.3px]"
        >
          {initials}
        </Text>
      </LinearGradient>
    </View>
  );
}
