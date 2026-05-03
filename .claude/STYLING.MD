# STYLING.md — NativeWind v4 Styling Rules for Clipper

> Read this before writing **any** className or style prop.  
> Reference: NativeWind v4 docs + Tailwind CSS v3.

---

## The Golden Rule

**Use `className` for everything. Use `style={}` only for dynamic JS values that cannot be expressed as a className.**

```tsx
// ✅ Good
<View className="flex-1 bg-gray-900 px-4 pt-safe" />

// ✅ OK — dynamic value that must come from JS
<View style={vars({ "--brand": color })} />

// ❌ Never — use className instead
<View style={{ flex: 1, backgroundColor: '#111' }} />
```

---

## What Works on Native vs Web

React Native is NOT a browser. Many CSS concepts don't exist. Here is what you can safely use:

### ✅ Fully Supported (use freely)

- Layout: `flex`, `flex-1`, `flex-row`, `flex-col`, `flex-wrap`, `items-*`, `justify-*`, `self-*`, `content-*`, `gap-*`
- Spacing: `p-*`, `m-*`, `px-*`, `py-*`, `pt-*`, `pb-*`, `pl-*`, `pr-*`, `mx-auto`
- Sizing: `w-*`, `h-*`, `min-w-*`, `max-w-*`, `min-h-*`, `max-h-*`, `w-full`, `h-full`, `h-screen`, `w-screen`
- Position: `absolute`, `relative`, `top-*`, `bottom-*`, `left-*`, `right-*`, `inset-*`, `z-*`
- Colors: `bg-*`, `text-*`, `border-*` — all Tailwind palette colors
- Typography: `text-*` (size), `font-*` (weight/family), `italic`, `not-italic`, `uppercase`, `lowercase`, `capitalize`, `tracking-*`, `leading-[n]`, `text-left/center/right/justify`, `underline`, `line-through`, `no-underline`
- Borders: `border`, `border-*` (width/color/radius/style: solid/dashed/dotted)
- Opacity: `opacity-*`
- Shadow: `shadow`, `shadow-*` (requires `bg-*` on the element on native)
- Transforms: `rotate-*`, `scale-*`, `translate-x-*`, `translate-y-*`, `skew-*`
- Display: `flex`, `hidden`
- Overflow: `overflow-hidden`, `overflow-scroll`, `overflow-visible`
- Safe area: `p-safe`, `pt-safe`, `pb-safe`, `px-safe`, `m-safe`, `inset-safe`, `h-screen-safe`
- Pointer events: `pointer-events-none`, `pointer-events-auto`
- Aspect ratio: `aspect-square`, `aspect-video`, `aspect-[n]`
- Line clamp: `line-clamp-*`

### ❌ Web-Only (do NOT use on native screens)

- `grid`, `grid-cols-*`, `grid-rows-*`, `col-span-*`
- `block`, `inline`, `inline-block`, `inline-flex`
- `float-*`, `clear-*`
- `bg-gradient-to-*`, `from-*`, `via-*`, `to-*` (use `expo-linear-gradient` instead)
- `blur-*`, `backdrop-blur-*`, `drop-shadow-*`, `filter`, `grayscale`, `invert`
- `fixed`, `sticky`
- `overflow-auto`, `overflow-clip`, `overflow-x-*`, `overflow-y-*`
- `whitespace-*`, `break-*`, `truncate`, `text-ellipsis`
- `cursor-*`, `select-*`, `resize-*`
- `outline-*`, `ring-*`
- Scroll snap, scroll margin, scroll padding
- `object-*`, `table-*`, `caption-*`

---

## Critical Native Differences

### 1. Flex direction

React Native defaults to `flex-direction: column`. Always set it explicitly:

```tsx
// ✅
<View className="flex-row items-center" />
<View className="flex-col" />
```

### 2. Colors don't cascade

`<View>` does NOT inherit text color. Put color classes on `<Text>` directly:

```tsx
// ❌ color won't apply to children
<View className="text-red-500"><Text>Hello</Text></View>

// ✅
<View><Text className="text-red-500">Hello</Text></View>
```

### 3. Always set both light and dark variants

```tsx
// ❌ only dark — will look broken in light mode
<Text className="dark:text-white" />

// ✅
<Text className="text-gray-900 dark:text-white" />
```

### 4. Shadows need a background color

```tsx
// ❌ shadow invisible without bg
<View className="shadow-lg" />

// ✅
<View className="shadow-lg bg-white dark:bg-gray-800" />
```

### 5. `flex-1` for consistent layouts

React Native's flex differs from web. Use `flex-1` to force alignment:

```tsx
<View className="flex-1 items-center justify-center" />
```

### 6. Use `gap-*` not `space-*`

`space-*` is removed in NativeWind v4. Use `gap-*` for spacing between children:

```tsx
// ❌
<View className="space-x-4" />

// ✅
<View className="flex-row gap-4" />
```

---

## Platform-Specific Classes

Use these prefixes to target specific platforms:

```tsx
<View className="ios:pt-12 android:pt-8" />
<Text className="web:text-base native:text-sm" />
<View className="ios:bg-blue-500 android:bg-green-500" />
```

---

## Interactive States

Only works on components that support the relevant event prop:

```tsx
// hover: requires onHoverIn/onHoverOut — works on Pressable, TextInput
<Pressable className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700">

// active: works on Pressable
<Pressable className="opacity-100 active:opacity-70">

// focus: works on TextInput
<TextInput className="border-gray-300 focus:border-blue-500">

// disabled: requires disabled={true} prop
<TextInput className="opacity-100 disabled:opacity-50" disabled={isDisabled}>
```

---

## Group States (Parent → Child Styling)

```tsx
<Pressable className="group/card">
	<View className="bg-gray-800 group-active/card:bg-gray-700">
		<Text className="text-white group-active/card:text-blue-300">Press me</Text>
	</View>
</Pressable>
```

---

## CSS Variables (Dynamic Theming)

Use `vars()` to pass CSS variables from JS into the style tree:

```tsx
import { vars } from "nativewind";

<View style={vars({ "--brand-color": "#6366f1" })}>
	<Text className="text-[--brand-color]">Branded text</Text>
</View>;
```

---

## Third-Party Component Styling

### Simple case — component passes `className` down

```tsx
// Just use className directly
<ThirdPartyText className="text-white font-bold" />
```

### Component has multiple style props — use `remapProps`

```tsx
import { remapProps } from "nativewind";

remapProps(FlatList, {
	className: "style",
	contentContainerClassName: "contentContainerStyle",
});

// Now use it with className
<FlatList className="bg-gray-900" contentContainerClassName="p-4" />;
```

### Component uses style attributes as props — use `cssInterop`

```tsx
import { cssInterop } from "nativewind";
import { Svg, Circle } from "react-native-svg";

cssInterop(Svg, {
	className: {
		target: "style",
		nativeStyleToProp: { width: true, height: true },
	},
});

<Svg className="w-32 h-32" viewBox="0 0 100 100" />;
```

> Call `remapProps` and `cssInterop` **once**, at the top of the file or in a dedicated `lib/nativewind-interop.ts` file — not inside components.

---

## Safe Area Insets

Always use safe area classes instead of hardcoded padding for screen edges:

```tsx
// ✅ Correct — respects notch/home indicator
<View className="pt-safe pb-safe px-safe" />
<View className="p-safe" />

// Also available
<View className="mt-safe mb-safe" />
<View className="h-screen-safe" />
```

Requires `SafeAreaProvider` at root (Expo Router adds this automatically per route).

---

## Arbitrary Values

When you need a value not in the Tailwind scale:

```tsx
<View className="w-[340px] h-[72px] rounded-[20px]" />
<Text className="text-[13px] leading-[20px]" />
<View className="bg-[#1a1a2e]" />
```

---

## Anti-Patterns to Avoid

```tsx
// ❌ Mixing className and StyleSheet
const styles = StyleSheet.create({ box: { padding: 16 } });
<View className="bg-gray-800" style={styles.box} />

// ❌ Building classNames with string concatenation bugs
const cls = "text-" + color + "-500"; // Tailwind can't detect this at build time
// ✅ Use full class names
const cls = color === "blue" ? "text-blue-500" : "text-red-500";

// ❌ Applying text color to View
<View className="text-white"><Text>Hi</Text></View>

// ❌ Using space-between utilities
<View className="space-x-4" /> // removed in v4

// ❌ Using grid
<View className="grid grid-cols-2" /> // web only
```
