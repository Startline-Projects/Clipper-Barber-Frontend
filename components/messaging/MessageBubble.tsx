import { memo } from 'react';
import { Text, View } from 'react-native';

interface MessageBubbleProps {
  body: string;
  time: string;
  isBarber: boolean;
}

export default memo(function MessageBubble({
  body,
  time,
  isBarber,
}: MessageBubbleProps) {
  return (
    <View
      className={`flex-row mb-[6px] ${
        isBarber ? 'justify-end' : 'justify-start'
      }`}
    >
      <View
        className={`max-w-[78%] px-[14px] py-[10px] rounded-[20px] ${
          isBarber
            ? 'bg-ink rounded-br-[6px]'
            : 'bg-bg rounded-bl-[6px]'
        }`}
      >
        <Text
          className={`text-[15px] leading-[21px] tracking-[-0.2px] ${
            isBarber ? 'text-white' : 'text-ink'
          }`}
        >
          {body}
        </Text>
        <Text
          className={`text-[11px] mt-1 text-right ${
            isBarber ? 'text-white/40' : 'text-ink/40'
          }`}
        >
          {time}
        </Text>
      </View>
    </View>
  );
});
