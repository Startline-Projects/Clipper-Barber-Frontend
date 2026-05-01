import { Pressable, Text, View } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';

interface ConversationRowProps {
  clientName: string;
  lastMessage: string;
  time: string;
  unread?: boolean;
  isLast?: boolean;
  onPress?: () => void;
}

export default function ConversationRow({
  clientName,
  lastMessage,
  time,
  unread,
  isLast,
  onPress,
}: ConversationRowProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-[14px] active:opacity-70 ${
        isLast ? '' : 'border-b-[0.5px] border-separator'
      }`}
    >
      <View className="relative">
        <Avatar name={clientName} size={46} />
        {unread && (
          <View className="absolute -top-[1px] -right-[1px] w-3 h-3 rounded-full bg-blue border-[2.5px] border-surface" />
        )}
      </View>

      <View className="flex-1 min-w-0">
        <View className="flex-row justify-between items-baseline">
          <Text
            className={`text-[15px] tracking-[-0.2px] ${
              unread ? 'font-bold' : 'font-medium'
            } text-ink`}
            numberOfLines={1}
          >
            {clientName}
          </Text>
          <Text className="text-[12px] text-tertiary font-medium ml-2 shrink-0">
            {time}
          </Text>
        </View>
        <Text
          className={`text-[14px] tracking-[-0.1px] mt-[2px] ${
            unread ? 'font-medium text-ink' : 'text-tertiary'
          }`}
          numberOfLines={1}
        >
          {lastMessage}
        </Text>
      </View>

      <Icon name="chevron" size={16} color={colors.quaternary} />
    </Pressable>
  );
}
