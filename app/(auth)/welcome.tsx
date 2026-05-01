import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/ui/Icon';
import Btn from '@/components/ui/Btn';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 justify-center items-center px-5">
        <View className="w-[80px] h-[80px] rounded-xl overflow-hidden shadow-lg shadow-black/25 mb-[22px]">
          <LinearGradient
            colors={['#0A0A0A', '#2C2C2E']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="scissors" size={36} color="#FFF" />
          </LinearGradient>
        </View>

        <Text className="text-[36px] font-extrabold text-ink tracking-[-1.2px]">
          Clipper
        </Text>
        <Text className="text-[15px] text-secondary text-center mt-[10px] mx-6 leading-[22px] tracking-[-0.1px]">
          The booking app built for independent barbers. Free forever — no
          commission, no fees.
        </Text>

        <View className="w-full mt-14 gap-[10px]">
          <Btn
            label="Create your account"
            full
            onPress={() => router.push('/(auth)/signup/step1')}
          />
          <Btn
            label="I already have an account"
            variant="ghost"
            full
            onPress={() => router.push('/(auth)/login')}
          />
        </View>

        <Text className="text-[11px] text-quaternary text-center mt-7 leading-[16px] tracking-[-0.1px] px-2">
          By continuing you agree to Clipper's Terms of Service and Privacy
          Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}
