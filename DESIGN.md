# Design Brief: Form Builder Tool

**Tone & Purpose:** Tool-first minimalism. Productivity interface for stateless form control authoring. Zero decoration; every pixel serves clarity.

## Palette

| Token | Light OKLCH | Use |
|-------|----------|-----|
| Navy | 0.23 0.07 240 | Sidebar, navigation, text |
| Gold | 0.62 0.12 78 | CTAs, active states, highlights |
| White | 1 0 0 | Canvas background |
| Light Gray | 0.96 0.005 240 | Backgrounds, borders |
| Canvas Grid | 0.98 0.003 240 | Subtle grid lines on live preview |

## Typography

| Role | Font | Size | Weight |
|------|------|------|--------|
| Display | Bricolage Grotesque | 1.5rem | 600 |
| Body | Plus Jakarta Sans | 0.875rem | 400–500 |
| Code | Monospace (system) | 0.75rem | 400 |

## Structural Zones

| Zone | Treatment |
|------|-----------|
| Header | Navy bar, white text, gold CTAs |
| Left Sidebar | Navy #0B2B4B, white text, gold hover/active |
| Right Canvas | White bg, subtle grid, bordered preview area |
| Bottom CSS Editor | Bordered panel with monospace |

## Spacing & Density

Compact: 0.5rem gutters in sidebar, 1rem in canvas. Two-column split (left:right ≈ 30:70 on desktop, stacked on mobile).

## Motion

Hover: gold accent appears on sidebar items (smooth 0.2s transition). No bounce animations. Pulse on active control (subtle, 2s cycle).

## Component Patterns

- **Palette Cards:** Grid of draggable form controls (text, select, checkbox, etc.) — navy bg, gold border on hover
- **Property Editor:** Stacked input fields, minimal labels, real-time preview
- **CSS Editor:** Monospace, line numbers, syntax color (optional)
- **Canvas:** Live form preview with grid background, bordered box for visual clarity

## Constraints

- No animations beyond hover transitions and subtle pulse
- No gradients or decorative elements
- Sidebar always visible on desktop (lg:), drawer on mobile
- All color values via OKLCH tokens; no raw hex
