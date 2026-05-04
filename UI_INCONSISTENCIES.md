# UI inconsistencies — per-file audit

Theme tokens are defined in [`tailwind.config.js`](tailwind.config.js) (semantic colors via CSS vars, spacing `xs/sm/md/lg/xl/xxl/xxxl`, radius `xs..xl/full`) and [`lib/theme/colors.ts`](lib/theme/colors.ts). Every issue below either bypasses the theme or makes future refactor harder.

| Severity | Screen / Component | Lines | Issue | Suggested fix |
|---|---|---|---|---|
| **Blocker** | [components/ui/StatCard.tsx](components/ui/StatCard.tsx#L18) | 18, 24, 32 | Inline `style={{ color: '#0A0A0A' / '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.4)' }}` — inverts in dark mode. | Drop inline styles; use `text-ink` / `bg-card` className tokens. |
| **Blocker** | [components/ui/Pill.tsx](components/ui/Pill.tsx#L22) | 22 | `color: '#FFFFFF'` for active label inline-styled. | Use `text-bg` (semantic "color that contrasts with primary") or pass via NativeWind className. |
| **Blocker** | [app/(app)/(tabs)/menu/index.tsx](app/%28app%29/%28tabs%29/menu/index.tsx#L88) | 88 | `bg-white` literal alongside theme tokens — light-mode-only. | Replace with `bg-surface`. |
| **Blocker** | [app/(app)/(tabs)/calendar/index.tsx](app/%28app%29/%28tabs%29/calendar/index.tsx#L451) | 451 | Hardcoded `color: '#FFFFFF'` inline. | Use theme token via className or `useColors()`. |
| **High** | [components/ui/Toggle.tsx](components/ui/Toggle.tsx#L27) | 27, 66 | Hardcoded `#30D158` (green) and `#E5E5EA` (light gray) in animation values + `bg-white` className — Toggle visually wrong in dark mode. | Read from `useColors()`; replace `bg-white` with `bg-surface`. |
| **High** | [components/ui/Avatar.tsx](components/ui/Avatar.tsx#L54) | 54 | `fontSize: size * 0.34` inline — fine logic but undocumented and bypasses typography scale. | Add a one-line comment explaining the ratio; or extract to `Math.round(size * 0.34)` named const. |
| **High** | [components/ui/ThemeToggle.tsx](components/ui/ThemeToggle.tsx#L21) | 21, 31, 35 | Tailwind `bg-gray-100`, `bg-gray-800`, `bg-blue-500`, `bg-gray-600`, `bg-white` — none of these are in the theme palette. | Use `bg-bg`, `bg-card`, `bg-blue` (theme token), `bg-surface`. |
| **High** | [app/(app)/(tabs)/menu/services.tsx](app/%28app%29/%28tabs%29/menu/services.tsx#L216) | 216 | RN `Switch` `thumbColor="#ffffff"` hardcoded. | Wrap in a themed `Switch` component that reads `useColors().surface`. |
| **High** | [app/(app)/(tabs)/menu/schedule.tsx](app/%28app%29/%28tabs%29/menu/schedule.tsx#L158) | 158 | `bg-white` for active indicator dot. | Replace with `bg-surface` or a chosen accent token. |
| **High** | [app/(app)/(tabs)/calendar/index.tsx](app/%28app%29/%28tabs%29/calendar/index.tsx#L220) | 220, 232 | `text-gray-900 dark:text-white`, `text-gray-400 dark:text-gray-500` — mixes vanilla Tailwind grays with theme. | Replace with `text-ink`, `text-tertiary`. |
| **High** | [app/(app)/(tabs)/menu/schedule.tsx](app/%28app%29/%28tabs%29/menu/schedule.tsx#L446) | 446, 447, 456, 459, 472, 473 | Multiple `bg-gray-100`, `text-gray-900`, `text-gray-500`, `bg-gray-800` in price input + time select. | Replace with `bg-bg`, `text-ink`, `text-tertiary`, `bg-card`. |
| **High** | [app/(app)/(tabs)/menu/index.tsx](app/%28app%29/%28tabs%29/menu/index.tsx#L89) | 89 | `text-gray-500 dark:text-gray-400` instead of semantic. | `text-secondary` or `text-tertiary`. |
| **High** | [components/messaging/MessageInput.tsx](components/messaging/MessageInput.tsx#L26) | 26 | Send button `w-[42px] h-[42px]` — below 44 minimum. | Bump to `w-11 h-11` (44px) or wrap with hit-slop padding. |
| **High** | [app/(app)/(tabs)/today/notifications.tsx](app/%28app%29/%28tabs%29/today/notifications.tsx#L111) | 111 | `w-9 h-9` icon button (36×36). | Bump to 44×44 or add `hitSlop={{top:6,...}}`. |
| **High** | [app/(app)/(tabs)/calendar/index.tsx](app/%28app%29/%28tabs%29/calendar/index.tsx#L446) | 446 | `w-8 h-8` icon button (32×32). | Bump to 44×44. |
| **Medium** | [components/ui/Header.tsx](components/ui/Header.tsx#L14) | 14, 20, 35 | `pt-[6px]`, `pr-[2px]`, `mt-[1px]` — non-token spacing. | Round to nearest token (`xs` = 4 / `sm` = 8) or accept arbitrary as needed. |
| **Medium** | [components/booking/BookingCard.tsx](components/booking/BookingCard.tsx#L35) | 35, 45, 50, 56 | ~4 arbitrary text sizes (`text-[15px]`, `text-[13px]`, `text-[17px]`); ~3 arbitrary spacings (`gap-[5px]`, `mt-[2px]`, `mt-[5px]`). | Add typography scale to [tailwind.config.js](tailwind.config.js); migrate to `text-base`, `text-sm`, `text-lg`. |
| **Medium** | [components/booking/ScheduleSlot.tsx](components/booking/ScheduleSlot.tsx#L44) | 44, 55, 62, 74 | ~5 arbitrary font sizes (`text-[17px]`, `text-[11px]`, `text-[15px]`, `text-[13px]`); ~4 arbitrary spacings. | Same — migrate to typography + spacing scales. |
| **Medium** | [app/(app)/(tabs)/today/index.tsx](app/%28app%29/%28tabs%29/today/index.tsx#L177) | 177 | Inline `backgroundColor: barColor` (dynamic — fine), but `h-9` for a status bar is arbitrary height. | Define a `bar` height token or accept as-is and document. |
| **Medium** | [components/forms/TimeSelect.tsx](components/forms/TimeSelect.tsx#L28) | 28 | `tracking-[0.2px]` arbitrary letter-spacing. | Drop or move to typography preset. |
| **Medium** | [components/feedback/EmptyState.tsx](components/feedback/EmptyState.tsx#L16) | 16 | `w-[56px] h-[56px]` icon container. | `w-14 h-14` (Tailwind 4px base = 56). |
| **Low** | [app/(auth)/login.tsx](app/%28auth%29/login.tsx#L75) | 75, 85, 88, 142, 152, 154, 167, 171 | ~6 arbitrary text sizes + spacing. Pattern repeats across all auth screens. | Batch refactor once typography scale exists. |
| **Low** | [components/ui/Section.tsx](components/ui/Section.tsx#L22) | 22, 23, 28 | `mb-sm` (token, ✓) mixed with `px-[2px]`, `text-[20px]` (arbitrary). | Migrate the arbitrary values. |
| **Low** | [components/forms/TextArea.tsx](components/forms/TextArea.tsx#L10) | 10, 19 | `text-[12px]`, `text-[15px]`, `py-[13px]`, `mb-[6px]`. | Migrate to scale. |
| **Low** | [components/forms/TextField.tsx](components/forms/TextField.tsx#L17) | 17, 36 | `text-[13px]`, `text-[12px]`, `mt-[4px]`. | Migrate. |
| **Low** | [components/ui/TabBar.tsx](components/ui/TabBar.tsx#L14) | 14, 33 | `p-[3px]`, `text-[13px]`. | Migrate. |
| **Low** | [components/ui/Toggle.tsx](components/ui/Toggle.tsx#L33) | 33, 36, 40 | `py-[11px]`, `text-[15px]`, `text-[12px]`, `mt-[2px]`. | Migrate. |
| **Low** | [components/messaging/ConversationRow.tsx](components/messaging/ConversationRow.tsx#L49) | 49 | `text-[12px]`. | Migrate. |
| **Low** | [components/sheets/PauseRecurringSheet.tsx](components/sheets/PauseRecurringSheet.tsx#L54) | 54, 57, 93, 98, 101 | ~5 arbitrary text sizes. | Migrate. |
| **Low** | [components/sheets/NoShowConfirmSheet.tsx](components/sheets/NoShowConfirmSheet.tsx#L35) | 35, 39, 42, 50, 52, 57, 60 | ~7 arbitrary text and spacing values. | Migrate. |
| **Low** | [components/ui/Pill.tsx](components/ui/Pill.tsx#L23) | 23 | `text-[13px]`. | Migrate. |
| **Low** | [app/(app)/(tabs)/menu/profile.tsx](app/%28app%29/%28tabs%29/menu/profile.tsx#L255) | 255, 274, 279 | Mixed token / arbitrary sizing. | Normalize. |
| **Low** | [components/forms/SearchInput.tsx](components/forms/SearchInput.tsx#L27) | 27 | `pl-[40px]`, `text-[15px]`. | Migrate. |
| **Low** | [components/ui/StarRow.tsx](components/ui/StarRow.tsx#L22) | 22 | `gap-[2px]`. | `gap-[2px]` is fine if intentional; otherwise round to `xs`. |

---

## Top 5 patterns to fix (mass refactor)

1. **Add a typography scale** to [`tailwind.config.js`](tailwind.config.js):
   ```js
   fontSize: {
     '2xs': ['10px', '14px'],
     xs:    ['11px', '14px'],
     sm:    ['12px', '16px'],
     base:  ['13px', '18px'],
     md:    ['14px', '20px'],
     lg:    ['15px', '20px'],
     xl:    ['17px', '22px'],
     '2xl': ['20px', '26px'],
     '3xl': ['22px', '28px'],
     '4xl': ['26px', '32px'],
   },
   ```
   then mass-migrate `text-[Npx]` → named.

2. **Eliminate hardcoded `bg-white` / `text-gray-*` / `bg-gray-*` / hex-in-style**. Run a grep for `#[0-9a-fA-F]{3,8}` outside [`lib/theme/colors.ts`](lib/theme/colors.ts) and the constants files.

3. **Touch targets** — at least the 3 documented violations; consider a default `min-w-11 min-h-11` on `Pressable` icon-only buttons via a shared `<IconButton />` primitive.

4. **`StatCard` / `Toggle` / `ThemeToggle` / `Pill`** all use inline styles for theming. Refactor each to use only className tokens with `useColors()` only when truly dynamic (animations).

5. **Add `eslint-plugin-tailwindcss`** with `no-arbitrary-value` configured for `text-*`, `bg-*`, `gap-*`, `m*-*`, `p*-*` (allow for explicit override pragmas).
