# Add to Home Screen (Web App)

The app is set up as a **web app** that users can add to their phone’s home screen via Safari’s **“Add to Home Screen”** (and equivalent in other browsers). It is not a native mobile app; it runs in a browser and can be installed as a shortcut that opens in standalone mode.

---

## What Was Done

### 1. Web App Manifest (`public/manifest.webmanifest`)

- **name / short_name:** “Porygon Meal Planner” / “Meal Planner” (used when adding to home screen).
- **start_url:** `/` so the app opens at the root.
- **display:** `standalone` so it opens without browser UI (no address bar/tabs).
- **theme_color:** `#10b981` (emerald) for status bar / browser chrome.
- **background_color:** `#f0fdf4` for splash/background.
- **orientation:** `portrait-primary` (can be relaxed if you want rotation).
- **icons:** One SVG icon (`/icon.svg`) so the app has a home screen icon without requiring PNGs.

### 2. Apple / iOS (Safari) in `index.html`

- **apple-mobile-web-app-capable:** `yes` so iOS can run it in standalone (“web app”) mode.
- **apple-mobile-web-app-status-bar-style:** `default` (optional: `black`, `black-translucent`).
- **apple-mobile-web-app-title:** “Meal Planner” (label under the icon).
- **apple-touch-icon:** `href="/icon.svg"` so Safari can use an icon when adding to home screen.

### 3. General Meta and Links in `index.html`

- **theme-color:** Matches manifest for Android/browsers that support it.
- **viewport:** `viewport-fit=cover` so layout can extend into safe areas on notched devices.
- **description:** Short description for the app.
- **manifest:** `<link rel="manifest" href="/manifest.webmanifest" />` so the manifest is used when “Add to Home Screen” is available.

### 4. Safe Area (Notched Devices)

- In **theme.css**, `html` has:
  - `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);`
- When the app is opened from the home screen in standalone mode, this keeps content out from behind the notch and home indicator.

### 5. App Icon (`public/icon.svg`)

- Single SVG used for the manifest and as `apple-touch-icon`.
- Simple emerald-style icon so the app has a recognizable home screen icon without adding PNGs.

---

## How Users Add to Home Screen

### iOS (Safari)

1. Open the app in **Safari** (must be Safari, not in-app browsers).
2. Tap the **Share** button.
3. Tap **“Add to Home Screen”**.
4. Edit the name if desired and tap **Add**.

The app will then open from the home screen in standalone mode (no Safari UI).

### Android (Chrome)

1. Open the app in **Chrome**.
2. Tap the menu (⋮) → **“Add to Home screen”** or **“Install app”** (if supported).
3. Confirm.

---

## Optional: Better iOS Icon

Safari on iOS often prefers a **PNG** for the home screen icon (e.g. 180×180 px). If you add:

- **`public/icon-180.png`** (180×180)

and in `index.html` add or replace:

```html
<link rel="apple-touch-icon" href="/icon-180.png" />
```

then iOS will use that PNG. The SVG is still used by the manifest and works in many browsers.

---

## Deployment Note

“Add to Home Screen” works over **HTTP** for local testing, but for production you should serve the app over **HTTPS** so browsers treat it as a secure web app and enable all PWA-related behavior.
