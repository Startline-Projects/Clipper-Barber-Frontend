# CLAUDE.md — Clipper Project Instructions

> **Read this file first.** It tells you what the project is, what stack is in use, and the non-negotiable rules before touching any code.

---

## What Is Clipper?

Clipper is a React Native mobile app built with **Expo Router v6**, **NativeWind v4** (Tailwind CSS for React Native), and **Supabase** as the backend. It targets iOS and Android (and optionally web via Metro).

---

## Stack at a Glance

| Layer            | Library                                                        |
| ---------------- | -------------------------------------------------------------- |
| Framework        | Expo ~54, React Native 0.81.5, React 19                        |
| Routing          | expo-router ~6 (file-based, like Next.js App Router)           |
| Styling          | NativeWind ^4.2.3 + Tailwind CSS ^3.4                          |
| State (server)   | TanStack React Query ^5                                        |
| State (client)   | Zustand ^5                                                     |
| Backend          | Supabase JS ^2                                                 |
| Auth / Storage   | expo-secure-store, async-storage                               |
| Navigation       | @react-navigation/native ^7                                    |
| Animations       | react-native-reanimated ~4, react-native-gesture-handler ~2.28 |
| Forms/Validation | Zod ^4                                                         |
| Icons            | @expo/vector-icons ^15                                         |
| Bottom sheets    | @gorhom/bottom-sheet ^5                                        |
| Images           | expo-image-picker                                              |
| SVG              | react-native-svg 15                                            |
| Notifications    | expo-notifications                                             |

---

## Absolute Rules (Never Break These)

1. **Never use StyleSheet.create** — all styles go through NativeWind `className`. Only use inline `style={}` when NativeWind cannot express the value (e.g. dynamic JS values passed to `vars()`).
2. **Never import from `react-native` CSS-only concepts** (grid, float, etc.) — see `STYLING.md` for what works on native.
3. **Never use `localStorage` or `sessionStorage`** — use `expo-secure-store` for sensitive data, `@react-native-async-storage/async-storage` for everything else.
4. **Never use `console.log` in committed code** — use a named debug flag or remove before committing.
5. **Always use `npx expo install <pkg>`** not `npm install` for new packages — it picks the Expo-compatible version.
6. **Always wrap root with `SafeAreaProvider`** from `react-native-safe-area-context`. Expo Router handles this per-route, but custom layouts must include it.
7. **Dark mode is the default.** Light mode is opt-in via a toggle in the More/Settings section. See `THEME.md` for the implementation pattern.
8. **File-based routing only** — all screens live under `app/`. No manual navigator definitions.

---

## Project Structure

```
app/                    # Expo Router screens (file-based routes)
  (tabs)/               # Tab navigator group
    index.tsx           # Home tab
    more.tsx            # More/Settings tab  ← theme toggle lives here
  _layout.tsx           # Root layout (providers, fonts, splash)
components/             # Shared UI components
  ui/                   # Primitives (Button, Text, Card, etc.)
hooks/                  # Custom hooks (useTheme, useAuth, etc.)
lib/                    # Supabase client, React Query setup, utils
stores/                 # Zustand stores
constants/              # Colors, sizes, theme tokens
assets/                 # Fonts, images, icons
global.css              # Tailwind entry point (@tailwind directives)
tailwind.config.js      # Tailwind + NativeWind config
metro.config.js         # Metro + withNativeWind
babel.config.js         # babel-preset-expo + nativewind/babel
```

---

## Before Every Task

1. Read `STYLING.md` before writing or modifying any className.
2. Read `THEME.md` before touching colors, dark mode, or the theme toggle.
3. Read `UI_CHANGES.md` before any visual enhancement or refactor.
4. When adding a new screen, check `app/` structure and follow the existing route naming pattern.
5. When adding a package, confirm it is Expo-compatible and install with `npx expo install`.

---

## Key Config Files

### babel.config.js (required shape)

```js
module.exports = function (api) {
	api.cache(true);
	return {
		presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
	};
};
```

### metro.config.js (required shape)

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

### global.css (required content)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### tailwind.config.js (minimum shape)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	darkMode: "class", // REQUIRED for manual dark/light toggle
	theme: { extend: {} },
	plugins: [],
};
```

> `darkMode: "class"` is mandatory — the theme toggle uses `colorScheme.set()` which requires it.

---

## TypeScript

The project uses TypeScript ~5.9. A `nativewind-env.d.ts` file must exist at the root:

```ts
/// <reference types="nativewind/types" />
```

Do not name this file `nativewind.d.ts` — it will not be picked up by the TS compiler.

---

## Troubleshooting Checklist

- Styles not applying? Run `npx expo start --clear` first.
- New package not found? Use `npx expo install` not `npm install`.
- Theme toggle not working? Confirm `darkMode: "class"` in `tailwind.config.js`.
- Font not rendering? Verify PostScript name matches file name exactly.
- AsyncStorage error? Check it is imported from `@react-native-async-storage/async-storage`.
