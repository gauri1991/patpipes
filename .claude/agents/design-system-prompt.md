# Patent Analytics Platform - Complete Design System Reference

You are a design-system-aware assistant. This document is the single source of truth for every visual element, token, pattern, and convention used in the Patent Analytics Platform UI. Always reference this when building, reviewing, or modifying components.

---

## 1. FOUNDATION

### Framework & Tooling
| Tool | Version/Detail |
|------|----------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS (class-based dark mode) |
| UI Library | shadcn/ui (default style, slate base, HSL CSS vars) |
| Animations | Framer Motion + Tailwind keyframes |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |
| Fonts | Inter (Google Fonts, `--font-inter`, `display: swap`) |
| Class Utility | `cn()` — `clsx` + `twMerge` (`@/lib/utils`) |
| PostCSS | tailwindcss + autoprefixer |

### Content Paths (tailwind.config.ts)
```
src/pages/**/*.{js,ts,jsx,tsx,mdx}
src/components/**/*.{js,ts,jsx,tsx,mdx}
src/app/**/*.{js,ts,jsx,tsx,mdx}
src/domains/**/*.{js,ts,jsx,tsx,mdx}
```

### Shadcn/ui Path Aliases (components.json)
```json
{
  "components": "@/components",
  "ui": "@/components/ui",
  "utils": "@/lib/utils",
  "lib": "@/lib",
  "hooks": "@/hooks"
}
```

---

## 2. COLOR SYSTEM

### 2.1 CSS Variable Tokens (HSL)

All theme colors are defined as HSL values in CSS custom properties and consumed via `hsl(var(--token))`.

#### Light Theme (`:root`)
| Token | HSL | Approx Hex | Usage |
|-------|-----|-----------|-------|
| `--background` | 0 0% 100% | #FFFFFF | Page background |
| `--foreground` | 210 24% 16% | #1E293B | Default text |
| `--card` | 0 0% 100% | #FFFFFF | Card backgrounds |
| `--card-foreground` | 210 24% 16% | #1E293B | Card text |
| `--popover` | 0 0% 100% | #FFFFFF | Popover/dropdown bg |
| `--popover-foreground` | 210 24% 16% | #1E293B | Popover text |
| `--primary` | 207 26% 45% | #55728A | Buttons, links, accents |
| `--primary-foreground` | 0 0% 98% | #FAFAFA | Text on primary |
| `--secondary` | 30 8% 66% | #ADA9A1 | Secondary elements |
| `--secondary-foreground` | 210 24% 16% | #1E293B | Text on secondary |
| `--muted` | 210 8% 96% | #F4F5F6 | Muted backgrounds |
| `--muted-foreground` | 210 12% 45% | #647080 | De-emphasized text |
| `--accent` | 180 2% 70% | #B1B4B3 | Accent elements |
| `--accent-foreground` | 210 24% 16% | #1E293B | Text on accent |
| `--destructive` | 0 65% 55% | #D93B3B | Errors, danger |
| `--destructive-foreground` | 0 0% 98% | #FAFAFA | Text on destructive |
| `--border` | 210 14% 89% | #DFE3E8 | Borders |
| `--input` | 210 14% 89% | #DFE3E8 | Input borders |
| `--ring` | 207 26% 45% | #55728A | Focus rings |
| `--radius` | 0.5rem | 8px | Base border-radius |

#### Dark Theme (`.dark`)
| Token | HSL | Approx Hex |
|-------|-----|-----------|
| `--background` | 210 24% 8% | #101820 |
| `--foreground` | 0 0% 95% | #F2F2F2 |
| `--card` | 210 24% 10% | #141E28 |
| `--card-foreground` | 0 0% 95% | #F2F2F2 |
| `--popover` | 210 24% 10% | #141E28 |
| `--popover-foreground` | 0 0% 95% | #F2F2F2 |
| `--primary` | 207 26% 55% | #6B8CA8 |
| `--primary-foreground` | 210 24% 8% | #101820 |
| `--secondary` | 30 8% 25% | #423F3A |
| `--secondary-foreground` | 0 0% 95% | #F2F2F2 |
| `--muted` | 210 12% 18% | #272E36 |
| `--muted-foreground` | 210 8% 65% | #9BA4AE |
| `--accent` | 180 2% 30% | #4A4D4C |
| `--accent-foreground` | 0 0% 95% | #F2F2F2 |
| `--destructive` | 0 62% 45% | #BA2B2B |
| `--destructive-foreground` | 0 0% 98% | #FAFAFA |
| `--border` | 210 12% 18% | #272E36 |
| `--input` | 210 12% 18% | #272E36 |
| `--ring` | 207 26% 55% | #6B8CA8 |

#### Chart Colors
| Token | HSL | Usage |
|-------|-----|-------|
| `--chart-1` | 207 26% 45% | Primary series |
| `--chart-2` | 145 35% 55% | Success/positive |
| `--chart-3` | 30 70% 60% | Warning/amber |
| `--chart-4` | 0 65% 55% | Error/negative |
| `--chart-5` | 260 30% 60% | Purple/misc |

### 2.2 ElevenLabs Extended Palette (tailwind.config.ts)

#### Neutral (el-neutral)
| Step | Hex |
|------|-----|
| 50 | #F9F9F9 |
| 100 | #F5F5F5 |
| 200 | #EEEEEE |
| 300 | #E6E6E6 |
| 400 | #CCCCCC |
| 500 | #A6A6A6 |
| 600 | #808080 |
| 700 | #595959 |
| 800 | #404040 |
| 900 | #2D2D2D |
| 950 | #1A1A1A |

Also: `el-black: #000000`, `el-white: #FFFFFF`

#### Cyan (Primary Accent)
| Step | Hex |
|------|-----|
| 50 | #E0FFFF |
| 100 | #B3FFFF |
| 200 | #80FFFF |
| 300 | #4DFFFF |
| 400 | #1AE6FF |
| **500** | **#00D9FF** |
| 600 | #00B8D4 |
| 700 | #009BBC |
| 800 | #006B87 |
| 900 | #003D52 |

#### Blue (Secondary Accent)
| Step | Hex |
|------|-----|
| 50 | #E6F0FF |
| 100 | #CCE0FF |
| 200 | #99C2FF |
| 300 | #66A3FF |
| **400** | **#3A86FF** |
| 500 | #2E68DB |
| 600 | #2354B8 |
| 700 | #1F47B6 |
| 800 | #163399 |
| 900 | #0D1F7A |

#### Magenta (Tertiary Accent)
| Step | Hex |
|------|-----|
| 50 | #FFE0F0 |
| 100 | #FFB3D9 |
| 200 | #FF80C2 |
| 300 | #FF4DAB |
| 400 | #FF1A94 |
| **500** | **#FF006E** |
| 600 | #D90057 |
| 700 | #B20040 |
| 800 | #7A0029 |
| 900 | #520019 |

#### Yellow (Warning / Highlight)
| Step | Hex |
|------|-----|
| 50 | #FFFDE0 |
| 100 | #FFFAB3 |
| 200 | #FFF680 |
| 300 | #FFF24D |
| 400 | #FFED1A |
| **500** | **#FFD60A** |
| 600 | #E8C50A |
| 700 | #D4B208 |
| 800 | #8B7205 |
| 900 | #5A4A03 |

### 2.3 Contextual Color Usage

| Context | Light | Dark |
|---------|-------|------|
| Success bg | `bg-green-50` | — |
| Success border | `border-green-200` | — |
| Success text | `text-green-600` / `text-green-700` | — |
| Warning bg | `bg-yellow-50` | — |
| Warning border | `border-yellow-200` | — |
| Warning text | `text-yellow-600` / `text-yellow-700` | — |
| Error bg | `bg-red-50` | — |
| Error border | `border-red-200` | — |
| Error text | `text-red-700` / `text-destructive` | — |
| Urgency low | `bg-green-100 text-green-700` | — |
| Urgency medium | `bg-yellow-100 text-yellow-700` | — |
| Urgency high | `bg-red-100 text-red-700` | — |

---

## 3. TYPOGRAPHY

### Font Stack
```
font-family: var(--font-inter), system-ui, sans-serif;
```
Body: `antialiased`, `font-feature-settings: "rlig" 1, "calt" 1`

### Scale
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-xs` | 12px | 400 | Badges, meta, timestamps |
| `text-sm` | 14px | 400–500 | Labels, descriptions, table cells |
| `text-base` | 16px | 400 | Body text |
| `text-lg` | 18px | 600 | Card titles (small) |
| `text-xl` | 20px | 600 | Section sub-headings |
| `text-2xl` | 24px | 600 | Card titles (default) |
| `text-3xl` | 30px | 700 | Page headings |
| `text-4xl` | 36px | 700 | Large headings |
| `text-5xl` | 48px | 700 | Hero sub-title |
| `text-6xl` | 60px | 700 | Hero headline |
| `text-7xl` | 72px | 700 | Hero headline (lg) |

### Weights Used
| Weight | Class | Usage |
|--------|-------|-------|
| 400 | `font-normal` | Body, descriptions |
| 500 | `font-medium` | Labels, button text |
| 600 | `font-semibold` | Nav links, card titles, sidebar |
| 700 | `font-bold` | Headings, stats, hero |

### Special Typography
- **Gradient text**: `bg-gradient-to-r from-cyan-500 via-blue-500 to-magenta-500 bg-clip-text text-transparent`
- **Tracking tight**: `tracking-tight` on headings (3xl+)
- **Leading tight**: `leading-[1.1]` on hero headlines
- **Leading relaxed**: `leading-relaxed` on body paragraphs

---

## 4. SPACING

### Base: 4px (Tailwind default)

| Class | Value | Common Usage |
|-------|-------|-------------|
| 1 | 4px | Tiny gaps |
| 1.5 | 6px | Badge padding-y, form item spacing |
| 2 | 8px | Icon gaps, small padding |
| 3 | 12px | Button/input padding-x (sm) |
| 4 | 16px | Card content spacing, standard gap |
| 5 | 20px | Sidebar gap-y |
| 6 | 24px | Card padding (p-6), section gap |
| 8 | 32px | Large sections, card content-y (py-8) |
| 10 | 40px | CTA section padding (py-10) |
| 12 | 48px | Section padding |
| 16 | 64px | Top nav height (h-16) |
| 20 | 80px | Section vertical padding (py-20) |
| 28 | 112px | Hero vertical padding (py-28) |

### Container
- Centered: yes
- Padding: 2rem (32px)
- Max-width breakpoints: sm:640, md:768, lg:1024, xl:1280, 2xl:1400

---

## 5. BORDER RADIUS

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | calc(0.5rem - 4px) = 4px | Tab triggers, tiny elements |
| `rounded-md` | calc(0.5rem - 2px) = 6px | Buttons, inputs, selects |
| `rounded-lg` | 0.5rem = 8px | Cards, dialogs, popovers |
| `rounded-xl` | 12px | Large cards, sections |
| `rounded-2xl` | 16px | Hero sections, pricing cards |
| `rounded-full` | 9999px | Badges, avatars, pill buttons |

---

## 6. SHADOWS

| Class | Usage |
|-------|-------|
| `shadow-sm` | Cards (default), top nav |
| `shadow-md` | Dropdowns, popovers, tooltips |
| `shadow-lg` | Dialogs, modals, hover cards |
| `shadow-xl` | Contact form card, dropdown menus |
| `shadow-2xl` | Login card, hero pricing, hover CTAs |

---

## 7. RESPONSIVE BREAKPOINTS

| Prefix | Min-width | Usage |
|--------|-----------|-------|
| `sm:` | 640px | Phone landscape |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop (sidebar visible) |
| `xl:` | 1280px | Wide desktop |
| `2xl:` | 1400px | Ultra-wide |

### Common Responsive Patterns
```
Mobile stack → Desktop row:  flex flex-col md:flex-row
Mobile hide:                 hidden md:block  /  hidden lg:flex
Grid columns:                grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
Sidebar toggle:              lg:w-72 (expanded)  lg:w-16 (collapsed)
```

---

## 8. COMPONENT CATALOG

### 8.1 Button (`/components/ui/button.tsx`)

**Base**: `inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0`

| Variant | Classes |
|---------|---------|
| **default** | `bg-primary text-primary-foreground hover:bg-primary/90` |
| **destructive** | `bg-destructive text-destructive-foreground hover:bg-destructive/90` |
| **outline** | `border border-input bg-background hover:bg-accent hover:text-accent-foreground` |
| **secondary** | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| **ghost** | `hover:bg-accent hover:text-accent-foreground` |
| **link** | `text-primary underline-offset-4 hover:underline` |

| Size | Classes |
|------|---------|
| **default** | `h-10 px-4 py-2` |
| **sm** | `h-9 rounded-md px-3` |
| **lg** | `h-11 rounded-md px-8` |
| **icon** | `h-10 w-10` |

**Gradient CTA** (custom, used in pre-login pages):
```
bg-gradient-to-r from-cyan-500 to-blue-600
hover:from-cyan-600 hover:to-blue-700
text-white shadow-lg hover:shadow-xl
```

### 8.2 Card (`/components/ui/card.tsx`)

| Part | Classes |
|------|---------|
| **Card** | `rounded-lg border bg-card text-card-foreground shadow-sm` |
| **CardHeader** | `flex flex-col space-y-1.5 p-6` |
| **CardTitle** | `text-2xl font-semibold leading-none tracking-tight` |
| **CardDescription** | `text-sm text-muted-foreground` |
| **CardContent** | `p-6 pt-0` |
| **CardFooter** | `flex items-center p-6 pt-0` |

### 8.3 Badge (`/components/ui/badge.tsx`)

**Base**: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2`

| Variant | Classes |
|---------|---------|
| **default** | `border-transparent bg-primary text-primary-foreground hover:bg-primary/80` |
| **secondary** | `border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| **destructive** | `border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80` |
| **outline** | `text-foreground` |

### 8.4 Input (`/components/ui/input.tsx`)

**Base**: `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`

### 8.5 Textarea (`/components/ui/textarea.tsx`)

Same as Input but: `min-h-[80px]` and no fixed height.

### 8.6 Label (`/components/ui/label.tsx`)

**Base**: `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70`

### 8.7 Select (`/components/ui/select.tsx`)

| Part | Classes |
|------|---------|
| **Trigger** | `flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50` |
| **Content** | `z-50 max-h-96 min-w-[8rem] rounded-md border bg-popover shadow-md` |
| **Item** | `relative flex cursor-default items-center py-1.5 pl-8 pr-2 text-sm focus:bg-accent focus:text-accent-foreground` |

### 8.8 Table (`/components/ui/table.tsx`)

| Part | Classes |
|------|---------|
| **Table** | `w-full caption-bottom text-sm` (wrapped in `overflow-auto`) |
| **TableHead** | `h-12 px-4 text-left align-middle font-medium text-muted-foreground` |
| **TableRow** | `border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted` |
| **TableCell** | `p-4 align-middle` |

### 8.9 Tabs (`/components/ui/tabs.tsx`)

| Part | Classes |
|------|---------|
| **TabsList** | `inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground` |
| **TabsTrigger** | `inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm` |
| **TabsContent** | `mt-2 focus-visible:ring-2 focus-visible:ring-ring` |

### 8.10 Dialog (`/components/ui/dialog.tsx`)

| Part | Classes |
|------|---------|
| **Overlay** | `fixed inset-0 z-50 bg-background/80 backdrop-blur-sm` |
| **Content** | `fixed left-[50%] top-[50%] z-50 flex flex-col w-full max-w-lg max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg rounded-lg overflow-y-auto` |
| **Header** | `flex flex-col space-y-1.5 text-center sm:text-left` |
| **Footer** | `flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2` |
| **Title** | `text-lg font-semibold leading-none tracking-tight` |
| **Description** | `text-sm text-muted-foreground` |

#### Dialog Rules — ALWAYS follow these

1. **Never let a dialog overflow the viewport.** The base `DialogContent` enforces `max-h-[90vh] overflow-y-auto` globally. Do not override or remove these classes.

2. **For simple dialogs** (short forms, confirmations): the base classes handle everything. No extra work needed.

3. **For tall/complex dialogs** (forms with many fields, expandable sections like Advanced Options): use the sticky header+footer pattern so only the body scrolls:

```tsx
<DialogContent className="sm:max-w-lg flex flex-col max-h-[88vh]">
  {/* Header stays pinned at top */}
  <DialogHeader className="shrink-0">
    <DialogTitle>...</DialogTitle>
    <DialogDescription>...</DialogDescription>
  </DialogHeader>

  {/* Body scrolls independently */}
  <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
    {/* form fields, expandable sections, etc. */}
  </div>

  {/* Footer stays pinned at bottom */}
  <DialogFooter className="shrink-0 pt-2 border-t">
    <Button variant="outline">Cancel</Button>
    <Button>Submit</Button>
  </DialogFooter>
</DialogContent>
```

4. **Size overrides** (applied on `DialogContent` className):
   - Narrow / confirmation: `sm:max-w-sm`
   - Default: `sm:max-w-md`
   - Wide forms (with Advanced Options or multi-column): `sm:max-w-lg`
   - Extra wide (tables, previews): `sm:max-w-2xl` or `sm:max-w-4xl`

5. **`pr-1` on scrollable body**: adds a small right gutter so the native scrollbar doesn't overlap form elements.

6. **Never use fixed pixel heights** on dialog content. Always use viewport-relative `max-h-[Xvh]`.

### 8.11 Sheet (Side Panel) (`/components/ui/sheet.tsx`)

| Part | Classes |
|------|---------|
| **Overlay** | `fixed inset-0 z-50 bg-black/80` |
| **Side right** | `fixed inset-y-0 right-0 z-50 h-full gap-4 border-l bg-background p-6 shadow-lg sm:max-w-sm` |
| **Side left** | `fixed inset-y-0 left-0 z-50 h-full gap-4 border-r bg-background p-6 shadow-lg sm:max-w-sm` |

### 8.12 Dropdown Menu (`/components/ui/dropdown-menu.tsx`)

| Part | Classes |
|------|---------|
| **Content** | `z-50 min-w-[8rem] rounded-md border bg-popover p-1 shadow-md` |
| **Item** | `relative flex cursor-default items-center gap-2 py-1.5 px-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground` |
| **Label** | `px-2 py-1.5 text-sm font-semibold` |
| **Separator** | `-mx-1 my-1 h-px bg-muted` |
| **Shortcut** | `ml-auto text-xs tracking-widest opacity-60` |

### 8.13 Tooltip (`/components/ui/tooltip.tsx`)

**Content**: `z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95`
**Default delay**: 250ms

### 8.14 Popover (`/components/ui/popover.tsx`)

**Content**: `z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none`

### 8.15 Progress (`/components/ui/progress.tsx`)

- **Track**: `relative h-4 w-full overflow-hidden rounded-full bg-secondary`
- **Indicator**: `h-full w-full flex-1 bg-primary transition-all`

### 8.16 Switch (`/components/ui/switch.tsx`)

- **Root**: `h-6 w-11 rounded-full data-[state=checked]:bg-primary data-[state=unchecked]:bg-input`
- **Thumb**: `h-5 w-5 rounded-full bg-background shadow-lg translate-x-0 data-[state=checked]:translate-x-5`

### 8.17 Checkbox (`/components/ui/checkbox.tsx`)

- **Root**: `h-4 w-4 shrink-0 rounded-sm border border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground`

### 8.18 Skeleton (Loading)

```
animate-pulse rounded-md bg-muted
```

### 8.19 Alert (`/components/ui/alert.tsx`)

- **Base**: `relative w-full rounded-lg border p-4`
- **default variant**: `bg-background text-foreground`
- **destructive variant**: `border-destructive/50 text-destructive`

### 8.20 Separator (`/components/ui/separator.tsx`)

- **Horizontal**: `h-[1px] w-full bg-border`
- **Vertical**: `h-full w-[1px] bg-border`

### 8.21 ScrollArea (`/components/ui/scroll-area.tsx`)

- **Viewport**: `h-full w-full rounded-[inherit]`
- **ScrollBar vertical**: `w-2.5`
- **ScrollBar horizontal**: `h-2.5`
- **Thumb**: `rounded-full bg-border`

---

## 9. LAYOUT STRUCTURES

### 9.1 Dashboard Shell (`/components/layouts/DashboardShell.tsx`)

```
┌──────────────────────────────────────────────────┐
│  h-16 sticky top-0 z-40 border-b bg-background/95 backdrop-blur shadow-sm
│  [ Mobile menu btn ] [ Global Search (w-64) ] [ Notifications ] [ User menu ]
├──────────┬───────────────────────────────────────┤
│ Sidebar  │                                       │
│ lg:w-72  │  Main content area                    │
│ (or w-16 │  py-6 px-4 sm:px-6 lg:px-8            │
│ collapsed│                                       │
│          │  lg:pl-72 (or lg:pl-16)               │
│ border-r │                                       │
│ transition-all duration-300                       │
└──────────┴───────────────────────────────────────┘
```

**Sidebar Logo**: Gradient icon `from-cyan-500 to-blue-600`, gradient text `bg-clip-text text-transparent`

**Nav Links**:
- Active: `bg-primary/10 text-primary`
- Inactive: `text-muted-foreground hover:text-foreground hover:bg-muted`
- Font: `text-sm leading-6 font-semibold rounded-md`

**Mobile Sidebar**: `fixed inset-0 z-50`, overlay `bg-gray-600/80`, content `max-w-xs`

### 9.2 Pre-Login Layout (`/app/(public)/layout.tsx`)

- Navigation: `sticky top-0 z-50 h-16 border-b bg-white/80 backdrop-blur-md shadow-sm`
- Active link: `text-cyan-600 font-semibold`
- Inactive link: `text-neutral-700 hover:text-cyan-600 transition-colors duration-200`
- Footer: `border-t bg-neutral-900 text-white`

### 9.3 Page Header Pattern
```
h1: text-3xl font-bold tracking-tight
p:  text-muted-foreground
    flex with action buttons on right
```

### 9.4 Grid Layouts
| Columns | Classes |
|---------|---------|
| 2-col | `grid md:grid-cols-2 gap-4` |
| 3-col | `grid lg:grid-cols-3 gap-6` |
| 4-col | `grid md:grid-cols-2 lg:grid-cols-4 gap-4` |
| Stats | `grid grid-cols-2 md:grid-cols-4 gap-6` |

---

## 10. ANIMATIONS & TRANSITIONS

### 10.1 Tailwind Keyframes
| Name | Duration | Easing | Effect |
|------|----------|--------|--------|
| `accordion-down` | 0.2s | ease-out | Height 0 → auto |
| `accordion-up` | 0.2s | ease-out | Height auto → 0 |
| `fade-in` | 0.6s | ease-out | Opacity 0 → 1 |
| `slide-up` | 0.6s | ease-out | translateY(20px) + fade |
| `slide-down` | 0.6s | ease-out | translateY(-20px) + fade |
| `scale-in` | 0.6s | ease-out | scale(0.9) + fade |

### 10.2 Framer Motion Patterns

**Page entrance**:
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
```

**Staggered children**:
```tsx
initial="hidden" whileInView="visible"
variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
```

**Card hover**:
```tsx
whileHover={{ scale: 1.05, y: -5 }}
whileTap={{ scale: 0.95 }}
```

**Step transitions** (multi-step forms):
```tsx
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -20 }}
transition={{ duration: 0.3 }}
```

**Background blobs**:
```tsx
animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
className="absolute w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
```

### 10.3 Radix/Shadcn State Animations
```
data-[state=open]:animate-in  data-[state=closed]:animate-out
data-[state=open]:fade-in-0   data-[state=closed]:fade-out-0
data-[state=open]:zoom-in-95  data-[state=closed]:zoom-out-95
data-[side=bottom]:slide-in-from-top-2
```

### 10.4 CSS Transitions
- Default: `transition-colors`
- Duration: `duration-200`, `duration-300`, `duration-500`
- Sidebar: `transition-all duration-300 ease-in-out`

---

## 11. ICONS (Lucide React)

### Navigation Sidebar
| Route | Icon |
|-------|------|
| Dashboard | `BarChart3` |
| Patent Search | `SearchCheck` |
| Projects | `FolderOpen` |
| Workflows | `Workflow` |
| Portfolio | `FileText` |
| Prosecution | `Scale` |
| Prior Art | `Search` |
| Infringement | `Shield` |
| Analytics | `BarChart3` |
| Classifications | `Tags` |
| Attorney Network | `Users` |
| Collaboration | `MessageSquare` |
| Web Search | `Globe` |
| Help | `HelpCircle` |
| Settings | `Settings` |

### Common UI
| Purpose | Icons |
|---------|-------|
| User/Auth | `User`, `LogOut`, `Lock`, `Mail`, `Eye`, `EyeOff`, `KeyRound` |
| Actions | `Plus`, `Edit`, `Trash2`, `Copy`, `Archive`, `Download`, `RefreshCw`, `Send` |
| Navigation | `Menu`, `X`, `ChevronDown`, `ChevronLeft`, `ChevronRight`, `ArrowRight`, `ArrowLeft` |
| Status | `CheckCircle2`, `AlertCircle`, `XCircle`, `Activity`, `Loader2` |
| Content | `FileText`, `BookOpen`, `Layers`, `Target`, `TreePine` |
| Analytics | `BarChart3`, `PieChart`, `TrendingUp`, `TrendingDown` |
| Features | `Sparkles`, `Zap`, `Brain`, `Rocket`, `Lightbulb`, `Database` |
| Time/Cost | `Clock`, `Coins`, `Calendar` |
| Theme | `Moon`, `Sun`, `Palette` |
| Communication | `Bell`, `BellRing`, `Phone`, `MapPin`, `MessageSquare` |
| Business | `Building2`, `GraduationCap`, `Award`, `Globe` |
| Patent Analysis | `Search`, `FileText`, `BookOpen`, `Shield`, `AlertTriangle`, `Layers`, `Target`, `TreePine`, `Cpu`, `Hash`, `Coins`, `Clock`, `Sparkles`, `RefreshCw` |

### Icon Sizing
| Class | Size | Usage |
|-------|------|-------|
| `h-3 w-3` | 12px | Inline metadata |
| `h-4 w-4` | 16px | Default (buttons, nav) |
| `h-5 w-5` | 20px | Feature cards, sidebar |
| `h-6 w-6` | 24px | Headers, feature icons |
| `h-8 w-8` | 32px | Large feature icons, CTA |
| `h-10 w-10` | 40px | Loading spinners, hero |

---

## 12. FOCUS & ACCESSIBILITY

### Focus Ring (Global Pattern)
```
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

### Disabled States
```
disabled:pointer-events-none disabled:opacity-50
peer-disabled:cursor-not-allowed peer-disabled:opacity-70
```

### ARIA Requirements
- All buttons: `aria-label` or visible text
- Collapsible sections: `aria-expanded`
- Form inputs: associated `<label>`
- Images: `alt` attributes
- Focus states always visible

---

## 13. BACKGROUND PATTERNS

### Gradient Backgrounds
| Usage | Classes |
|-------|---------|
| Hero | `bg-gradient-to-b from-white via-cyan-50/30 to-white` |
| Hero (dark) | `bg-gradient-to-br from-cyan-600 via-blue-600 to-cyan-600` |
| Login | `bg-gradient-to-br from-cyan-50 via-white to-blue-50` |
| CTA section | `bg-gradient-to-br from-cyan-500 via-blue-500 to-magenta-500` |
| Pricing header | `bg-gradient-to-r from-cyan-500 to-blue-500` |
| Nav backdrop | `bg-white/80 backdrop-blur-md` |
| Top bar | `bg-background/95 backdrop-blur` |

### Decorative Blobs
```
absolute w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20
Blob 1: bg-cyan-200 (top-left)
Blob 2: bg-blue-200 (bottom-right)
Animated: x/y drift over 20s, infinite
```

### Dot Grid Pattern
```css
background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0);
background-size: 48px 48px;
opacity: 0.1;
```

---

## 14. CUSTOM CSS UTILITIES (globals.css)

### scrollbar-hide
```css
-ms-overflow-style: none;
scrollbar-width: none;
&::-webkit-scrollbar { display: none; }
```

### custom-scrollbar
```css
scrollbar-width: thin;
scrollbar-color: #cbd5e1 #f1f5f9;
::-webkit-scrollbar { width: 12px; }
::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 6px; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; border: 2px solid #f1f5f9; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
```

### uspto-formatting
```css
line-height: 1.5; white-space: pre-wrap; text-align: left;
padding: 1.5rem; overflow-wrap: break-word;
```

---

## 15. LOADING STATES

### Full-Page Spinner
```tsx
<div className="min-h-screen flex items-center justify-center">
  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
</div>
```

### Inline Spinner
```tsx
<div className="animate-spin rounded-full border-2 border-primary border-t-transparent h-5 w-5" />
```

### Refresh Button Pattern
```tsx
<RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
```

### Skeleton Placeholder
```tsx
<div className="animate-pulse rounded-md bg-muted h-48 w-full" />
```

---

## 16. PRE-LOGIN PAGE PATTERNS

### Hero Section
```
relative overflow-hidden bg-gradient-to-b from-white via-cyan-50/30 to-white
container mx-auto px-4 py-20 md:py-28 max-w-5xl text-center
Badge: inline-flex bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 text-cyan-700 rounded-full
Title: text-4xl md:text-6xl lg:text-7xl font-bold gradient-text leading-[1.1]
Subtitle: text-lg md:text-xl text-neutral-600 max-w-3xl leading-relaxed
```

### Login/Signup Card
```
max-w-md mx-auto shadow-2xl border border-neutral-200 bg-white backdrop-blur-sm
Form fields: full width, icon left (pl-10)
CTA: full width, gradient cyan→blue, lg size
Error: bg-red-50 border-red-200 text-red-700 rounded-lg
```

### Pricing Cards
```
grid md:grid-cols-3 gap-8
Card: rounded-2xl border-2 p-8 bg-white
Highlight: border-cyan-500 shadow-2xl scale-105
Badge: absolute -top-4 bg-gradient-cyan→blue text-white rounded-full
Price: text-5xl font-bold
Feature check: h-5 w-5 text-cyan-500
```

### Comparison Table
```
rounded-2xl border-2 border-neutral-200 shadow-xl
Header: bg-gradient-cyan→blue text-white
Rows: alternate bg-neutral-50 / bg-white
Check: h-6 w-6 text-green-600
X: h-6 w-6 text-neutral-300
```

### Testimonials
```
grid md:grid-cols-3 gap-6
Card: p-8 rounded-2xl border-2 border-neutral-100 hover:border-cyan-200 hover:shadow-xl
Stars: text-yellow-400
Avatar: h-12 w-12 rounded-full gradient cyan→blue
```

### FAQ Accordion
```
bg-neutral-50 py-20 max-w-3xl
Item: bg-white rounded-xl border-2 border-neutral-200 hover:border-cyan-300
Button: w-full p-6 text-left flex justify-between
Chevron: h-5 w-5 text-cyan-600 rotate-180 when open
Answer: max-h-96 / max-h-0 overflow-hidden transition
```

### Footer (Pre-Login)
```
border-t bg-neutral-900 text-white py-12
Social: h-10 w-10 rounded-full bg-neutral-800 hover:bg-cyan-600
Links: text-sm text-neutral-400 hover:text-cyan-400
Divider: border-t border-neutral-800 mt-8 pt-8
```

---

## 17. NOTIFICATION PATTERNS

### Notification Center (Popover)
```
Width: w-96, Max height: max-h-96
Unread: bg-background border-blue-200
Read: bg-muted/30
Priority badge: dynamic color
```

### Alert Banners
```
rounded-lg p-4 flex items-center gap-3 border
Success: bg-green-50 border-green-200
Warning: bg-yellow-50 border-yellow-200
Error: bg-red-50 border-red-200
```

---

## 18. DARK MODE

Triggered by `.dark` class on `<html>`. All CSS variable tokens automatically switch. No `dark:` Tailwind prefixes needed for themed colors — they flow through `hsl(var(--token))`.

For non-themed elements (e.g., `bg-green-50`), use explicit `dark:` prefixes when needed.

---

## 19. FILE REFERENCE MAP

### Configuration
| File | Purpose |
|------|---------|
| `frontend/tailwind.config.ts` | Colors, keyframes, plugins, breakpoints |
| `frontend/src/app/globals.css` | CSS variables, base styles, utilities |
| `frontend/src/app/layout.tsx` | Font, metadata, providers |
| `frontend/components.json` | Shadcn/ui config & aliases |
| `frontend/postcss.config.mjs` | PostCSS pipeline |
| `frontend/src/lib/utils.ts` | `cn()` utility, formatters |

### UI Components (`frontend/src/components/ui/`)
`alert-dialog.tsx`, `alert.tsx`, `badge.tsx`, `button.tsx`, `calendar.tsx`, `card.tsx`, `checkbox.tsx`, `collapsible.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `form.tsx`, `input.tsx`, `label.tsx`, `popover.tsx`, `progress.tsx`, `radio-group.tsx`, `scroll-area.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `skeleton.tsx`, `slider.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `tooltip.tsx`

### Layouts
| File | Purpose |
|------|---------|
| `frontend/src/components/layouts/DashboardShell.tsx` | Authenticated layout |
| `frontend/src/app/(public)/layout.tsx` | Pre-login layout |
| `frontend/src/components/Navigation.tsx` | Pre-login navigation |

### Pre-Login Pages (`frontend/src/app/(public)/`)
`page.tsx` (landing), `login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx`, `pricing/page.tsx`, `contact/page.tsx`

### Dashboard Pages (`frontend/src/app/dashboard/`)
`page.tsx`, `analytics/page.tsx`, `patent-search/page.tsx`, `portfolio/`, `infringement/`, `web-search/`
