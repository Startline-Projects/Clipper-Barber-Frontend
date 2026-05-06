import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from '../ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { reverseGeocode, type AddressParts } from '@/lib/api/places';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number, parts?: AddressParts) => void;
  height?: number;
}

const DEFAULT_REGION: Region = {
  latitude: 32.7767,
  longitude: -96.7970,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
  height = 220,
}: LocationPickerProps) {
  const colors = useColors();
  const mapRef = useRef<MapView>(null);
  const [busy, setBusy] = useState(false);
  const lastAnimatedRef = useRef<string>('');

  const hasPin = latitude !== null && longitude !== null;

  useEffect(() => {
    if (!hasPin || !mapRef.current) return;
    const key = `${latitude},${longitude}`;
    if (lastAnimatedRef.current === key) return;
    lastAnimatedRef.current = key;
    mapRef.current.animateToRegion(
      {
        latitude: latitude as number,
        longitude: longitude as number,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      400,
    );
  }, [latitude, longitude, hasPin]);

  const handleMapPress = async (lat: number, lng: number) => {
    setBusy(true);
    try {
      const parts = await reverseGeocode(lat, lng);
      onChange(lat, lng, parts ?? undefined);
    } catch {
      onChange(lat, lng);
    } finally {
      setBusy(false);
    }
  };

  const useCurrentLocation = async () => {
    try {
      setBusy(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location permission needed',
          'Enable location access in Settings to drop a pin at your current location.',
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await handleMapPress(pos.coords.latitude, pos.coords.longitude);
    } catch {
      Alert.alert('Could not get location', 'Try again or tap the map to drop a pin.');
    } finally {
      setBusy(false);
    }
  };

  const initialRegion: Region = hasPin
    ? {
        latitude: latitude as number,
        longitude: longitude as number,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : DEFAULT_REGION;

  return (
    <View>
      <View
        className="w-full rounded-md overflow-hidden border-[1.5px] border-separator-opaque mb-2"
        style={{ height }}
      >
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          onPress={(e) =>
            handleMapPress(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)
          }
        >
          {hasPin && (
            <Marker
              draggable
              coordinate={{
                latitude: latitude as number,
                longitude: longitude as number,
              }}
              onDragEnd={(e) =>
                handleMapPress(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)
              }
              pinColor={colors.red}
            />
          )}
        </MapView>
      </View>

      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={useCurrentLocation}
          disabled={busy}
          className="flex-row items-center gap-2 py-2"
          hitSlop={8}
        >
          <Icon name="location" size={16} color={colors.blue} />
          <Text className="text-base font-semibold text-blue tracking-[-0.1px]">
            {busy ? 'Locating...' : 'Use current location'}
          </Text>
        </Pressable>

        {hasPin && (
          <Text className="text-xs text-tertiary tracking-[-0.05px]">
            {(latitude as number).toFixed(5)}, {(longitude as number).toFixed(5)}
          </Text>
        )}
      </View>

      {!hasPin && (
        <Text className="text-sm text-tertiary leading-[17px] tracking-[-0.05px] mt-1">
          Tap the map or pick an address suggestion to drop a pin.
        </Text>
      )}
    </View>
  );
}
