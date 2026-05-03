import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import TextField from './TextField';
import Icon from '../ui/Icon';
import { useColors } from '@/lib/theme/colors';
import {
  autocompleteAddress,
  getPlaceDetails,
  newSessionToken,
  type AddressParts,
  type PlaceSuggestion,
} from '@/lib/api/places';

interface AddressAutocompleteProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onPlaceSelected: (parts: AddressParts) => void;
  placeholder?: string;
  error?: string;
  returnKeyType?: 'next' | 'done' | 'go';
  onSubmitEditing?: () => void;
}

const AddressAutocomplete = forwardRef<TextInput, AddressAutocompleteProps>(
  function AddressAutocomplete(
    {
      label = 'Street Address',
      value,
      onChangeText,
      onPlaceSelected,
      placeholder = '123 Main Street',
      error,
      returnKeyType,
      onSubmitEditing,
    },
    ref,
  ) {
    const colors = useColors();
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resolving, setResolving] = useState(false);

    const sessionRef = useRef<string>(newSessionToken());
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const suppressRef = useRef(false);

    useEffect(() => {
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (abortRef.current) abortRef.current.abort();
      };
    }, []);

    const handleChange = useCallback(
      (text: string) => {
        onChangeText(text);
        if (suppressRef.current) {
          suppressRef.current = false;
          return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (abortRef.current) abortRef.current.abort();

        const trimmed = text.trim();
        if (trimmed.length < 3) {
          setSuggestions([]);
          setOpen(false);
          setLoading(false);
          return;
        }

        setLoading(true);
        setOpen(true);

        debounceRef.current = setTimeout(async () => {
          const ctrl = new AbortController();
          abortRef.current = ctrl;
          try {
            const results = await autocompleteAddress(
              trimmed,
              sessionRef.current,
              ctrl.signal,
            );
            if (!ctrl.signal.aborted) {
              setSuggestions(results);
              setOpen(results.length > 0);
            }
          } catch (e) {
            if (!ctrl.signal.aborted) {
              setSuggestions([]);
              setOpen(false);
            }
          } finally {
            if (!ctrl.signal.aborted) setLoading(false);
          }
        }, 300);
      },
      [onChangeText],
    );

    const handleSelect = useCallback(
      async (s: PlaceSuggestion) => {
        setOpen(false);
        setResolving(true);
        suppressRef.current = true;
        onChangeText(s.primaryText);

        try {
          const details = await getPlaceDetails(s.placeId, sessionRef.current);
          // Place Details closes the autocomplete session — start a fresh one.
          sessionRef.current = newSessionToken();
          onPlaceSelected(details);
        } catch (e) {
          // Swallow — user can edit manually or try another suggestion.
        } finally {
          setResolving(false);
        }
      },
      [onChangeText, onPlaceSelected],
    );

    return (
      <View>
        <TextField
          ref={ref}
          label={label}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          autoCapitalize="words"
          autoComplete="street-address"
          textContentType="streetAddressLine1"
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={false}
          error={error}
          right={
            loading || resolving ? (
              <ActivityIndicator size="small" color={colors.tertiary} />
            ) : undefined
          }
        />

        {open && suggestions.length > 0 && (
          <View className="mt-1 rounded-md border-[1.5px] border-separator-opaque bg-surface overflow-hidden">
            {suggestions.map((s, idx) => (
              <Pressable
                key={s.placeId}
                onPress={() => handleSelect(s)}
                className={`flex-row items-start gap-3 px-4 py-3 ${
                  idx > 0 ? 'border-t border-separator-opaque' : ''
                }`}
              >
                <View className="mt-[2px]">
                  <Icon name="location" size={16} color={colors.tertiary} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-[14px] font-semibold text-ink tracking-[-0.1px]"
                    numberOfLines={1}
                  >
                    {s.primaryText}
                  </Text>
                  {s.secondaryText ? (
                    <Text
                      className="text-[12px] text-tertiary mt-[2px] tracking-[-0.05px]"
                      numberOfLines={1}
                    >
                      {s.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  },
);

export default AddressAutocomplete;
