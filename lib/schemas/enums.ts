import { z } from "zod";

export const ServiceType = z.enum(["haircut", "beard", "haircut_beard", "eyebrows", "other"]);

export const BookingType = z.enum(["regular", "after_hours", "day_off"]);

export const BookingStatus = z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]);

export const BookingTimeframe = z.enum(["upcoming", "past"]);

export const BookingTypeFilter = z.enum(["one_off", "recurring"]);

export const DurationMinutes = z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]);

export const RecurringFrequency = z.enum(["weekly", "biweekly"]);

export const RecurringFrequencyOption = z.enum(["weekly", "biweekly", "both"]);

export const RecurringStatus = z.enum(["pending_barber_approval", "active", "paused", "cancelled", "expired"]);

export const CancelledBy = z.enum(["client", "barber"]);

export const DevicePlatform = z.enum(["ios", "android"]);

export const NotificationType = z.enum([
	"new_booking",
	"cancelled_booking",
	"new_recurring_request",
	"recurring_cancelled",
	"recurring_paused",
	"new_message",
	"booking_confirmed",
	"booking_cancelled",
	"recurring_accepted",
	"recurring_refused",
	"recurring_expiring",
]);

export const SenderRole = z.enum(["barber", "client"]);

export const ClientSortBy = z.enum(["lastVisit", "totalSpend", "totalVisits", "name"]);

export const SortOrder = z.enum(["asc", "desc"]);

export const AnalyticsPeriod = z.enum(["week", "month", "year"]);

export const ThemePreference = z.enum(["system", "light", "dark"]);

export const BarberCategoryTag = z.enum([
	"ALL_GENDER_CUTS",
	"KIDS_CUTS",
	"CURLY_HAIR_SPECIALIST",
	"AFRO_HAIR_SPECIALIST",
	"BRAIDS",
	"BEARD_SPECIALIST",
	"SKIN_FADES",
	"WOMENS_HAIRCUTS",
	"LOCS_DREADLOCKS",
	"HAIR_DESIGN",
	"SHAVES",
	"MOBILE_BARBER",
	"IN_HOUSE_SERVICES",
]);
