import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { toast } from '@/lib/stores/toast';
import type { RNFile } from '@/lib/api/auth';

export type PickImageSource = 'library' | 'camera';

export type PickImageOptions = {
  source: PickImageSource;
  aspect?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
  // Delay to let any host modal animate out before launching the system picker.
  // Overlapping presentations silently no-op on iOS/Android.
  presentDelayMs?: number;
  fileNamePrefix?: string;
};

const assetToFile = (
  a: ImagePicker.ImagePickerAsset,
  prefix: string,
): RNFile => {
  const ext = a.uri.split('.').pop() ?? 'jpg';
  return {
    uri: a.uri,
    type: a.mimeType ?? `image/${ext}`,
    name: `${prefix}.${ext}`,
  };
};

export async function pickImage(
  options: PickImageOptions,
): Promise<RNFile | null> {
  const {
    source,
    aspect = [1, 1],
    quality = 0.8,
    allowsEditing = true,
    presentDelayMs = Platform.OS === 'ios' ? 400 : 250,
    fileNamePrefix = 'image',
  } = options;

  if (presentDelayMs > 0) {
    await new Promise((r) => setTimeout(r, presentDelayMs));
  }

  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast.error('Camera permission is required');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing,
      aspect,
      quality,
    });
    if (result.canceled || !result.assets[0]) return null;
    return assetToFile(result.assets[0], fileNamePrefix);
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    toast.error('Photo library permission is required');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing,
    aspect,
    quality,
  });
  if (result.canceled || !result.assets[0]) return null;
  return assetToFile(result.assets[0], fileNamePrefix);
}
