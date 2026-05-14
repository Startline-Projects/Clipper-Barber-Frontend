import type { z } from 'zod';
import type {
  ServiceType,
  BookingType,
  BookingStatus,
  BookingTimeframe,
  BookingTypeFilter,
  DurationMinutes,
  RecurringFrequency,
  RecurringFrequencyOption,
  RecurringStatus,
  CancelledBy,
  DevicePlatform,
  NotificationType,
  SenderRole,
  ClientSortBy,
  SortOrder,
  AnalyticsPeriod,
  ThemePreference,
  BarberCategoryTag,
} from '@/lib/schemas/enums';

export type ServiceType = z.infer<typeof ServiceType>;
export type BookingType = z.infer<typeof BookingType>;
export type BookingStatus = z.infer<typeof BookingStatus>;
export type BookingTimeframe = z.infer<typeof BookingTimeframe>;
export type BookingTypeFilter = z.infer<typeof BookingTypeFilter>;
export type DurationMinutes = z.infer<typeof DurationMinutes>;
export type RecurringFrequency = z.infer<typeof RecurringFrequency>;
export type RecurringFrequencyOption = z.infer<typeof RecurringFrequencyOption>;
export type RecurringStatus = z.infer<typeof RecurringStatus>;
export type CancelledBy = z.infer<typeof CancelledBy>;
export type DevicePlatform = z.infer<typeof DevicePlatform>;
export type NotificationType = z.infer<typeof NotificationType>;
export type SenderRole = z.infer<typeof SenderRole>;
export type ClientSortBy = z.infer<typeof ClientSortBy>;
export type SortOrder = z.infer<typeof SortOrder>;
export type AnalyticsPeriod = z.infer<typeof AnalyticsPeriod>;
export type ThemePreference = z.infer<typeof ThemePreference>;
export type BarberCategoryTag = z.infer<typeof BarberCategoryTag>;
