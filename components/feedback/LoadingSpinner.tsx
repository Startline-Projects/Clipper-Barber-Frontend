import { ActivityIndicator, View } from 'react-native';
import { useColors } from '@/lib/theme/colors';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
}

export default function LoadingSpinner({ size = 'large' }: LoadingSpinnerProps) {
  const colors = useColors();

  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator size={size} color={colors.tertiary} />
    </View>
  );
}
