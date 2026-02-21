# Patent Analytics Platform - Frontend UI Builder

## Project Overview
This is a Django-based patent analytics platform with a modern Next.js frontend using the ElevenLabs design system.

## Quick Commands
- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm run type-check` - Run TypeScript checker
- `npm run lint` - Run ESLint
- `./venv/bin/python manage.py runserver` - Start Django backend

## Project Structure
```
patent_analytics_platform/
├── backend/                    # Django backend
│   ├── apps/
│   │   ├── jobs/
│   │   ├── processing/
│   │   └── vector_search/
│   ├── config/
│   └── manage.py
├── frontend/                   # Next.js frontend (to be created)
│   ├── app/
│   ├── components/
│   └── lib/
├── .claude/
│   ├── agents/
│   │   ├── ui-builder.yml          # Frontend UI component builder
│   │   ├── ui-builder-system-prompt.md
│   │   ├── help-docs.yml           # Help documentation manager
│   │   ├── help-docs-system-prompt.md
│   │   ├── uspto-odp.yml           # USPTO ODP API specialist
│   │   └── uspto-odp-system-prompt.md
│   └── CLAUDE.md
└── venv/
```

## UI Builder Agent

The ui-builder agent specializes in creating frontend components using:
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with ElevenLabs design tokens
- **Animations**: Framer Motion
- **Design System**: ElevenLabs (modern, minimal, research-forward)

### Key Design Tokens

**Colors:**
- Primary: Black (#000000) & White (#FFFFFF)
- Neutrals: 50-950 scale
- Accent: Cyan (#00D9FF), Magenta (#FF006E), Yellow (#FFD60A), Blue (#3A86FF)

**Typography:**
- Font: Waldenburg (fallback: Inter, system-ui)
- Weights: 400 (regular), 600 (semibold), 700 (bold)

**Spacing:**
- Base: 4px (Tailwind scale)
- Breakpoints: sm:640px, md:768px, lg:1024px, xl:1280px

## Development Workflow

### Creating UI Components
1. Always create components in `/frontend/components` (or appropriate frontend directory)
2. Use TypeScript with strict mode
3. Follow Tailwind + Framer Motion pattern
4. Test responsive behavior (mobile-first)
5. Use design tokens, never hard-code colors
6. Components should be reusable and composable

### Accessibility Standards
- All buttons need `aria-label` or visible text
- Links need descriptive text
- Images need `alt` attributes
- Form inputs need `<label>` associations
- Focus states always visible (ring-2 ring-cyan-500)

### When Component is Complete
- Component should pass `npm run type-check`
- No ESLint warnings
- No console errors
- Responsive on mobile + desktop
- Accessible (keyboard nav, screen readers)

## Common Patterns

### Creating a New Component
```typescript
// components/my-component.tsx
import React from 'react'
import { motion } from 'framer-motion'

interface MyComponentProps {
  // Your props
}

export const MyComponent: React.FC<MyComponentProps> = ({ }) => {
  // Implementation
}
```

### Using Design Tokens
```jsx
// Always use: bg-cyan-500, text-neutral-600, etc.
// Never use: bg-blue-400, bg-red-300, etc.
<button className="bg-cyan-500 hover:bg-cyan-600 text-white">
  CTA Button
</button>
```

## Backend Integration Notes
- Django backend runs on port 8000/8001
- API endpoints available at `/api/`
- Authentication uses Django sessions
- WebSocket support via Daphne for real-time updates

## Agent Usage

### Automatic Delegation
Just ask naturally:
```
Create a pricing table component with 3 tiers.
Include feature lists, pricing, and CTA buttons.
Use cyan as the primary accent color.
Make it fully responsive.
```

### Explicit Invocation
```
@ui-builder: Create a testimonials section with avatar images,
names, roles, and star ratings. Use a grid layout.
```

## USPTO ODP API Agent

The uspto-odp agent is a specialist for the USPTO Open Data Portal API integration. It knows every endpoint, response shape, field name, caching layer, and auth mechanism.

**Capabilities:**
- Look up any ODP endpoint URL, request format, or response field
- Debug API integration issues (auth, 404s, field mismatches, caching)
- Add new ODP endpoints to both backend and frontend
- Inspect and manage the ODP response cache
- Test API connectivity and key configuration

**Usage:**
```
@uspto-odp: What fields does the documents endpoint return?
@uspto-odp: Clear the cache for application 10256227
@uspto-odp: Add the associated-documents endpoint to the frontend
@uspto-odp: Debug why the assignment tab shows empty data
@uspto-odp: What's the difference between search inline data and individual endpoint fields?
```

**Key files:**
- Client & services: `backend/domains/analytics/uspto_odp_service.py`
- Proxy views: `backend/domains/analytics/odp_views.py`
- Frontend service: `frontend/src/services/usptoOdpApi.ts`
- Cache model: `backend/domains/analytics/models.py` (ODPCacheEntry)

## Help Documentation Agent

The help-docs agent manages the platform's built-in Help Center content (categories & articles stored in Django DB).

**Capabilities:**
- Create, update, and delete help articles and categories
- Audit existing docs against current codebase for accuracy
- List all categories/articles with metadata (views, tags, featured status)
- Write articles in GitHub Flavored Markdown

**Usage:**
```
@help-docs: Document the new Portfolio Management feature
@help-docs: Audit all help articles for accuracy
@help-docs: List all help categories and articles
@help-docs: Update the Patent Search article with the new Transactions tab grouping feature
```

**Key files:**
- Models: `backend/domains/help/models.py`
- Seed data: `backend/domains/help/management/commands/seed_help_content.py`
- Frontend: `frontend/src/app/dashboard/help/`
- Components: `frontend/src/components/help/`

## Best Practices
1. Always read existing code before making changes
2. Use design tokens consistently
3. Ensure all components are accessible
4. Test on multiple screen sizes
5. Add proper TypeScript types
6. Include hover/active states
7. Use Framer Motion for animations
8. Follow mobile-first approach
