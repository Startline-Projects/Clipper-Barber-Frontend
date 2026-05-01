import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/lib/theme/colors';
import { useStartConversation } from '@/lib/hooks/useConversations';
import { useEffect, useRef } from 'react';

export default function ClientMessageScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const colors = useColors();
  const start = useStartConversation();
  const attempted = useRef(false);

  useEffect(() => {
    if (!clientId || attempted.current) return;
    attempted.current = true;
    start.mutate(clientId, {
      onSuccess: (convo) => {
        router.replace(`/(app)/(tabs)/messages/${convo.id}`);
      },
      onError: () => {
        router.back();
      },
    });
  }, [clientId]);

  return (
    <SafeAreaView className="flex-1 bg-bg items-center justify-center">
      <ActivityIndicator color={colors.tertiary} />
    </SafeAreaView>
  );
}
