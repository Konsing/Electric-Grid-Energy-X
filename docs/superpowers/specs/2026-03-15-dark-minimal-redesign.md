# Dark Minimal Redesign — Design Spec

## Overview

Cosmetic-only refresh of the EGX web app. No logic changes, no element removal. Lock to dark mode, apply sharp & minimal visual language inspired by Vercel/Stripe. Login page gets a split-screen layout with background image.

## Scope

- **Web app only** (apps/web). Mobile app is not affected.
- **Cosmetic only** — no changes to API calls, routing, auth logic, or data flow.
- **All existing UI elements preserved** — monthly usage chart, recent bills, active outages, stat cards, billing table, notifications, admin panels, etc.

## Design Decisions

### 1. Dark Mode Only

Execution order (prevents runtime crashes):
1. Remove `useTheme` imports and all `isDark`/`toggleTheme` usage from Navigation.tsx and login/page.tsx
2. Remove Sun/Moon lucide-react imports from those files
3. Remove `ThemeProvider` wrapper from providers.tsx (keep AuthProvider)
4. Delete `apps/web/src/lib/theme-context.tsx`
5. Remove all `dark:` class prefixes — make dark classes the only classes
6. Remove `darkMode: 'class'` from Tailwind config
7. Set `<html>` to always have dark background
- Mobile app theme system is **not affected**

### 2. Color System (Zinc Palette)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#09090b` (zinc-950) | Page background |
| Surface | `#18181b` (zinc-900) | Cards, panels |
| Border | `#27272a` (zinc-800) | All borders |
| Text primary | `#fafafa` (zinc-50) | Headings, values |
| Text secondary | `#a1a1aa` (zinc-400) | Labels, descriptions |
| Text muted | `#71717a` (zinc-500) | Tertiary text, placeholders |
| Brand | `#3b82f6` (blue-500) | Logo, chart bars, links |
| Brand hover | `#2563eb` (blue-600) | Link hover states |

**Brand migration:** Replace all `brand-*` Tailwind classes with `blue-*` equivalents (brand-500 → blue-500, brand-600 → blue-500, brand-700 → blue-600). Remove the custom `brand` palette from tailwind.config.ts.

### 3. Login Page — Split Screen

- Full viewport height, two equal halves
- **Left half**: `background.png` from `public/`, `object-cover`, with a dark gradient overlay (`bg-gradient-to-t from-black/80 to-black/20`) and brand text anchored to bottom-left (EGX logo + tagline)
- **Right half**: Dark background (#09090b), vertically centered login form
- Primary button: white background, dark text (`bg-zinc-50 text-zinc-950`)
- Demo accounts section: zinc-800 border, zinc-400 text
- No card wrapper — form elements sit directly on the dark background
- Register link below form

### 4. Navigation Bar

- Background: `#09090b` with `border-b border-zinc-800`
- Logo "EGX": `text-blue-500 font-extrabold`
- Active tab: `bg-zinc-800 text-zinc-50 rounded-md` pill
- Inactive tabs: `text-zinc-400 hover:text-zinc-200`
- Admin/tech items: `text-yellow-400` (keep existing yellow distinction)
- Active admin/tech tab: `bg-yellow-900/30 text-yellow-400 rounded-md`
- User name + role badge in zinc-400/zinc-800
- Logout: `text-zinc-500 hover:text-zinc-200`
- No theme toggle

### 5. Cards & Surfaces

- Background: `bg-zinc-900`
- Border: `border border-zinc-800`
- Border radius: `rounded-lg` (was `rounded-xl`)
- No shadows (remove all `shadow-sm`)
- Internal dividers: `border-zinc-800`

### 6. Typography

- Stat numbers: `text-3xl font-extrabold tracking-tight` with unit in `text-sm text-zinc-500`
- Section headings: `font-bold tracking-tight text-zinc-50`
- Labels: `text-xs uppercase tracking-wide text-zinc-500`
- Body text: `text-zinc-400`
- Monospace (account numbers, serials): `font-mono text-zinc-300`

### 7. Status Badges

Pill shape (`rounded-full`), dark tinted backgrounds:

| Status | Background | Text |
|--------|------------|------|
| PAID / ACTIVE / RESOLVED | `bg-green-950` | `text-green-400` |
| ISSUED / IN_PROGRESS | `bg-blue-950` | `text-blue-400` |
| OVERDUE / CRITICAL | `bg-red-950` | `text-red-400` |
| SUSPENDED / HIGH | `bg-orange-950` | `text-orange-400` |
| MEDIUM / MAINTENANCE | `bg-yellow-950` | `text-yellow-400` |
| LOW / REPORTED / INACTIVE | `bg-zinc-800` | `text-zinc-300` |
| ADMIN role | `bg-zinc-800` | `text-zinc-200` |
| TECHNICIAN role | `bg-zinc-800` | `text-zinc-200` |
| CUSTOMER role | `bg-zinc-800` | `text-zinc-200` |

### 8. Buttons

- Primary: `bg-zinc-50 text-zinc-950 hover:bg-zinc-200 rounded-md font-semibold`
- Secondary: `border border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-md`
- Danger: `bg-red-950 text-red-400 hover:bg-red-900 rounded-md`
- Pay button (billing): primary style

### 9. Tables (Billing, Admin Accounts)

- Container: `rounded-lg border border-zinc-800 overflow-hidden`
- Header: `bg-zinc-800` (distinct from card surface)
- Rows: `hover:bg-zinc-800/50`
- Cells: existing padding preserved
- Dividers: `divide-zinc-800`

### 10. Monthly Usage Chart (Dashboard)

- Bars: `bg-blue-500`, current month highlighted with `border border-blue-400`
- Month labels: `text-zinc-500`, current month `text-zinc-50 font-semibold`
- kWh values on hover: `text-zinc-300`
- Chart background: inherits card surface (zinc-900)

### 11. Notifications

- Unread indicator: `border-l-4 border-l-blue-500` (keep existing)
- Read notifications: no left border
- Type badges: follow status badge pattern above
- Mark read button: secondary button style

### 12. Forms (Register page, Pay modal, Admin forms)

- Input/textarea/select background: `bg-zinc-900`
- Input/textarea/select border: `border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50`
- Input text: `text-zinc-100`
- Placeholder: `text-zinc-600`
- Labels: `text-zinc-300`
- Error alerts: `bg-red-950 text-red-400 border border-red-900 rounded-lg`
- Disabled buttons: `disabled:opacity-50` (preserve existing)
- Empty states: `text-zinc-500`

### 13. Login Page — Demo Section

- Container: `border border-zinc-800 rounded-lg p-4` (no background, just border)
- Heading "Demo Accounts": `text-sm font-medium text-zinc-400`
- Buttons: `border border-zinc-700 text-zinc-400 hover:bg-zinc-800 rounded-md`

### 14. Responsive Behavior

- Split-screen login: below `md` breakpoint, hide image half, show full-width dark form
- All other pages: preserve existing responsive behavior (grid-cols responsive breakpoints unchanged)

## Files Affected

- `apps/web/tailwind.config.ts` — remove darkMode, remove brand palette, update theme
- `apps/web/src/app/globals.css` — set dark body background
- `apps/web/src/app/layout.tsx` — set dark class on html
- `apps/web/src/app/providers.tsx` — remove ThemeProvider wrapper
- `apps/web/src/lib/theme-context.tsx` — delete (web only)
- `apps/web/src/app/page.tsx` — update loading/redirect page colors
- `apps/web/src/components/Navigation.tsx` — restyle, remove toggle
- `apps/web/src/app/login/page.tsx` — split screen layout
- `apps/web/src/app/register/page.tsx` — dark form styling
- `apps/web/src/app/(authenticated)/layout.tsx` — update loading state colors
- `apps/web/src/app/(authenticated)/dashboard/page.tsx` — dark cards, stats, chart
- `apps/web/src/app/(authenticated)/billing/page.tsx` — dark table
- `apps/web/src/app/(authenticated)/outages/page.tsx` — dark cards
- `apps/web/src/app/(authenticated)/notifications/page.tsx` — dark cards
- `apps/web/src/app/(authenticated)/account/page.tsx` — dark profile
- `apps/web/src/app/(authenticated)/admin/accounts/page.tsx` — dark table
- `apps/web/src/app/(authenticated)/admin/outages/page.tsx` — dark cards
- `apps/web/src/app/(authenticated)/admin/meters/page.tsx` — dark cards/forms

## Post-Implementation Verification

- Grep for remaining `dark:` prefixes in `apps/web/src/` — should be zero
- Grep for `bg-white`, `text-gray-`, `bg-gray-`, `border-gray-`, `bg-slate-`, `text-slate-` — should be zero
- Grep for `brand-` — should be zero
- All status badges should use `rounded-full`

## Not Affected

- Mobile app (`apps/mobile/`) — keeps its own theme system
- API (`apps/api/`) — no changes
- Shared packages (`packages/ui/`) — components are unused by web app; left as-is
- All routing, auth, data fetching, business logic — untouched
