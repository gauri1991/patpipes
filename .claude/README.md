# UI Builder Agent - ElevenLabs Design System

A comprehensive Claude Code agent for building modern frontend UIs using the ElevenLabs design system.

## Overview

This agent specializes in creating beautiful, accessible, and performant React/Next.js components with:
- **ElevenLabs Design System**: Modern, minimal, research-forward aesthetics
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Framer Motion**: Smooth animations and micro-interactions
- **WCAG AA Compliance**: Accessibility-first approach

## Quick Start

### 1. Installation

The agent is already configured in `.claude/agents/`. To use it:

```bash
# Navigate to your project
cd /home/gss/Documents/projects/patent_analytics_platform

# Start Claude Code
claude
```

### 2. Basic Usage

#### Automatic Invocation
Just ask naturally for UI-related tasks:

```
Create a pricing table component with 3 tiers.
Include feature lists, pricing, and CTA buttons.
Use cyan as the primary accent color.
Make it fully responsive.
```

#### Explicit Invocation
Use the `@ui-builder:` prefix:

```
@ui-builder: Design a hero section with animated gradient text,
subtitle, and CTA button. Make it engaging with smooth entrance animations.
```

## Design System

### Colors

**Primary Colors:**
- Black: `#000000` (el-black)
- White: `#FFFFFF` (el-white)

**Neutrals:** (50-950 scale)
- 50: `#F9F9F9` (lightest)
- 500: `#A6A6A6` (mid-gray)
- 950: `#1A1A1A` (darkest)

**Accent Colors:**
- **Cyan** (Primary): `#00D9FF` (cyan-500)
- **Magenta**: `#FF006E` (magenta-500)
- **Yellow**: `#FFD60A` (yellow-500)
- **Blue**: `#3A86FF` (blue-400)

### Typography

- **Font Family**: Waldenburg (fallback: Inter, system-ui)
- **Weights**: 400 (regular), 600 (semibold), 700 (bold)
- **Sizes**: text-sm, text-base, text-lg, text-xl, text-2xl, etc.

### Spacing & Layout

- **Base Unit**: 4px (Tailwind scale)
- **Breakpoints**:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px

### Animations

- **Entrance**: 0.5-0.6s duration with easeOut
- **Micro-interactions**: 0.2s transitions
- **Tool**: Framer Motion for complex animations

## Example Requests

### Components
```
Create a button component with primary, secondary, and outline variants.
Include hover effects and different sizes (sm, md, lg).
```

### Sections
```
Build a feature showcase section with 4 features in a grid.
Each feature has an icon, title, description, and different accent colors.
Add staggered entrance animations.
```

### Forms
```
Design a contact form with name, email, and message fields.
Include validation, loading states, and a success animation.
Use the cyan accent color.
```

### Navigation
```
Create a responsive navbar with logo, menu items, and CTA button.
Add mobile hamburger menu with smooth animations.
Sticky positioning on scroll.
```

## File Structure

```
.claude/
├── agents/
│   ├── ui-builder.yml                    # Agent configuration
│   └── ui-builder-system-prompt.md       # Agent instructions
├── components-examples/                   # Example components
│   ├── Button.tsx
│   └── Card.tsx
├── tailwind.config.example.ts            # Tailwind setup
├── CLAUDE.md                             # Project context
└── README.md                             # This file
```

## Integration with Your Project

### For Next.js Projects

1. **Install dependencies:**
```bash
npm install framer-motion
npm install -D tailwindcss @types/node typescript
```

2. **Copy Tailwind config:**
```bash
cp .claude/tailwind.config.example.ts ./tailwind.config.ts
```

3. **Set up globals.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  @apply transition-colors duration-200;
}

button:focus-visible,
a:focus-visible,
input:focus-visible {
  @apply outline-none ring-2 ring-cyan-500 ring-offset-2;
}
```

4. **Start building:**
```bash
npm run dev
# Ask the ui-builder agent to create components
```

## Best Practices

### Component Quality Checklist
- ✅ Full TypeScript interfaces
- ✅ Responsive (mobile-first)
- ✅ Accessible (WCAG AA)
- ✅ Hover/active states
- ✅ Design tokens (no hard-coded colors)
- ✅ Smooth animations
- ✅ Error handling
- ✅ Production-ready

### Accessibility Requirements
- Semantic HTML (`<button>`, `<nav>`, `<section>`)
- ARIA labels where needed
- Keyboard navigation support
- Focus states visible
- Color contrast ratios meet WCAG AA
- Screen reader friendly

## Advanced Features

### Plugin Installation (Optional)

Create a plugin for easy sharing:

```bash
# Create plugin file
cat > .claude/plugins/ui-builder-plugin.json << 'EOF'
{
  "name": "ui-builder-plugin",
  "version": "1.0.0",
  "description": "Frontend UI builder with ElevenLabs design system",
  "agents": [{
    "name": "ui-builder",
    "path": ".claude/agents/ui-builder.yml",
    "description": "Build modern frontend UIs"
  }]
}
EOF

# Install via Claude Code
/plugin install ./.claude/plugins/ui-builder-plugin.json
```

### Team Sharing

Share this agent with your team:

1. Commit `.claude/` directory to version control
2. Team members get the agent automatically when they clone
3. Start using with `claude` command

## Examples

### Example 1: Hero Section
```
Create a hero section with:
- Large animated heading with gradient
- Subtitle text
- Two CTA buttons (primary and outline)
- Responsive layout
- Smooth fade-in animations
```

### Example 2: Dashboard Card
```
Build a dashboard stat card showing:
- Icon with colored background
- Metric value (large)
- Label text
- Percentage change indicator
- Hover effect that lifts the card
```

### Example 3: Product Grid
```
Design a product grid with:
- 3 columns on desktop, 2 on tablet, 1 on mobile
- Product image, title, price, and "Add to Cart" button
- Hover animation on images
- Staggered entrance animations
```

## Troubleshooting

### Agent Not Responding
```bash
# Verify agent config
cat .claude/agents/ui-builder.yml

# Restart Claude Code
exit
claude
```

### Component Not Styled Correctly
- Ensure Tailwind config includes all design tokens
- Check that design token names match (e.g., `cyan-500` not `blue-500`)
- Verify Tailwind is processing your component files

### TypeScript Errors
```bash
# Run type checking
npm run type-check

# Install missing types
npm install -D @types/react @types/node
```

## Resources

- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Support

For issues or questions:
1. Check `.claude/CLAUDE.md` for project-specific context
2. Review example components in `.claude/components-examples/`
3. Consult the agent system prompt at `.claude/agents/ui-builder-system-prompt.md`

---

**Version**: 1.0.0
**Author**: Your Name
**License**: MIT
