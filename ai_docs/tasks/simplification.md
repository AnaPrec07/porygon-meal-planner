# Code Simplification

This document lists changes made to simplify the codebase: removing unnecessary lines, reducing duplication, and trimming verbose data and logic while keeping the app functional.

---

## 1. Goals

- **Cut lines:** Remove or shrink large blocks of code that don’t add essential behavior.
- **Reduce duplication:** Single source of truth for mock/placeholder data; one auth entrypoint.
- **Keep behavior:** Auth, chat, onboarding, tabs (Chat, Meal Plan, Grocery, Inventory), and API contract unchanged.

---

## 2. Summary of Changes

| Area | Before | After | Lines saved (approx.) |
|------|--------|--------|------------------------|
| **App.tsx** | 813 lines, huge inline data | ~300 lines, data in mockData.ts | ~500 |
| **api.ts** | 160 lines, session + sessionWithName, AuthResponse | ~150 lines, single session(), no unused type | ~10 |
| **AuthContext** | sessionWithName(idToken, name) | session(idToken, name) | 0 (consistency) |
| **server/database.py** | Multi-line list comps and comments | Shorter returns and docstring | ~15 |
| **server/app.py** | Long module docstring | One-line docstring | ~3 |
| **New** | — | src/app/mockData.ts | +45 (centralized data) |

**Net:** Large reduction in App.tsx; small trims elsewhere; one new small file for shared mock data.

---

## 3. Frontend

### 3.1 App.tsx

- **Mock data moved out:** All hardcoded grocery items (10), inventory items (7), and the 3-day meal plan (9 meals with full ingredients/instructions) were replaced by small placeholder arrays in **`src/app/mockData.ts`**:
  - `DEFAULT_GROCERY_ITEMS`: 3 items.
  - `DEFAULT_INVENTORY_ITEMS`: 2 items.
  - `DEFAULT_WEEKLY_MEAL_PLAN`: 1 day, 1 meal with short ingredients/instructions.
  - `WEEKLY_GOALS`: 2 items (was 3).
  - `UPCOMING_MILESTONES`: 3 short strings.
- **Onboarding:** Replaced the long `handleOnboardingResponse` with a single `applyOnboardingStep(current, message)` driven by an ordered list of keys (`ONBOARDING_KEYS`). Same flow (allergies → dislike → like → meals per day → preference → goals → bad habits → body scan/skip), less branching.
- **Chat init:** Welcome message is set once in the same `useEffect` that calls `loadUserData()`, with a shorter string. No separate `initializeChat()`.
- **Handlers inlined:** `handleToggleGroceryItem` and `handleInventoryUpdate` replaced by inline `setGroceryItems` / `setInventoryItems` lambdas where the components are used.
- **Loading UI:** Replaced the multi-element loading screen with a single “Loading...” line.
- **Sidebar:** Extracted repeated sidebar content into a `sidebarContent` variable and reused it for mobile and desktop. Removed redundant comments and shortened class names (e.g. `bg-black bg-opacity-50` → `bg-black/50`).
- **Badges:** `formattedBadges` now uses a small `iconOrder` array for typing instead of an inline `as const` that triggered a linter error.
- **Error message:** Generic “Something went wrong” / “Try again?” instead of longer copy.

### 3.2 api.ts

- **Removed `sessionWithName`:** It only called `session(idToken, name)`. All callers (e.g. AuthContext register) now use `api.session(idToken, name)`.
- **Removed `AuthResponse`:** Unused; the only auth return type used is `{ user: User }` from `session()` and the backend.
- **Docstring:** Shortened to one line.

### 3.3 AuthContext.tsx

- **Register:** Switched from `api.sessionWithName(idToken, name)` to `api.session(idToken, name)`.

### 3.4 New file: src/app/mockData.ts

- Holds all default/mock data for grocery, inventory, meal plan, weekly goals, and milestones. Keeps App.tsx focused on behavior and avoids long inline arrays.

---

## 4. Backend (server)

### 4.1 database.py

- **Module docstring:** One short line.
- **get_preferences:** Return written as a single conditional expression (`None if not pref else { ... }`) instead of an if/return/return.
- **get_progress_entries / get_badges:** List comprehensions kept on one line to save vertical space; behavior unchanged.

### 4.2 app.py

- **Module docstring:** Replaced multi-line description with one line.

No route logic, auth, or response shapes were changed.

---

## 5. What Was Not Changed

- **Auth flow:** Firebase Auth + backend session; same endpoints and tokens.
- **API contract:** All existing endpoints and request/response shapes unchanged.
- **Tabs and features:** Chat, Meal Plan, Grocery, Inventory, RewardsPanel, WeeklyOutlook still work the same.
- **Onboarding behavior:** Same steps and backend persistence; only the frontend implementation is more compact.
- **Server routes and middleware:** Same routes and Firebase verification.
- **AI (ai_service.py, ai_vertex.py):** Unchanged; only app/database/api were simplified.

---

## 6. Possible Follow-ups

- **Meal plan from API:** The app still uses `DEFAULT_WEEKLY_MEAL_PLAN` from mockData. A future step could load the meal plan from `api.getMealPlan(week_start_date)` when available and fall back to this default.
- **Grocery/Inventory from API:** Similarly, grocery and inventory could later be loaded from the backend instead of mockData.
- **Welcome message timing:** The welcome message is set in the same effect as `loadUserData()` and uses current `preferences`; right after login, `preferences` may still be null, so the first message can be the onboarding one even for returning users until preferences load. A follow-up could set the welcome message in a separate effect that runs when `preferences` is set.

---

## 7. File List

| File | Action |
|------|--------|
| `src/app/App.tsx` | Simplified (mock data, onboarding, sidebar, handlers, loading, badges). |
| `src/app/mockData.ts` | **Added** – default grocery, inventory, meal plan, goals, milestones. |
| `src/lib/api.ts` | Removed `sessionWithName`, `AuthResponse`; shortened docstring. |
| `src/contexts/AuthContext.tsx` | Register uses `api.session(idToken, name)`. |
| `server/database.py` | Shorter docstring and return/list-comp formatting. |
| `server/app.py` | Shorter docstring. |

No files were deleted; only content was simplified or moved.
