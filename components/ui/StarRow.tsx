import { Pressable, View } from 'react-native';
import Icon from './Icon';
import { useColors } from '@/lib/theme/colors';

interface StarRowProps {
  value: number;
  size?: number;
  onChange?: (rating: number) => void;
  color?: string;
}

export default function StarRow({
  value,
  size = 18,
  onChange,
  color,
}: StarRowProps) {
  const colors = useColors();
  const filled = color ?? colors.yellow;

  return (
    <View className="flex-row gap-[2px]">
      {[1, 2, 3, 4, 5].map((i) => {
        const isFilled = i <= value;
        const star = (
          <Icon
            name={isFilled ? 'star' : 'starOutline'}
            size={size}
            color={isFilled ? filled : colors.quaternary}
          />
        );

        if (onChange) {
          return (
            <Pressable key={i} onPress={() => onChange(i)} hitSlop={4}>
              {star}
            </Pressable>
          );
        }

        return <View key={i}>{star}</View>;
      })}
    </View>
  );
}
