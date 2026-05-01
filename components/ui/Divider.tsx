import { View } from 'react-native';

interface DividerProps {
  inset?: boolean;
}

export default function Divider({ inset }: DividerProps) {
  return (
    <View
      className={`h-px bg-separator ${inset ? 'ml-4' : ''}`}
    />
  );
}
