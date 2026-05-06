import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-bg p-5">
        <Text className="text-2xl font-bold text-ink mb-4">
          This screen doesn't exist.
        </Text>
        <Link href="/(auth)/welcome">
          <Text className="text-md text-blue font-semibold">
            Go to home screen
          </Text>
        </Link>
      </View>
    </>
  );
}
