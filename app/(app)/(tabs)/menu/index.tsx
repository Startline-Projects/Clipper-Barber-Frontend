import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useProfile } from '@/lib/hooks/useProfile';
import { useReviewsAnalytics } from '@/lib/hooks/useReviews';
import { useLogout } from '@/lib/hooks/useAuth';
import type { IconName } from '@/components/ui/Icon';

interface MenuItem {
  label: string;
  sub: string;
  icon: IconName;
  route: string;
  warn?: boolean;
  danger?: boolean;
}

export default function MenuScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: profile } = useProfile();
  const { data: analytics } = useReviewsAnalytics();
  const logout = useLogout();

  const avgRating = analytics?.averageRating ?? 0;
  const totalReviews = analytics?.totalReviews ?? 0;

  const handleLogout = () => {
    Alert.alert('Log out?', "You'll be signed out of Clipper.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => logout.mutate(undefined),
      },
    ]);
  };

  const items: MenuItem[] = [
    { label: 'Profile', sub: 'Name, photo, bio', icon: 'user', route: '/(app)/(tabs)/menu/profile' },
    { label: 'Schedule', sub: 'Hours & availability', icon: 'clock', route: '/(app)/(tabs)/menu/schedule' },
    { label: 'Services', sub: 'Types & pricing', icon: 'scissors', route: '/(app)/(tabs)/menu/services' },
    { label: 'Reviews', sub: `${totalReviews} reviews · ${avgRating.toFixed(1)} avg`, icon: 'star', route: '/(app)/(tabs)/menu/reviews' },
    { label: 'Income', sub: 'Earnings & export', icon: 'dollar', route: '/(app)/(tabs)/menu/income' },
    { label: 'Clients', sub: 'Client management', icon: 'user', route: '/(app)/(tabs)/menu/clients/' },
    { label: 'Payments & Payouts', sub: profile?.noShowChargeEnabled ? 'Stripe connected' : 'Set up Stripe', icon: 'card', route: '/(app)/(tabs)/menu/payments', warn: !profile?.noShowChargeEnabled },
    { label: 'No-Show Charge', sub: 'Fee amount & policy', icon: 'shield', route: '/(app)/(tabs)/menu/no-show-settings' },
    { label: 'Notification Settings', sub: 'Push preferences', icon: 'bell', route: '/(app)/(tabs)/menu/notification-settings' },
    { label: 'Change Password', sub: 'Update your password', icon: 'shield', route: '/(app)/(tabs)/menu/change-password' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5">
        <Header title="More" />

        {/* Profile header */}
        <Pressable
          onPress={() => router.push('/(app)/(tabs)/menu/profile')}
          className="items-center pb-6"
        >
          <Avatar name={profile?.full_name ?? '?'} size={68} />
          <Text className="text-[20px] font-bold text-ink tracking-[-0.4px] mt-3 mb-[2px]">
            {profile?.full_name ?? '—'}
          </Text>
          <Text className="text-[13px] text-tertiary tracking-[-0.1px]">
            {profile?.shop_name ?? ''}{profile?.city ? ` · ${profile.city}` : ''}
          </Text>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/menu/reviews')}
            className="flex-row items-center gap-1 mt-1"
          >
            <Icon name="star" size={12} color={colors.yellow} />
            <Text className="text-[14px] text-secondary font-medium">
              {avgRating.toFixed(1)} · {totalReviews} reviews
            </Text>
          </Pressable>
        </Pressable>

        {/* Nav list */}
        <Card elevated className="p-0 overflow-hidden">
          {items.map((it, i) => (
            <Pressable
              key={it.label}
              onPress={() => router.push(it.route as any)}
              className={`flex-row items-center gap-[14px] px-4 py-[15px] ${
                i < items.length - 1 ? 'border-b border-separator' : ''
              }`}
            >
              <View
                className={`w-[34px] h-[34px] rounded-xs items-center justify-center ${
                  it.warn ? 'bg-orange/12' : 'bg-bg'
                }`}
              >
                <Icon
                  name={it.icon}
                  size={18}
                  color={it.warn ? colors.orange : colors.secondary}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-ink tracking-[-0.2px]">
                  {it.label}
                </Text>
                <Text
                  className={`text-[13px] mt-[1px] ${
                    it.warn ? 'text-orange' : 'text-tertiary'
                  }`}
                >
                  {it.sub}
                </Text>
              </View>
              <Icon name="chevron" size={16} color={colors.quaternary} />
            </Pressable>
          ))}

          {/* Logout row */}
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center gap-[14px] px-4 py-[15px]"
          >
            <View className="w-[34px] h-[34px] rounded-xs bg-red/10 items-center justify-center">
              <Icon name="back" size={18} color={colors.red} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-red tracking-[-0.2px]">
                Log out
              </Text>
              <Text className="text-[13px] text-red/70 mt-[1px]">
                Sign out of Clipper
              </Text>
            </View>
          </Pressable>
        </Card>

        <Text className="text-[11px] text-quaternary text-center mt-6 mb-8 tracking-[0.2px]">
          Clipper v1.0 · Free forever
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
