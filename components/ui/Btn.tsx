import { Pressable, Text } from 'react-native';
import Icon, { type IconName } from './Icon';
import { useColors } from '@/lib/theme/colors';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'subtle';

interface BtnProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  full?: boolean;
  icon?: IconName;
  disabled?: boolean;
  className?: string;
}

const containerStyles: Record<Variant, string> = {
  primary: 'bg-ink shadow-md shadow-black/15',
  secondary: 'bg-bg border-[1.5px] border-separator-opaque',
  danger: 'bg-red/5 border-[1.5px] border-red/[0.15]',
  ghost: 'bg-bg',
  subtle: 'bg-blue/5',
};

const textStyles: Record<Variant, string> = {
  primary: 'text-bg',
  secondary: 'text-ink',
  danger: 'text-red',
  ghost: 'text-secondary',
  subtle: 'text-blue',
};

const iconColorKey: Record<Variant, keyof ReturnType<typeof useColors>> = {
  primary: 'surface',
  secondary: 'ink',
  danger: 'red',
  ghost: 'secondary',
  subtle: 'blue',
};

export default function Btn({
  label,
  onPress,
  variant = 'primary',
  full,
  icon,
  disabled,
  className,
}: BtnProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center justify-center gap-[6px] rounded-md py-[14px] px-[22px] ${
        containerStyles[variant]
      } ${full ? 'w-full' : ''} ${disabled ? 'opacity-40' : 'active:opacity-70'} ${className ?? ''}`}
    >
      {icon && (
        <Icon name={icon} size={16} color={colors[iconColorKey[variant]]} />
      )}
      <Text
        className={`text-lg font-semibold tracking-[-0.2px] ${textStyles[variant]}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
