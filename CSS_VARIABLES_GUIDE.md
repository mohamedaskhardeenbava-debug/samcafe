# CSS Variables Guide - Sam Cafe Theme System

## Overview
All colors and shadows in the CSS files now use centralized CSS variables defined in `App.css`. This ensures consistent theming across light/dark modes and allows real-time theme updates via the admin panel.

## Variable Categories

### Theme Modes
- Light theme: `:root` (default)
- Dark theme: `[data-theme="dark"]`

Variables automatically switch based on the current theme.

---

## Core Variables (App.css)

### Background Colors
```css
--bg-main          /* Main page background (white in light, dark in dark) */
--bg-surface       /* Card/surface background */
--bg-theme         /* Full page gradient background */
--bg-hover         /* Hover highlight color */
```

### Text Colors
```css
--text-primary     /* Primary text (black → white) */
--text-secondary   /* Secondary text (grey) */
--text-tertiary    /* Tertiary text (light grey) */
```

### Accent Colors
```css
--color-red        /* Primary accent (changes with theme/preset) */
--color-green      /* Secondary accent (auto-derived from --color-red) */
--color-pale-red   /* Tinted primary accent (for badges, highlights) */
--color-pale-green /* Tinted secondary accent */
```

### Borders & UI Elements
```css
--border-light     /* Border color (adapts to theme) */
--btn-color        /* Default button background */
--floating-btn-shadow-color  /* Shadow color for floating buttons */
```

### Shadows
```css
--shadow-primary   /* General purpose shadow */
--shadow-list      /* Shadow for list items */
--shadow-left      /* Left-aligned shadow */
--shadow-image     /* Shadow for images */
--shadow-bottom    /* Bottom shadow */
--shadow-card-normal     /* Normal card shadow */
--shadow-card-hover      /* Hover card shadow */
--shadow-card-red        /* Red-tinted shadow (for accent cards) */
--shadow-card-red-hover  /* Hovered red-tinted shadow */
--floating-btn-shadow    /* Float button shadow (uses --floating-btn-shadow-color) */
```

### Edge Gradients (3D Push Button Effect)
```css
--edge-color-dark   /* Dark edge for primary accent gradient */
--edge-color-light  /* Light edge for primary accent gradient */
--edge-color-green-dark   /* Dark edge for green accent gradient */
--edge-color-green-light  /* Light edge for green accent gradient */
```

### Filters & Effects
```css
--filter              /* General invert filter for dark mode */
--nutrition-icon-filter  /* Filter for nutrition icons */
--home-btn-filter     /* Filter for home button (derived from accent) */
--foodlist-arrow      /* Arrow color (text-secondary) */
--hot-selector-shadow /* Selector shadow effect */
--fav-ingredient-color /* Favorite ingredient background */
--fav-nutrition-color  /* Favorite nutrition background */
```

---

## How Theming Works

### 1. Light Mode (Default)
When `data-theme` is not set or equals `"light"`:
- Uses light theme variables
- White backgrounds, dark text
- Red accents with bright tints

### 2. Dark Mode
When `data-theme="dark"`:
- Uses dark theme variables
- Dark backgrounds, light text  
- Red accents with dark tints

### 3. Color Derivation
When `--color-red` changes:
1. `--color-green` is auto-derived (split-complementary at +150°)
2. `--color-pale-red` is auto-derived (light tint in light mode, dark in dark mode)
3. `--color-pale-green` is auto-derived from the new green
4. `--shadow-card-red` and `--shadow-card-red-hover` are rebuilt with new color
5. `--edge-color-dark` and `--edge-color-light` are recomputed from hue
6. `--edge-color-green-dark` and `--edge-color-green-light` are recomputed
7. `--home-btn-filter` is recalculated via `hexToFilter()`
8. `--floating-btn-shadow-color` is updated with new RGBA

---

## Files Using CSS Variables

### App.css (Core Variables)
- Defines all `:root` variables for light mode
- Defines `[data-theme="dark"]` variables for dark mode
- Root variables applied by ThemeSettings.tsx

### User Panel CSS Files
- `FoodCategory.css` - Uses accent colors, shadows, and text colors
- `FoodList.css` - Uses accent colors, shadows, drop-shadow filters
- `Welcome.css` - Uses accent colors for wave gradients and input focus
- `FloatingBag.css` - Uses shadow color variables for button shadows
- `CateringForm.css` - Uses text colors and accents
- `ReservationForm.css` - Uses text colors and accents
- `PreBooking.css` - Uses text colors and accents
- All other `.css` files in UserPanel

---

## Color Replacement Guide

### Before (Hardcoded)
```css
box-shadow: 0 12px 30px rgba(243, 55, 22, 0.36);  /* Red shadow */
color: #444;  /* Grey text */
border-color: #f64848;  /* Red border */
filter: drop-shadow(0px 40px 28px rgba(180, 0, 30, 0.55));  /* Red drop shadow */
background: linear-gradient(744deg, #e74c3c, #c0392b 60%, #ff6b35);  /* Red gradient */
```

### After (Variables)
```css
box-shadow: var(--shadow-card-red);  /* Automatically updates with theme */
color: var(--text-secondary);  /* Automatically updates with theme */
border-color: var(--color-red);  /* Automatically updates with theme */
filter: drop-shadow(...) var(--floating-btn-shadow-color);  /* Dynamic shadow */
background: linear-gradient(744deg, var(--color-red), var(--color-red) 60%, var(--bg-hover));
```

---

## Admin Panel Integration

### ThemeSettings Component (ThemeSettings.tsx)
1. **Load**: Reads saved theme from `/theme` API
2. **Edit**: User changes tokens → component updates `--home-btn-filter` and edge colors
3. **Apply Preset**: Loads preset colors → recomputes all derived values
4. **Save**: POSTs to `/theme` API → broadcasts via socket

### Server Broadcast
When theme updates are saved:
```javascript
socket.emit("theme-update", { light: lightTokens, dark: darkTokens });
```

### Client Update (UserPanel)
```javascript
socket.on("theme-update", (payload) => {
  Object.entries(payload.light).forEach(([key, val]) => {
    document.documentElement.style.setProperty(key, val);
  });
  // Similar for dark theme...
});
```

---

## Adding New Color Variables

### Step 1: Add to App.css
```css
:root {
  --my-new-var: #somecolor;
  /* Light mode values */
}

[data-theme="dark"] {
  --my-new-var: #darkcolor;
  /* Dark mode values */
}
```

### Step 2: Add to ThemeSettings.tsx TOKEN_GROUPS
```javascript
{
  group: "New Group",
  tokens: [
    { key: "--my-new-var", label: "My New Variable", type: "color" }
  ]
}
```

### Step 3: Add to LIGHT_DEFAULTS and DARK_DEFAULTS
```javascript
const LIGHT_DEFAULTS = {
  // ...
  "--my-new-var": "#somecolor"
};

const DARK_DEFAULTS = {
  // ...
  "--my-new-var": "#darkcolor"
};
```

### Step 4: Use in CSS
```css
.my-element {
  color: var(--my-new-var);
}
```

---

## Dark/Light Mode Switching

### Automatic Detection
Theme switches based on `data-theme` attribute on `<html>`:
```html
<html data-theme="light">  <!-- or "dark" -->
```

### Manual Toggle
```javascript
document.documentElement.setAttribute("data-theme", "dark");
// or
document.documentElement.setAttribute("data-theme", "light");
```

### CSS Variable Application
All variables automatically apply when theme changes:
- No manual color changes needed
- Components automatically rerender with new values
- Shadows, text, and accents all update together

---

## Testing Theme Changes

### In Browser DevTools Console
```javascript
// Switch to dark mode
document.documentElement.setAttribute("data-theme", "dark");

// Switch back to light
document.documentElement.setAttribute("data-theme", "light");

// Check current variables
getComputedStyle(document.documentElement).getPropertyValue("--color-red");
```

### Via Admin Panel
1. Open ThemeSettings
2. Select a preset or edit tokens manually
3. Click "Save & Apply"
4. Changes broadcast to all connected clients via WebSocket

---

## Responsive Design Variables

Variables also include responsive padding:
```css
--mobile-page-padding: 10px;
--medium-page-padding: 24px;
```

Used in responsive breakpoints for consistent spacing.

---

## Summary: CSS Variable Hierarchy

```
App.css (:root, [data-theme="dark"])
    ↓
ThemeSettings component (loads/updates)
    ↓
Socket.io broadcast (server → clients)
    ↓
CSS files (use var(--name))
    ↓
User sees themed UI
```

All components automatically stay in sync with the admin panel theme settings.
