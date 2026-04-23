# Design Brief: MKJC Scholarship Exam Portal (Duplicated Instance)

**Tone & Purpose:** Minimal, distraction-free exam interface. Navy/Gold MKJC institutional branding. Centered card-based homepage registration, admin dashboard with sidebar navigation, bilingual support (English/Tamil). Zero decoration; exam focus only.

## Palette

| Token | OKLCH | Use |
|-------|--------|-----|
| Navy Primary | 0.23 0.07 240 | Sidebar, buttons, text, branding |
| Gold Accent | 0.62 0.12 78 | CTAs, highlights, active states |
| White | 1 0 0 | Cards, form backgrounds |
| Light Gray | 0.96 0.005 240 | Page backgrounds, borders |
| Destructive | 0.577 0.245 27.325 | Delete actions (trash icons) |

## Typography

| Role | Font | Size | Weight |
|------|------|------|--------|
| Display | Bricolage Grotesque | 1.25–1.5rem | 600–700 |
| Body | Plus Jakarta Sans | 0.875–1rem | 400–500 |
| Tamil | Noto Sans Tamil | 0.875rem | 400 |

## Structural Zones

| Zone | Treatment |
|------|-----------|
| Homepage | Centered white card, no navbar/footer, gold buttons |
| Admin Sidebar | Navy bg, white text, gold hover, collapsible |
| Admin Content | Light gray bg, white card containers, gold accents |
| Form Fields | White inputs, navy text, gold focus rings |
| Question Grid | Numbered status (green/gray), pagination controls |

## Motion & Interaction

Smooth 0.2s transitions on hover. Gold highlight on active tabs. Button states: navy hover, gold active. Question status pulse (answered=green, unanswered=gray).

## Features

Homepage: Registration form (name, school, group, contact, exam selection), Start Now (gold), Staff Login (navy). Admin: Questions (text/image, bilingual), Registrations (filters), Results (filters), Exams (auto-ID), Settings (SMS API). Quiz: 5q/page, bilingual toggle, status grid, previous/next nav.

## Constraints

- Navy #0B2B4B primary, Gold #B88D2A accent only
- Noto Sans Tamil required for Tamil text rendering
- No animations beyond state transitions
- Homepage card-only, no navbar/footer
- All tokens via OKLCH; no hex or RGB literals
