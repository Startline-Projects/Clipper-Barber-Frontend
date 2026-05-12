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
import {
  formatBookingTime,
  getBookingLocalParts,
} from '@/lib/utils/timezone';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TIME_GUTTER = 48;
const CALENDAR_PADDING = 20 * 2;
const MIN_DAY_COL = 108;
const FIT_DAY_COL = (SCREEN_WIDTH - CALENDAR_PADDING - TIME_GUTTER) / 7;
const DAY_COL = Math.max(MIN_DAY_COL, FIT_DAY_COL);
const HOUR_HEIGHT = 60;
const START_HOUR = 8;
const END_HOUR = 22;

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

const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

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
  const isCurrentWeek = weekDates.some((d) => isSameDay(d, today));

  const rangeLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  // Day bucketing must use the barber's tz, not the device's. Two bookings
  // on the same barber-local day must group together even if the device
  // straddles a UTC day boundary.
  const weekBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const parts = getBookingLocalParts(b);
        if (!parts) return false;
        return weekDates.some(
          (d) =>
            d.getFullYear() === parts.year &&
            d.getMonth() + 1 === parts.month &&
            d.getDate() === parts.day,
        );
      }),
    [bookings, weekDates],
  );

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

      {/* Horizontally scrollable week grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View>
          {/* Day headers */}
          <View className="flex-row mb-2">
            <View style={{ width: TIME_GUTTER }} />
            {weekDates.map((d, i) => {
              const isToday = isSameDay(d, today);
              const dayHasBooking = bookings.some((b) => {
                const p = getBookingLocalParts(b);
                return (
                  !!p &&
                  d.getFullYear() === p.year &&
                  d.getMonth() + 1 === p.month &&
                  d.getDate() === p.day
                );
              });
              return (
                <View
                  key={i}
                  style={{ width: DAY_COL }}
                  className="items-center"
                >
                  <Text className="text-xs font-semibold text-tertiary tracking-[0.3px]">
                    {DAY_NAMES[i]}
                  </Text>
                  <View
                    className={`w-9 h-9 rounded-full items-center justify-center mt-1 ${
                      isToday ? 'bg-green' : ''
                    }`}
                  >
                    <Text
                      style={isToday ? { color: colors.bg } : undefined}
                      className="text-md font-bold text-ink"
                    >
                      {d.getDate()}
                    </Text>
                  </View>
                  <View className="h-[6px] mt-1 items-center justify-center">
                    {dayHasBooking && !isToday && (
                      <View
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: colors.green }}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Timeline grid */}
          <View
            style={{
              width: TIME_GUTTER + DAY_COL * 7,
              height: HOURS.length * HOUR_HEIGHT,
              position: 'relative',
            }}
          >
            {/* Hour row backgrounds */}
            {HOURS.map((hr, i) => (
              <View
                key={hr}
                className="flex-row border-t border-separator"
                style={{
                  position: 'absolute',
                  top: i * HOUR_HEIGHT,
                  left: 0,
                  right: 0,
                  height: HOUR_HEIGHT,
                }}
              >
                <View
                  style={{ width: TIME_GUTTER }}
                  className="items-end pr-2 pt-[2px]"
                >
                  <Text className="text-2xs font-medium text-quaternary tracking-[-0.2px]">
                    {formatHour(hr)}
                  </Text>
                </View>
                <View className="flex-1" />
              </View>
            ))}
            {/* Bottom border */}
            <View
              className="border-t border-separator"
              style={{
                position: 'absolute',
                top: HOURS.length * HOUR_HEIGHT,
                left: 0,
                right: 0,
              }}
            />

            {/* Day column dividers */}
            {weekDates.map((d, i) => {
              const isToday = isSameDay(d, today);
              return (
                <View
                  key={`col-${i}`}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: TIME_GUTTER + i * DAY_COL,
                    width: DAY_COL,
                    borderLeftWidth: 1,
                    borderLeftColor: colors.separator,
                    backgroundColor: isToday ? colors.green + '08' : 'transparent',
                  }}
                />
              );
            })}
            {/* Right edge */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: TIME_GUTTER + 7 * DAY_COL,
                width: 1,
                backgroundColor: colors.separator,
              }}
            />

            {/* Now-line on today's column */}
            {isCurrentWeek &&
              today.getHours() >= START_HOUR &&
              today.getHours() < END_HOUR &&
              (() => {
                const todayIdx = weekDates.findIndex((d) => isSameDay(d, today));
                if (todayIdx < 0) return null;
                const top =
                  (today.getHours() - START_HOUR) * HOUR_HEIGHT +
                  (today.getMinutes() / 60) * HOUR_HEIGHT;
                return (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top,
                      left: TIME_GUTTER + todayIdx * DAY_COL - 4,
                      width: DAY_COL + 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{ backgroundColor: colors.red }}
                      className="w-2 h-2 rounded-full"
                    />
                    <View
                      style={{ backgroundColor: colors.red, height: 1.5 }}
                      className="flex-1"
                    />
                  </View>
                );
              })()}

            {/* Bookings */}
            {weekBookings.map((b) => {
              // Position by barber timezone, not device local time — a barber
              // checking the calendar from a different timezone must still
              // see slots at the same calendar position.
              const parts = getBookingLocalParts(b);
              if (!parts) return null;
              const dayIdx = weekDates.findIndex(
                (d) =>
                  d.getFullYear() === parts.year &&
                  d.getMonth() + 1 === parts.month &&
                  d.getDate() === parts.day,
              );
              if (dayIdx < 0) return null;
              const startMinutes =
                (parts.hour - START_HOUR) * 60 + parts.minute;
              // Full block duration. Backend now sends totalDurationMinutes
              // for multi-service blocks; legacy service.durationMinutes is
              // also the total block on new responses; old payloads fall back
              // to single-service nominal duration.
              const duration = Math.max(
                15,
                b.totalDurationMinutes ?? b.service.durationMinutes,
              );
              if (startMinutes < 0 || startMinutes >= HOURS.length * 60)
                return null;
              const top = (startMinutes / 60) * HOUR_HEIGHT;
              const height = Math.max(34, (duration / 60) * HOUR_HEIGHT - 2);
              const tc = TYPE_COLORS[b.bookingType] ?? '#30D158';
              const timeLabel = formatBookingTime(b);
              return (
                <Pressable
                  key={b.id}
                  onPress={() => onPress(b.id)}
                  style={{
                    position: 'absolute',
                    top,
                    left: TIME_GUTTER + dayIdx * DAY_COL + 3,
                    width: DAY_COL - 6,
                    height,
                    backgroundColor: tc + '22',
                    borderLeftWidth: 3,
                    borderLeftColor: tc,
                    borderRadius: 6,
                    paddingHorizontal: 6,
                    paddingVertical: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Text
                    className="text-2xs font-bold text-ink tracking-[-0.1px]"
                    numberOfLines={1}
                  >
                    {timeLabel}
                  </Text>
                  <Text
                    className="text-2xs font-semibold text-ink mt-[1px]"
                    numberOfLines={1}
                  >
                    {b.isRecurring ? '↻ ' : ''}
                    {b.client.name}
                  </Text>
                  {height >= 52 && (
                    <Text
                      style={{ color: tc }}
                      className="text-2xs font-semibold mt-[1px]"
                      numberOfLines={1}
                    >
                      {b.services && b.services.length > 1
                        ? b.services.map((s) => s.name).join(' + ')
                        : b.service.name}{' '}
                      · ${b.totalPrice}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
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

  // Group by barber-local calendar, never the device's.
  const bookingDays = useMemo(() => {
    const set = new Set<number>();
    bookings.forEach((b) => {
      const p = getBookingLocalParts(b);
      if (
        p &&
        p.month - 1 === baseDate.getMonth() &&
        p.year === baseDate.getFullYear()
      ) {
        set.add(p.day);
      }
    });
    return set;
  }, [bookings, baseDate]);

  const selectedBookings = useMemo(() => {
    if (selectedDay === null) return [];
    return bookings
      .filter((b) => {
        const p = getBookingLocalParts(b);
        return (
          !!p &&
          p.day === selectedDay &&
          p.month - 1 === baseDate.getMonth() &&
          p.year === baseDate.getFullYear()
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
                const time = formatBookingTime(b);
                const serviceName =
                  b.services && b.services.length > 1
                    ? b.services.map((s) => s.name).join(' + ')
                    : b.service.name;
                return (
                  <BookingCard
                    key={b.id}
                    clientName={b.client.name}
                    serviceName={serviceName}
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
