import { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import TabBar from '@/components/ui/TabBar';
import Card from '@/components/ui/Card';
import BookingCard from '@/components/booking/BookingCard';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useBookings } from '@/lib/hooks/useBookings';
import type { BookingListItem } from '@/lib/api/bookings';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TIME_GUTTER = 38;
const CALENDAR_PADDING = 20 * 2;
const COL_WIDTH = (SCREEN_WIDTH - CALENDAR_PADDING - TIME_GUTTER) / 7;

const TYPE_COLORS: Record<string, string> = {
  regular: '#30D158',
  after_hours: '#FF9F0A',
  day_off: '#BF5AF2',
};

const TYPE_LABELS: Record<string, string> = {
  regular: 'Regular',
  after_hours: 'After-Hrs',
  day_off: 'Day-Off',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getWeekDates(base: Date) {
  const d = new Date(base);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt;
  });
}

function getMonthDates(base: Date) {
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatHour(h: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12} ${ampm}`;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

export default function CalendarScreen() {
  const router = useRouter();
  const colors = useColors();
  const [view, setView] = useState('Week');
  const [baseDate, setBaseDate] = useState(() => new Date());

  const { data, refetch } = useBookings({ timeframe: 'upcoming' });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const allBookings = useMemo(
    () => data?.pages.flatMap((p) => p.bookings) ?? [],
    [data],
  );

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);
  const today = new Date();

  const monthLabel = baseDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="px-5">
        <Header title="Calendar" subtitle={monthLabel} />
        <TabBar tabs={['Week', 'Month']} active={view} onChange={setView} />

        {/* Legend */}
        <View className="flex-row gap-3 mb-4">
          {Object.entries(TYPE_COLORS).map(([k, c]) => (
            <View key={k} className="flex-row items-center gap-[5px]">
              <View
                style={{ backgroundColor: c }}
                className="w-2 h-2 rounded-[3px]"
              />
              <Text className="text-sm text-secondary font-medium tracking-[-0.1px]">
                {TYPE_LABELS[k]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {view === 'Week' ? (
        <WeekView
          weekDates={weekDates}
          today={today}
          bookings={allBookings}
          onPress={(id) => router.push(`/(app)/(tabs)/calendar/${id}`)}
          onChangeWeek={(offset) => {
            setBaseDate((prev) => {
              const next = new Date(prev);
              next.setDate(next.getDate() + offset * 7);
              return next;
            });
          }}
          onGoToToday={() => setBaseDate(new Date())}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <MonthView
          baseDate={baseDate}
          onChangeMonth={(offset) => {
            setBaseDate((prev) => {
              const next = new Date(prev);
              next.setMonth(next.getMonth() + offset);
              return next;
            });
          }}
          today={today}
          bookings={allBookings}
          onPressBooking={(id) => router.push(`/(app)/(tabs)/calendar/${id}`)}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </SafeAreaView>
  );
}

function WeekView({
  weekDates,
  today,
  bookings,
  onPress,
  onChangeWeek,
  onGoToToday,
  refreshing,
  onRefresh,
}: {
  weekDates: Date[];
  today: Date;
  bookings: BookingListItem[];
  onPress: (id: string) => void;
  onChangeWeek: (offset: number) => void;
  onGoToToday: () => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const isCurrentWeek = weekDates.some((d) => isSameDay(d, today));

  const rangeLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const selectedBookings = useMemo(() => {
    if (!selectedDate) return [];
    return bookings
      .filter((b) => isSameDay(new Date(b.scheduledAt), selectedDate))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [bookings, selectedDate]);

  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  return (
    <ScrollView className="flex-1 px-5" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tertiary} />}>
      {/* Week navigation */}
      <View className="flex-row items-center justify-between mb-3">
        <Pressable onPress={() => onChangeWeek(-1)} className="p-2">
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <Icon name="chevron" size={18} color={colors.ink} />
          </View>
        </Pressable>
        <Pressable onPress={onGoToToday} className="flex-row items-center gap-2">
          <Text className="text-md font-bold text-ink tracking-[-0.2px]">
            {rangeLabel}
          </Text>
          {!isCurrentWeek && (
            <Text className="text-sm font-semibold text-blue">Today</Text>
          )}
        </Pressable>
        <Pressable onPress={() => onChangeWeek(1)} className="p-2">
          <Icon name="chevron" size={18} color={colors.ink} />
        </Pressable>
      </View>

      {/* Day headers */}
      <View className="flex-row mb-2">
        <View style={{ width: TIME_GUTTER }} />
        {weekDates.map((d, i) => {
          const isSelected = selectedDate ? isSameDay(d, selectedDate) : false;
          return (
            <Pressable
              key={i}
              onPress={() => setSelectedDate(isSelected ? null : d)}
              style={{ width: COL_WIDTH }}
              className="items-center active:opacity-70"
            >
              <Text className="text-xs font-semibold text-ink tracking-[0.3px]">
                {DAY_NAMES[i]}
              </Text>
              <View
                className={`w-7 h-7 rounded-full items-center justify-center mt-1 ${
                  isSelected ? 'bg-green' : ''
                }`}
              >
                <Text
                  style={isSelected ? { color: colors.bg } : undefined}
                  className={`text-md font-bold ${
                    isSelected ? '' : 'text-tertiary'
                  }`}
                >
                  {d.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Hour rows */}
      {HOURS.map((hr) => (
        <View
          key={hr}
          className="flex-row border-t border-separator"
          style={{ minHeight: 48 }}
        >
          <View style={{ width: TIME_GUTTER }} className="items-end pr-[6px] pt-[3px]">
            <Text className="text-2xs font-medium text-quaternary tracking-[-0.2px]">
              {formatHour(hr)}
            </Text>
          </View>
          {weekDates.map((wd, di) => {
            const slot = bookings.find((b) => {
              const bd = new Date(b.scheduledAt);
              return isSameDay(bd, wd) && bd.getHours() === hr;
            });

            if (!slot) return <View key={di} style={{ width: COL_WIDTH }} />;

            const tc = TYPE_COLORS[slot.bookingType] ?? '#30D158';
            return (
              <Pressable
                key={di}
                onPress={() => onPress(slot.id)}
                className="rounded-xs px-[4px] py-[5px] mx-[1px]"
                style={{
                  width: COL_WIDTH - 2,
                  backgroundColor: tc + '12',
                  borderLeftWidth: 3,
                  borderLeftColor: tc,
                  minHeight: 40,
                }}
              >
                <Text
                  className="text-2xs font-bold text-ink leading-[12px] tracking-[-0.1px]"
                  numberOfLines={1}
                >
                  {slot.isRecurring ? '↻ ' : ''}
                  {slot.client.name}
                </Text>
                <Text
                  style={{ color: tc }}
                  className="text-2xs font-semibold mt-[1px]"
                >
                  ${slot.totalPrice}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}

      {/* Selected day bookings */}
      {selectedDate && (
        <View className="mt-4 mb-8">
          <Text className="text-lg font-bold text-ink tracking-[-0.2px] mb-3">
            {selectedDateLabel}
          </Text>
          {selectedBookings.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="text-base text-tertiary">No bookings</Text>
            </View>
          ) : (
            <View className="gap-2">
              {selectedBookings.map((b) => {
                const time = new Date(b.scheduledAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                });
                return (
                  <BookingCard
                    key={b.id}
                    clientName={b.client.name}
                    serviceName={b.service.name}
                    time={time}
                    price={b.totalPrice}
                    bookingType={b.bookingType}
                    status={b.status}
                    isRecurring={b.isRecurring}
                    onPress={() => onPress(b.id)}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function MonthView({
  baseDate,
  today,
  bookings,
  onChangeMonth,
  onPressBooking,
  refreshing,
  onRefresh,
}: {
  baseDate: Date;
  today: Date;
  bookings: BookingListItem[];
  onChangeMonth: (offset: number) => void;
  onPressBooking: (id: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { firstDay, daysInMonth } = getMonthDates(baseDate);
  const colors = useColors();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const monthLabel = baseDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const bookingDays = useMemo(() => {
    const set = new Set<number>();
    bookings.forEach((b) => {
      const bd = new Date(b.scheduledAt);
      if (
        bd.getMonth() === baseDate.getMonth() &&
        bd.getFullYear() === baseDate.getFullYear()
      ) {
        set.add(bd.getDate());
      }
    });
    return set;
  }, [bookings, baseDate]);

  const selectedBookings = useMemo(() => {
    if (selectedDay === null) return [];
    return bookings
      .filter((b) => {
        const bd = new Date(b.scheduledAt);
        return (
          bd.getDate() === selectedDay &&
          bd.getMonth() === baseDate.getMonth() &&
          bd.getFullYear() === baseDate.getFullYear()
        );
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [bookings, baseDate, selectedDay]);

  const selectedDateLabel = selectedDay !== null
    ? new Date(baseDate.getFullYear(), baseDate.getMonth(), selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  return (
    <ScrollView className="flex-1 px-5" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tertiary} />}>
      <Card elevated>
        {/* Month navigation */}
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => { onChangeMonth(-1); setSelectedDay(null); }} className="p-2">
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <Icon name="chevron" size={18} color={colors.ink} />
            </View>
          </Pressable>
          <Text className="text-[16px] font-bold text-ink tracking-[-0.3px]">
            {monthLabel}
          </Text>
          <Pressable onPress={() => { onChangeMonth(1); setSelectedDay(null); }} className="p-2">
            <Icon name="chevron" size={18} color={colors.ink} />
          </Pressable>
        </View>

        {/* Day letter headers */}
        <View className="flex-row">
          {DAY_LETTERS.map((d, i) => (
            <View key={i} className="flex-1 items-center py-2">
              <Text className="text-sm font-semibold text-quaternary">
                {d}
              </Text>
            </View>
          ))}
        </View>

        {/* Day cells */}
        <View className="flex-row flex-wrap">
          {Array.from({ length: firstDay }, (_, i) => (
            <View key={`e${i}`} className="w-[14.28%]" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const isToday =
              d === today.getDate() &&
              baseDate.getMonth() === today.getMonth() &&
              baseDate.getFullYear() === today.getFullYear();
            const hasBooking = bookingDays.has(d);
            const isSelected = selectedDay === d;

            return (
              <Pressable
                key={d}
                onPress={() => setSelectedDay(isSelected ? null : d)}
                className="w-[14.28%] items-center py-2"
              >
                <View
                  style={
                    isSelected
                      ? { backgroundColor: colors.green }
                      : isToday
                        ? { backgroundColor: colors.ink }
                        : undefined
                  }
                  className="w-11 h-11 rounded-full items-center justify-center"
                >
                  <Text
                    style={
                      isSelected || isToday
                        ? { color: colors.bg }
                        : undefined
                    }
                    className={`text-lg ${
                      isSelected || isToday ? 'font-bold' : 'text-ink'
                    }`}
                  >
                    {d}
                  </Text>
                </View>
                {hasBooking && (
                  <View className="flex-row justify-center gap-[2px] mt-1 h-1">
                    <View
                      className="w-1 h-1 rounded-full"
                      style={{
                        backgroundColor: isSelected
                          ? colors.blue
                          : isToday
                            ? colors.blue
                            : colors.green,
                      }}
                    />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Selected day bookings */}
      {selectedDay !== null && (
        <View className="mt-4 mb-8">
          <Text className="text-lg font-bold text-ink tracking-[-0.2px] mb-3">
            {selectedDateLabel}
          </Text>
          {selectedBookings.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="text-base text-tertiary">No bookings</Text>
            </View>
          ) : (
            <View className="gap-2">
              {selectedBookings.map((b) => {
                const time = new Date(b.scheduledAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                });
                return (
                  <BookingCard
                    key={b.id}
                    clientName={b.client.name}
                    serviceName={b.service.name}
                    time={time}
                    price={b.totalPrice}
                    bookingType={b.bookingType}
                    status={b.status}
                    isRecurring={b.isRecurring}
                    onPress={() => onPressBooking(b.id)}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
