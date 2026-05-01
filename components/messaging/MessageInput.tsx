import { Pressable, TextInput, View } from 'react-native';
import Icon from '@/components/ui/Icon';

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
}

export default function MessageInput({
  value,
  onChangeText,
  onSend,
}: MessageInputProps) {
  return (
    <View className="flex-row items-center gap-[10px] py-3 border-t-[0.5px] border-separator">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Message..."
        className="flex-1 px-[18px] py-3 rounded-full border-[1.5px] border-separator-opaque bg-bg text-[15px] text-ink tracking-[-0.2px] placeholder:text-tertiary"
      />
      <Pressable
        onPress={onSend}
        disabled={!value.trim()}
        className="w-[42px] h-[42px] rounded-full bg-ink items-center justify-center active:opacity-70 disabled:opacity-40"
      >
        <Icon name="send" size={16} color="#FFF" />
      </Pressable>
    </View>
  );
}
