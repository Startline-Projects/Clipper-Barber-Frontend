import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth.store';

export default function RootIndex() {
  const accessToken = useAuthStore((s) => s.accessToken);

  if (accessToken) {
    return <Redirect href="/(app)/(tabs)/today" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
