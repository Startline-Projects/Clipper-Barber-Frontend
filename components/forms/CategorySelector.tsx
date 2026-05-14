import { Pressable, Text, View } from 'react-native';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { CATEGORY_LABELS, CATEGORY_OPTIONS } from '@/lib/constants/categories';
import type { BarberCategoryTag } from '@/lib/constants/enums';

interface CategorySelectorProps {
  /** Currently selected category tags. */
  value: BarberCategoryTag[];
  /** Called with the next full selection whenever a tag is toggled. */
  onChange: (next: BarberCategoryTag[]) => void;
  disabled?: boolean;
}

/**
 * Multi-select grid of barber category/specialty tags. Each chip fills with
 * the accent colour when selected. The list of tags mirrors the API enum
 * (BarberCategoryTag) — see lib/constants/categories.ts.
 */
export default function CategorySelector({
  value,
  onChange,
  disabled,
}: CategorySelectorProps) {
  const colors = useColors();
  const selected = new Set(value);

  const toggle = (tag: BarberCategoryTag) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    // Preserve the canonical option order so the saved array is stable.
    onChange(CATEGORY_OPTIONS.filter((t) => next.has(t)));
  };

  return (
    <View className="flex-row flex-wrap gap-[10px]">
      {CATEGORY_OPTIONS.map((tag) => {
        const active = selected.has(tag);
        return (
          <Pressable
            key={tag}
            onPress={() => toggle(tag)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            accessibilityLabel={CATEGORY_LABELS[tag]}
            style={{
              backgroundColor: active ? colors.ink : colors.surface,
              borderColor: active ? colors.ink : colors.separatorOpaque,
            }}
            className="flex-row items-center rounded-full border px-4 py-[10px] active:opacity-70"
          >
            {active && (
              <View className="mr-[6px]">
                <Icon name="check" size={14} color={colors.bg} />
              </View>
            )}
            <Text
              style={{ color: active ? colors.bg : colors.secondary }}
              className="text-base font-semibold tracking-[-0.1px]"
            >
              {CATEGORY_LABELS[tag]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
