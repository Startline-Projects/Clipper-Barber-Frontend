// Centralized timezone-safe formatters for booking time fields.
//
// Backend contract (api/docs/multi-service-booking-changes.md §9):
//   { scheduledAt, timezone, appointmentDate, appointmentTime }
// All rendering MUST go through Intl.DateTimeFormat with an explicit
// timeZone — never the browser's local zone.

export const DEFAULT_TIMEZONE = 'UTC';

export interface BookingTimeFields {
  scheduledAt?: string | null;
  timezone?: string | null;
  appointmentDate?: string | null; // YYYY-MM-DD in barber tz
  appointmentTime?: string | null; // HH:MM in barber tz
}

function tz(b: BookingTimeFields): string {
  return b.timezone || DEFAULT_TIMEZONE;
}

function instant(b: BookingTimeFields): Date | null {
  if (b.scheduledAt) {
    const d = new Date(b.scheduledAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  // Fallback: compose from appointmentDate + appointmentTime + tz.
  // We parse the YYYY-MM-DD/HH:MM as if it were UTC and then shift by the
  // tz offset at that instant. Two-pass to handle DST correctly.
  if (b.appointmentDate && b.appointmentTime) {
    const [y, m, d] = b.appointmentDate.split('-').map(Number);
    const [hh, mm] = b.appointmentTime.split(':').map(Number);
    if ([y, m, d, hh, mm].every((n) => Number.isFinite(n))) {
      const naiveUtc = Date.UTC(y, m - 1, d, hh, mm, 0, 0);
      const guess = new Date(naiveUtc);
      const offset1 = tzOffsetMs(guess, tz(b));
      const refined = new Date(naiveUtc - offset1);
      const offset2 = tzOffsetMs(refined, tz(b));
      return new Date(naiveUtc - offset2);
    }
  }
  return null;
}

export function tzOffsetMs(at: Date, timeZone: string): number {
  // Returns signed ms offset of `timeZone` at instant `at`.
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(at).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === '24' ? '0' : parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - at.getTime();
}

export function isValidTimezone(name: string | null | undefined): boolean {
  if (!name) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: name });
    return true;
  } catch {
    return false;
  }
}

export function formatBookingTime(b: BookingTimeFields): string {
  // Prefer pre-projected wall-clock when present — no math needed.
  if (b.appointmentTime) {
    const [h, m] = b.appointmentTime.split(':').map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    }
  }
  const d = instant(b);
  if (!d) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz(b),
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function formatBookingDate(b: BookingTimeFields): string {
  const d = instant(b);
  if (!d) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz(b),
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatBookingDateTime(b: BookingTimeFields): string {
  const date = formatBookingDate(b);
  const time = formatBookingTime(b);
  if (!date) return time;
  if (!time) return date;
  return `${date} · ${time}`;
}

export function getBookingEndTime(
  b: BookingTimeFields,
  durationMinutes: number,
): Date | null {
  const start = instant(b);
  if (!start) return null;
  return new Date(start.getTime() + durationMinutes * 60_000);
}

export function formatBookingRange(
  b: BookingTimeFields,
  durationMinutes: number,
): string {
  const start = instant(b);
  if (!start) return '';
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz(b),
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

// Calendar positioning helpers — all in barber timezone, never browser.

export interface BookingLocalParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  weekday: number; // 0=Sun..6=Sat
  date: Date; // the UTC instant
}

export function getBookingLocalParts(
  b: BookingTimeFields,
): BookingLocalParts | null {
  const d = instant(b);
  if (!d) return null;
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz(b),
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  });
  const parts = dtf.formatToParts(d).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const hour = Number(parts.hour === '24' ? '0' : parts.hour);
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour,
    minute: Number(parts.minute),
    weekday: weekdayMap[parts.weekday] ?? 0,
    date: d,
  };
}

export function isSameLocalDay(
  b: BookingTimeFields,
  reference: Date,
  referenceTz?: string,
): boolean {
  const parts = getBookingLocalParts(b);
  if (!parts) return false;
  const zone = referenceTz || tz(b);
  const refParts = getBookingLocalParts({
    scheduledAt: reference.toISOString(),
    timezone: zone,
  });
  if (!refParts) return false;
  return (
    parts.year === refParts.year &&
    parts.month === refParts.month &&
    parts.day === refParts.day
  );
}

// Helper: derive a joined display name from a services array.
export interface MinimalService {
  name: string;
}
export function joinServiceNames(
  services: MinimalService[] | null | undefined,
  fallback: string,
): string {
  if (!services || services.length === 0) return fallback;
  if (services.length === 1) return services[0].name;
  return services.map((s) => s.name).join(' + ');
}
