import { Text, View } from 'react-native';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}

export default function LocationPicker({ height = 220 }: LocationPickerProps) {
  return (
    <View
      style={{ height, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1c1c1e', borderRadius: 8 }}
    >
      <Text style={{ color: '#8e8e93', fontSize: 14 }}>Map not available on web</Text>
    </View>
  );
}
