import { z } from "zod";
import { apiClient } from "./client";
import { BookingStatus, BookingType, RecurringStatus, RecurringFrequency, CancelledBy, ClientSortBy, SortOrder, ServiceType } from "@/lib/schemas/enums";

// ---------- Response schemas ----------

const ClientListItemSchema = z.object({
	clientId: z.string(),
	name: z.string(),
	profilePhotoUrl: z.string().nullable(),
	email: z.string().nullable(),
	totalVisits: z.number(),
	totalSpendUsd: z.number(),
	firstVisitAt: z.string().nullable(),
	lastVisitAt: z.string().nullable(),
	nextBookingAt: z.string().nullable(),
	hasUpcoming: z.boolean(),
	isGuest: z.boolean(),
});

const PagePaginationSchema = z.object({
	currentPage: z.number(),
	totalPages: z.number(),
	limit: z.number(),
	hasNextPage: z.boolean(),
	totalClients: z.number(),
});

const ClientListResponseSchema = z.object({
	clients: z.array(ClientListItemSchema),
	pagination: PagePaginationSchema,
});

const ClientBookingSchema = z.object({
	id: z.string(),
	status: BookingStatus,
	scheduledAt: z.string(),
	totalDurationMinutes: z.number(),
	bookingType: BookingType,
	services: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			durationMinutes: z.number(),
			bookingType: BookingType,
			priceUsd: z.number(),
			type: ServiceType,
		}),
	),
	totalPriceUsd: z.number(),
	isRecurring: z.boolean(),
	recurringBookingId: z.string().nullable(),
	cancelledAt: z.string().nullable(),
	cancelledBy: CancelledBy.nullable(),
});

const ClientRecurringSchema = z.object({
	id: z.string(),
	dayOfWeek: z.number(),
	slotTime: z.string(),
	frequency: RecurringFrequency,
	status: RecurringStatus,
	active: z.boolean(),
	priceUsd: z.number(),
	service: z.object({ id: z.string(), name: z.string() }),
	nextOccurrenceAt: z.string().nullable(),
	startedAt: z.string(),
	cancelledAt: z.string().nullable(),
});

const ClientDetailResponseSchema = z.object({
	client: z.object({
		id: z.string(),
		name: z.string(),
		profilePhotoUrl: z.string().nullable(),
		email: z.string().nullable(),
		createdAt: z.string().nullable(),
		isGuest: z.boolean(),
	}),
	stats: z.object({
		totalVisits: z.number(),
		totalSpendUsd: z.number(),
		averageSpendUsd: z.number(),
		firstVisitAt: z.string().nullable(),
		lastVisitAt: z.string().nullable(),
		noShowCount: z.number(),
		cancellationCount: z.number(),
		favouriteService: z
			.object({
				id: z.string(),
				name: z.string(),
			})
			.nullable(),
	}),
	upcomingBookings: z.array(ClientBookingSchema),
	pastBookings: z.object({
		items: z.array(ClientBookingSchema),
		pagination: z.object({
			currentPage: z.number(),
			totalPages: z.number(),
			limit: z.number(),
			hasNextPage: z.boolean(),
			totalBookings: z.number(),
		}),
	}),
	recurringSeries: z.array(ClientRecurringSchema),
});

// ---------- Public types ----------

export type ClientListItem = z.infer<typeof ClientListItemSchema>;
export type ClientListResponse = z.infer<typeof ClientListResponseSchema>;
export type ClientDetail = z.infer<typeof ClientDetailResponseSchema>;
export type ClientBooking = z.infer<typeof ClientBookingSchema>;
export type ClientRecurring = z.infer<typeof ClientRecurringSchema>;

export interface ListClientsParams {
	search?: string;
	sortBy?: z.infer<typeof ClientSortBy>;
	order?: z.infer<typeof SortOrder>;
	page?: number;
	limit?: number;
	hasUpcoming?: boolean;
}

export interface GetClientDetailParams {
	pastPage?: number;
	pastLimit?: number;
}

interface RequestOptions {
	signal?: AbortSignal;
}

// ---------- Helpers ----------

function extractPayload<T>(res: unknown): T {
	if (res && typeof res === "object" && "data" in res) {
		return (res as { data: T }).data;
	}
	return res as T;
}

// ---------- Endpoints ----------

export async function listClients(params: ListClientsParams = {}, opts: RequestOptions = {}): Promise<ClientListResponse> {
	const { data: res } = await apiClient.get("/barber/clients", {
		params,
		signal: opts.signal,
	});
	return ClientListResponseSchema.parse(extractPayload(res));
}

export async function getClientDetail(clientId: string, params: GetClientDetailParams = {}, opts: RequestOptions = {}): Promise<ClientDetail> {
	const { data: res } = await apiClient.get(`/barber/clients/${clientId}`, {
		params,
		signal: opts.signal,
	});
	return ClientDetailResponseSchema.parse(extractPayload(res));
}
