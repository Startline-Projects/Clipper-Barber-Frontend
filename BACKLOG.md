# Backlog — deferred items

Items below were identified during the audit but intentionally not fixed in the audit/fix sweep. Each entry says *why*.

---

## Incoming feature tasks

### 16. Barber Settings — In-House Services toggle

New barber setting: allow clients to request services at the barber's location/premises.

**API**
- `PATCH /barber/settings/in-house-services`
  - Request: `{ enabled: boolean }`
  - Response: `{ inHouseServices: boolean }`

**Settings screen tasks**
- Add toggle row labeled **In-House Services** with description: *"Allow clients to request services at your location/premises."*
- Integrate with the API endpoint above.
- Optimistic update on toggle.
- Loading state while request in flight.
- Error rollback on failure.
- Persist setting locally (React Query cache + barber profile).
- Initialize toggle state from the barber profile/settings fetch.
- Reuse the same pattern already used for `recurring_enabled`, `auto_confirm`, and `no_show_charge` in [app/(app)/(tabs)/menu/](app/%28app%29/%28tabs%29/menu/).

---

### 17. Clear All Notifications

**API**
- `POST /barber/notifications/clear-all`
  - Response: `{ updated: number }`

**Behavior**
- Mark all unread notifications as read.
- **Do not** delete notifications — keep history visible.
- Unread badge resets to 0.

**Notifications screen tasks**
- Add **Clear All** button on the barber notifications screen.
- Optimistic reset of unread count.
- Disable button while loading.
- No-op safe handling (button is inert / hidden when already 0 unread).
- Empty-state handling when no notifications exist.
- Handle `updated = 0` response gracefully (no error toast).

---

## Product clarifications needed first

| Item | Why deferred | Owner | Notes |
|---|---|---|---|
| Forgot-password "always success" UX behaviour | The current implementation in [forgot-password.tsx:66-80](app/%28auth%29/forgot-password.tsx#L66) deliberately shows the same "Check your email" screen on success and on error. This is a reasonable anti-enumeration design but isn't documented — confirm intent before locking it in. | Product | If intentional, refactor to a single branch instead of duplicated `onSuccess`/`onError`. |
| Recurring decline vs cancel vs end-on-date semantics | The recurring detail screen exposes three destructive paths. Need PM confirmation that they map to distinct backend effects so toast wording is accurate. | Product | Affects WS4 (toast strings). |
| No-show fee charging timing | `useNoShowBooking` — toast wording (`"No-show fee charged"` vs `"No-show recorded"`) depends on whether charge is synchronous or webhook-driven. | Product | Once known, also affects WS3 (loading state during charge). |
| Calendar week view detail level | The week view in [calendar/index.tsx:244-294](app/%28app%29/%28tabs%29/calendar/index.tsx#L244) renders 14h × 7d = 98 cells unvirtualized. PM should confirm if week-as-default is needed or if day-view-by-default is acceptable. | Product | Affects WS7 (calendar virtualization scope). |
| Push notification deep-link payloads | What payloads does the backend send? Required to write the notification → route mapping in `setupNotificationListeners()`. | Backend / Product | B2 cannot land cleanly without this. |
| Confirmation prompt design | 4 `Alert.alert` confirmation prompts (logout, cancel booking, decline recurring, cancel recurring). Keep as native, or migrate to bottom-sheet for design parity? | Design | Affects WS4 cleanup completeness. |

---

## Deferred refactors

| Item | Why deferred | Re-pick-up trigger |
|---|---|---|
| **Convert all confirmation `Alert.alert` to a `<ConfirmSheet />` primitive** | Unclear whether design wants native confirmations (which iOS users expect) or sheet-style for consistency. Decide first. | Once design decides. |
| **Replace `react-native` `Modal` sheets with `@gorhom/bottom-sheet`** across the app | The library is already in `package.json` but used inconsistently. Sheets in [bookings/index.tsx](app/%28app%29/%28tabs%29/bookings/index.tsx#L375), [today/[bookingId].tsx](app/%28app%29/%28tabs%29/today/%5BbookingId%5D.tsx), [profile.tsx](app/%28app%29/%28tabs%29/menu/profile.tsx), [services.tsx](app/%28app%29/%28tabs%29/menu/services.tsx) all roll their own. Big refactor — better as its own focused PR after WS3. | After WS3 and WS4 land. |
| **Calendar week-view virtualization** | Depends on product clarification above. May be worth replacing the entire calendar with a tested library (e.g. `react-native-calendars`) instead of incrementally optimizing the homegrown one. | After product clarification. |
| **Form unsaved-changes guard hook** (WS8 H23) | Build `useUnsavedChangesGuard()` that intercepts hardware back / `router.back()` and shows a discard prompt. Useful but not blocking; only profile, schedule, and services modal need it. | After WS3/WS4/WS5 land. |
| **Replace `react-native` `Switch` with a themed wrapper** | The native Switch ignores theme tokens. A themed wrapper would let WS1 cover all `thumbColor` hardcoding in one shot. Currently only [services.tsx:216](app/%28app%29/%28tabs%29/menu/services.tsx#L216) is affected. | After WS1 typography pass. |
| **Sheets cleanup — extract empty `onPress={() => {}}` propagation pattern** | Functional today, ugly in code. Extract a `<SheetBody onPress={stopPropagation}>` primitive. | Cosmetic — bundle with WS1 sweep. |

---

## Tooling / DX

| Item | Why deferred |
|---|---|
| **Add `eslint-plugin-tailwindcss` with `no-arbitrary-value` rule** | Will surface every UI inconsistency from [UI_INCONSISTENCIES.md](UI_INCONSISTENCIES.md) as a lint warning. Better to land WS1 fixes first, then turn on the rule, then mass-fix the rest with `--fix`. |
| **Add `@react-native/eslint-config` + `lint-staged`** | The repo has no ESLint config currently visible. Adding it touches every file; better to land alongside WS1. |
| **Type-check in CI** | No `tsc --noEmit` in any CI step is visible. Once typed routes land in WS8, CI typecheck would have caught the dead route in B1. |
| **Detox or Maestro e2e** | Out of scope for this audit. Note: an e2e check on "tap message button on a booking → open conversation" would have caught B1. |
| **Storybook / Storybook-on-device** | Out of scope. Worth adding once WS1 stabilizes the primitives. |

---

## Observability

| Item | Why deferred |
|---|---|
| **Sentry / Crashlytics integration** | Listed as part of WS5 PR. Deferred only in the sense that this audit doesn't ship it; the PR will. |
| **Performance metrics (Hermes profiler / React DevTools profiler)** | The audit identified hot spots (calendar, message list, conversations). Profiling deferred until after WS7 lands so we measure post-FlashList numbers, not pre-. |
| **Anonymous user analytics on critical flows** | Beyond the audit's scope. Note: `lib/api/analytics.ts` exists — check whether it's a server analytics endpoint or a client tracker. |

---

## Things explicitly NOT in the audit's scope

These were not investigated and shouldn't be assumed safe:

- **Backend API contract correctness.** The audit assumes server responses match the typed shapes in [`lib/api/*.ts`](lib/api/). No server-side review.
- **Supabase RLS / auth security.** [`lib/utils/supabase-client.ts`](lib/utils/supabase-client.ts) was not audited.
- **Realtime subscription correctness.** `useRealtimeMessages`, `useRealtimeUnread` exist but their lifecycle / race conditions were not deep-audited.
- **iOS / Android platform-specific bugs.** Audit was static analysis only — no device runs.
- **Accessibility (TalkBack / VoiceOver / Dynamic Type).** Worth a separate sweep with `eslint-plugin-jsx-a11y` and a screen-reader pass.
- **Localization / i18n.** All strings are inline English. Out of scope.
- **Bundle size.** Not measured.
