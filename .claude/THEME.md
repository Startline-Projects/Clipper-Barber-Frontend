# THEME.md — Dark/Light Mode & Theme System for Clipper

> This file defines how theming works in Clipper, where the toggle lives, and how to implement it correctly end-to-end.

---

## Overview

- **Default mode: Dark.** The app launches in dark mode.
- **Light mode: Opt-in.** The user can toggle it from the **More** tab (Settings section).
- The preference is **persisted** via `AsyncStorage` and restored on app launch.
- Powered by NativeWind's `colorScheme` API + `darkMode: "class"` in Tailwind config.

---

## Required Config

### tailwind.config.js — MUST have `darkMode: "class"`

```js
module.exports = {
	content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	darkMode: "class", // ← THIS IS REQUIRED for manual toggle to work
	theme: {
		extend: {
			colors: {
				// Semantic color tokens — use these in components, not raw palette colors
				background: {
					DEFAULT: "#ffffff", // light
					dark: "#0f0f0f", // dark
				},
				surface: {
					DEFAULT: "#f3f4f6", // light card/surface
					dark: "#1a1a1a", // dark card/surface
				},
				border: {
					DEFAULT: "#e5e7eb", // light
					dark: "#2a2a2a", // dark
				},
			},
		},
	},
	plugins: [],
};
```

---

## The Theme Store

Create `stores/themeStore.ts`:

```ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "nativewind";

type ThemeMode = "dark" | "light";

interface ThemeStore {
	mode: ThemeMode;
	setMode: (mode: ThemeMode) => void;
	toggle: () => void;
	loadFromStorage: () => Promise<void>;
}

const STORAGE_KEY = "clipper:theme";

export const useThemeStore = create<ThemeStore>((set, get) => ({
	mode: "dark",

	setMode: async (mode) => {
		set({ mode });
		colorScheme.set(mode);
		await AsyncStorage.setItem(STORAGE_KEY, mode);
	},

	toggle: () => {
		const next = get().mode === "dark" ? "light" : "dark";
		get().setMode(next);
	},

	loadFromStorage: async () => {
		const saved = await AsyncStorage.getItem(STORAGE_KEY);
		const mode: ThemeMode = saved === "light" ? "light" : "dark";
		set({ mode });
		colorScheme.set(mode);
	},
}));
```

---

## Initialize on App Launch

In `app/_layout.tsx`, load the saved theme before rendering:

```tsx
import { useEffect } from "react";
import { useThemeStore } from "@/stores/themeStore";

export default function RootLayout() {
  const loadFromStorage = useThemeStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    // ... your Stack / Slot / providers
  );
}
```

---

## The Theme Toggle Component

Create `components/ui/ThemeToggle.tsx`:

```tsx
import { Pressable, Text, View } from "react-native";
import { useThemeStore } from "@/stores/themeStore";

export function ThemeToggle() {
	const { mode, toggle } = useThemeStore();
	const isDark = mode === "dark";

	return (
		<Pressable
			onPress={toggle}
			className="flex-row items-center justify-between py-4 px-0 active:opacity-70"
			accessibilityRole="switch"
			accessibilityState={{ checked: !isDark }}
			accessibilityLabel="Light mode">
			<View className="flex-row items-center gap-3">
				{/* Icon */}
				<View className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
					<Text className="text-lg">{isDark ? "🌙" : "☀️"}</Text>
				</View>
				{/* Label */}
				<Text className="text-base font-medium text-gray-900 dark:text-white">Light Mode</Text>
			</View>

			{/* Toggle Switch */}
			<View className={`w-12 h-6 rounded-full justify-center px-1 ${isDark ? "bg-gray-600" : "bg-blue-500"}`}>
				<View className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isDark ? "self-start" : "self-end"}`} />
			</View>
		</Pressable>
	);
}
```

---

## Add Toggle to the More Tab

In `app/(tabs)/more.tsx` (or your Settings screen), add the toggle in the appropriate settings section:

```tsx
import { ScrollView, Text, View } from "react-native";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MoreScreen() {
	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
			<ScrollView className="flex-1">
				{/* Header */}
				<Text className="text-2xl font-bold text-gray-900 dark:text-white px-4 pt-6 pb-4">Settings</Text>

				{/* Appearance Section */}
				<View className="mx-4 mb-4 bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden">
					<Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">Appearance</Text>
					<View className="px-4">
						<ThemeToggle />
					</View>
				</View>

				{/* ...other settings sections */}
			</ScrollView>
		</SafeAreaView>
	);
}
```

---

## Writing Theme-Aware Components

Always provide both light and dark variants. Dark is the visual default, light must be explicitly styled.

```tsx
// ✅ Correct — both variants declared
<View className="bg-white dark:bg-gray-900">
  <Text className="text-gray-900 dark:text-white">Title</Text>
  <Text className="text-gray-500 dark:text-gray-400">Subtitle</Text>
</View>

// ❌ Incomplete — breaks in light mode
<View className="dark:bg-gray-900">
  <Text className="dark:text-white">Title</Text>
</View>
```

---

## Common Theme Color Pairs

Use these consistently across the app:

| Element           | Light             | Dark                   |
| ----------------- | ----------------- | ---------------------- |
| Screen background | `bg-white`        | `dark:bg-gray-950`     |
| Card / surface    | `bg-gray-50`      | `dark:bg-gray-900`     |
| Elevated card     | `bg-white`        | `dark:bg-gray-800`     |
| Primary text      | `text-gray-900`   | `dark:text-white`      |
| Secondary text    | `text-gray-500`   | `dark:text-gray-400`   |
| Muted text        | `text-gray-400`   | `dark:text-gray-500`   |
| Border / divider  | `border-gray-200` | `dark:border-gray-700` |
| Input background  | `bg-gray-100`     | `dark:bg-gray-800`     |
| Input border      | `border-gray-300` | `dark:border-gray-600` |
| Icon tint         | `text-gray-600`   | `dark:text-gray-300`   |
| Destructive       | `text-red-600`    | `dark:text-red-400`    |
| Success           | `text-green-600`  | `dark:text-green-400`  |

---

## Reading the Theme in JS Logic

When you need the theme value in JS (not just className):

```tsx
import { useColorScheme } from "nativewind";

function MyComponent() {
	const { colorScheme } = useColorScheme();
	const isDark = colorScheme === "dark";

	return <StatusBar style={isDark ? "light" : "dark"} />;
}
```

For the `expo-status-bar`, always sync it with the theme in your root layout:

```tsx
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";

export default function RootLayout() {
	const { colorScheme } = useColorScheme();
	return (
		<>
			<StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
			{/* ...rest of layout */}
		</>
	);
}
```

---

## CSS Variables for Dynamic Theming (Advanced)

For sub-themes or brand colors that need to change at runtime:

```tsx
import { vars } from "nativewind";

const themes = {
	dark: vars({ "--surface": "#1a1a1a", "--text-primary": "#ffffff" }),
	light: vars({ "--surface": "#f3f4f6", "--text-primary": "#111827" }),
};

// Apply at a section root
<View style={themes[colorScheme]}>
	<Text className="text-[--text-primary]">Themed</Text>
</View>;
```

---

## Troubleshooting

| Problem                                      | Fix                                                              |
| -------------------------------------------- | ---------------------------------------------------------------- |
| Toggle changes state but colors don't change | Confirm `darkMode: "class"` in `tailwind.config.js`              |
| Theme resets on reload                       | Confirm `loadFromStorage()` is called in `_layout.tsx` useEffect |
| `setColorScheme` throws an error             | Add `darkMode: "class"` to Tailwind config                       |
| Colors look wrong on one platform            | Add both light and dark variants to every element                |
| StatusBar color wrong after toggle           | Use `useColorScheme()` from `nativewind` and sync StatusBar      |
