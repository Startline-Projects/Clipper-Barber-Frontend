# UI_CHANGES.md — Safe UI Enhancement & Refactor Guide for Clipper

> Read this before making **any visual change** to existing components.  
> The goal: improve the UI without breaking functionality, logic, or state.

---

## The Core Principle

**Separate concerns. Style lives in `className`. Logic lives in handlers and state. Never mix them.**

When enhancing UI:

- ✅ Add/change `className` props
- ✅ Add/remove wrapper `<View>` elements for layout
- ✅ Replace raw elements with shared `components/ui/` primitives
- ❌ Never change prop names, callback signatures, or data flow
- ❌ Never remove or rename state variables
- ❌ Never change import paths without updating all consumers
- ❌ Never add new `useEffect`, `useState`, or API calls during a visual-only task

---

## Safe Change Checklist

Before touching a file, answer these:

1. **Is this purely visual?** If yes, only `className`, layout wrappers, and component swaps are allowed.
2. **Does the component receive props?** Don't change prop names or types — only how they are rendered.
3. **Is there a state variable driving conditional classes?** Keep the variable, only change what classes it produces.
4. **Is this component used elsewhere?** Search for its name before changing its external interface.

---

## How to Enhance a Component (Step-by-Step)

### Step 1 — Read the existing component fully

Understand what props it accepts, what state it has, and what it renders. Do not assume.

### Step 2 — Identify visual-only elements

Mark which parts are purely display: wrappers, text, icons, colors, spacing, borders, shadows.

### Step 3 — Make the smallest change that achieves the goal

Don't refactor what isn't broken. If the task is "make the button rounded", only change `className` on that button.

### Step 4 — Verify dark and light variants

Any new color class needs both a base (light) and `dark:` variant. See `THEME.md` color table.

### Step 5 — Check safe area and spacing

New wrappers that touch screen edges need safe area classes (`pt-safe`, `pb-safe`, `px-safe`).

---

## Patterns for Common Enhancements

### Adding spacing / padding

```tsx
// Before
<View>
  <Text>Title</Text>
</View>

// After — added spacing, didn't touch anything else
<View className="px-4 py-3 gap-1">
  <Text className="text-base font-semibold text-gray-900 dark:text-white">Title</Text>
</View>
```

### Making a list item look like a card

```tsx
// Before
<View>
  <Text>{item.name}</Text>
</View>

// After — wrapped in card style, original content unchanged
<View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
  <Text className="text-gray-900 dark:text-white font-medium">{item.name}</Text>
</View>
```

### Improving a button

```tsx
// Before
<Pressable onPress={onPress}>
  <Text>Save</Text>
</Pressable>

// After — enhanced visuals, handler untouched
<Pressable
  onPress={onPress}    // ← unchanged
  className="bg-blue-500 active:bg-blue-600 rounded-xl px-6 py-3 items-center shadow-sm"
>
  <Text className="text-white font-semibold text-base">Save</Text>
</Pressable>
```

### Improving a text input

```tsx
// Before
<TextInput value={value} onChangeText={onChange} placeholder="Search" />

// After
<TextInput
  value={value}           // ← unchanged
  onChangeText={onChange} // ← unchanged
  placeholder="Search"    // ← unchanged
  placeholderTextColor="#9ca3af"
  className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-base border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
/>
```

### Adding a section header

```tsx
// Add above an existing list/section without disturbing it
<View className="px-4 mb-2 mt-6">
	<Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{sectionTitle}</Text>
</View>;
{
	/* existing content below, untouched */
}
```

### Adding a divider between items

```tsx
<View className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />
```

---

## Replacing Raw Elements with Shared Components

When a shared primitive exists in `components/ui/`, prefer it over raw React Native components:

```tsx
// Before
<Text className="text-lg font-bold text-gray-900 dark:text-white">Title</Text>;

// After — using a shared Text component that handles dark mode internally
import { AppText } from "@/components/ui/AppText";
<AppText variant="heading">Title</AppText>;
```

> Only do this replacement if the shared component already exists. Don't create new shared components mid-task unless that IS the task.

---

## Adding Animations Safely

Use `react-native-reanimated` (already installed). Use NativeWind transition classes for simple state changes:

```tsx
// Simple opacity transition on press
<Pressable className="opacity-100 active:opacity-70 transition-opacity duration-150">

// Scale on press
<Pressable className="scale-100 active:scale-95 transition-transform duration-100">
```

For complex animations (entrance, exit, sequences), use Reanimated directly and keep it isolated in the component — don't mix with className logic.

---

## Layout Enhancement Patterns

### Screen layout baseline

```tsx
<SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
	<ScrollView className="flex-1" contentContainerClassName="px-4 pb-8 gap-4" showsVerticalScrollIndicator={false}>
		{/* content */}
	</ScrollView>
</SafeAreaView>
```

### Settings row (used in More/Settings screens)

```tsx
<Pressable className="flex-row items-center justify-between py-4 active:opacity-70">
	<View className="flex-row items-center gap-3">
		<View className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 items-center justify-center">{/* icon */}</View>
		<Text className="text-base text-gray-900 dark:text-white">Label</Text>
	</View>
	{/* right element: chevron, toggle, badge */}
</Pressable>
```

### Section card container

```tsx
<View className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden mx-0 mb-4">
	<Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-4 pt-4 pb-2">Section Title</Text>
	<View className="px-4 divide-y divide-gray-100 dark:divide-gray-800">{/* rows */}</View>
</View>
```

### Empty state

```tsx
<View className="flex-1 items-center justify-center gap-4 px-8 py-16">
	<Text className="text-5xl">📭</Text>
	<Text className="text-xl font-semibold text-gray-900 dark:text-white text-center">Nothing here yet</Text>
	<Text className="text-base text-gray-500 dark:text-gray-400 text-center">Description of what should go here.</Text>
</View>
```

---

## What NOT to Do During a UI Task

```tsx
// ❌ Renaming a prop while "improving" a component
// Before: onPress
// After: onClick  — breaks every consumer

// ❌ Extracting logic into a new hook during a visual task
// Scope creep — do it in a separate task

// ❌ Changing a FlatList to a ScrollView "because it looks cleaner"
// They behave differently — functional change disguised as visual

// ❌ Removing a className that "seems unused"
// It might be used by a conditional or dark mode variant

// ❌ Adding new API calls or useEffect to a visual component
// Visual tasks are visual only — no new side effects

// ❌ Using hardcoded colors
<Text style={{ color: "#ffffff" }} /> // use className="text-white dark:text-gray-100"
```

---

## Prompt Template: Light Mode Enhancement Request

When asking Claude to add or improve light mode support for a component, use this prompt structure:

---

**Prompt to use:**

> Add light mode support to `[ComponentName]` in `[file path]`. The app uses NativeWind v4 with `darkMode: "class"`. Dark is the default.
>
> Requirements:
>
> - Add the light variant for every `dark:` class that lacks a base class
> - Use the color pairs from `THEME.md` (e.g. `bg-white dark:bg-gray-950` for screens)
> - Do not change any props, handlers, state, or logic
> - Do not change the component's external interface
> - Only modify `className` strings and layout wrapper structure
> - Both modes must look intentional and polished, not just inverted
>
> Here is the current component: [paste component]

---

## Prompt Template: General UI Enhancement

> Enhance the visual design of `[ComponentName]` in `[file path]`.
>
> Goals: [describe what you want — e.g. "more polished card layout", "better spacing", "add subtle shadow"]
>
> Constraints:
>
> - Do not change any props, callbacks, state variables, or data flow
> - Use NativeWind v4 className only — no StyleSheet.create, no inline style objects except `vars()`
> - Ensure both light and dark mode look correct
> - Keep safe area insets where they exist
> - Use patterns from `UI_CHANGES.md`
>
> Here is the current component: [paste component]
