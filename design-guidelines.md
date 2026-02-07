# Design Guidelines - Arcade Vibe

> Bold, electric, unapologetically 80's arcade atmosphere

## Core Philosophy

**Arcade Vibe** is a design system that captures the electric energy of 1980s arcade halls - the glow of CRT monitors, the rhythm of cabinet buttons, the anticipation of high scores, and the community of gamers gathered around flashing machines.

**Keywords:**
- Electric
- Neon
- Retro-futuristic
- Bold
- Immersive
- Dynamic

**Emotional Impact:**
- Nostalgia meets modernity
- Playful excitement
- Digital adventure
- Competitive energy
- Atmospheric immersion

---

## Color System

### Primary Palette - Dark Theme (Default)

The dark theme evokes the dimly lit arcade hall atmosphere with dramatic neon accents.

```css
/* Backgrounds - Deep arcade darkness */
--bg-arcade-deep: oklch(0.12 0.01 270);     /* Deep purple-black */
--bg-arcade-mid: oklch(0.18 0.02 280);      /* Mid-tone purple */
--bg-cabinet: oklch(0.15 0.03 285);         /* Cabinet base */
--bg-crt: oklch(0.08 0.01 260);             /* CRT screen glow */

/* Neon Accents - Electric energy */
--neon-pink: oklch(0.65 0.25 340);         /* Hot pink glow */
--neon-blue: oklch(0.70 0.22 250);         /* Electric blue */
--neon-cyan: oklch(0.75 0.18 190);         /* Cyan pulse */
--neon-purple: oklch(0.68 0.20 300);        /* Purple beam */
--neon-yellow: oklch(0.85 0.22 85);        /* Amber warning */
--neon-orange: oklch(0.72 0.24 45);        /* Orange alert */
--neon-green: oklch(0.78 0.20 145);        /* Success glow */

/* Text - High contrast */
--text-primary: oklch(0.98 0.005 280);     /* Bright white with purple tint */
--text-secondary: oklch(0.75 0.01 280);    /* Muted gray-purple */
--text-muted: oklch(0.55 0.015 280);       /* Dimmed text */
--text-neon: oklch(0.85 0.20 180);         /* Glowing text */

/* UI Elements */
--border-neon: oklch(0.75 0.18 250 / 0.4); /* Glowing borders */
--card-arcade: oklch(0.15 0.03 285 / 0.9); /* Cabinet card */
--input-arcade: oklch(0.10 0.02 270);      /* Input background */
--shadow-neon: oklch(0.65 0.25 340 / 0.3); /* Neon glow */
```

### Primary Palette - Light Theme

A softer, modern interpretation - bright but never harsh, maintaining the arcade energy.

```css
/* Backgrounds - Bright arcade hall */
--bg-arcade-light-deep: oklch(0.90 0.008 280);   /* Light purple-gray */
--bg-arcade-light-mid: oklch(0.95 0.005 285);    /* Off-white purple */
--bg-cabinet-light: oklch(0.93 0.01 282);        /* Light cabinet */
--bg-crt-light: oklch(0.88 0.012 275);           /* CRT light glow */

/* Neon Accents - Saturated but balanced */
--neon-pink-light: oklch(0.65 0.25 340);
--neon-blue-light: oklch(0.70 0.22 250);
--neon-cyan-light: oklch(0.75 0.18 190);
--neon-purple-light: oklch(0.68 0.20 300);
--neon-yellow-light: oklch(0.85 0.22 85);
--neon-orange-light: oklch(0.72 0.24 45);
--neon-green-light: oklch(0.78 0.20 145);

/* Text - Dark contrast */
--text-primary-light: oklch(0.15 0.02 280);
--text-secondary-light: oklch(0.35 0.015 280);
--text-muted-light: oklch(0.50 0.01 280);
--text-neon-light: oklch(0.55 0.20 180);

/* UI Elements */
--border-neon-light: oklch(0.55 0.15 250 / 0.3);
--card-arcade-light: oklch(0.98 0.005 285);
--input-arcade-light: oklch(0.95 0.008 280);
```

### Color Usage Rules

1. **Dark Theme (Default)**: Deep backgrounds with 2-3 neon max
2. **Light Theme**: Light backgrounds with same neon accents, lower saturation
3. **Never**: Pure black (#000) or pure white (#fff) - use tints
4. **Always**: Add alpha transparency to neon glows (20-40%)
5. **Contrast**: Maintain WCAG AA compliance (4.5:1 for text)

---

## Typography

### Font Families

**Display Headings:** `Orbitron` - Geometric, futuristic, arcade-inspired
```css
font-family: 'Orbitron', 'Roboto Mono', monospace;
```

**Body Text:** `Space Grotesk` - Modern, readable with character
```css
font-family: 'Space Grotesk', 'Inter', sans-serif;
```

**Code/Mono:** `JetBrains Mono` - Developer-friendly, technical
```css
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

```css
/* Headings - Bold, impactful */
--text-arcade-4xl: 4.5rem;     /* 72px - Hero title */
--text-arcade-3xl: 3rem;       /* 48px - Section title */
--text-arcade-2xl: 2.25rem;    /* 36px - Card title */
--text-arcade-xl: 1.75rem;     /* 28px - Subtitle */

/* Body - Readable, balanced */
--text-arcade-lg: 1.125rem;    /* 18px - Lead text */
--text-arcade-base: 1rem;      /* 16px - Body */
--text-arcade-sm: 0.875rem;    /* 14px - Secondary */
--text-arcade-xs: 0.75rem;     /* 12px - Labels */

/* Arcade UI - Game-like */
--text-arcade-score: 2.5rem;   /* Score display */
--text-arcade-digit: 1.5rem;   /* Number displays */
```

### Typography Effects

```css
/* Neon text glow */
.neon-text {
  text-shadow:
    0 0 10px var(--neon-pink),
    0 0 20px var(--neon-pink),
    0 0 40px var(--neon-pink);
}

/* Glitch effect */
.glitch-text {
  animation: glitch 2s infinite;
}

/* Scrolling text */
.arcade-scroll {
  animation: scroll 10s linear infinite;
}

/* Blinking cursor */
.arcade-blink {
  animation: blink 1s step-end infinite;
}
```

---

## Visual Elements

### 1. Neon Glows

All interactive elements have subtle neon glow effects:

```css
.button-arcade {
  background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple));
  box-shadow:
    0 0 20px var(--neon-blue / 0.4),
    0 0 40px var(--neon-purple / 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.button-arcade:hover {
  box-shadow:
    0 0 30px var(--neon-blue / 0.6),
    0 0 60px var(--neon-purple / 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
```

### 2. CRT Scan Lines

Subtle scan line overlay for retro monitor feel:

```css
.crt-overlay {
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1) 0px,
    rgba(0, 0, 0, 0.1) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 9999;
}
```

### 3. Geometric Shapes

Arcade-inspired geometric patterns:

```css
/* Hexagonal pattern */
.pattern-hexagon {
  background-image:
    radial-gradient(circle at 50% 50%, var(--neon-purple / 0.1) 0%, transparent 50%),
    linear-gradient(60deg, var(--neon-blue / 0.05) 25%, transparent 25%);
  background-size: 60px 60px;
}

/* Grid lines */
.pattern-grid {
  background-image:
    linear-gradient(var(--border-neon) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-neon) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Diagonal stripes */
.pattern-stripes {
  background: repeating-linear-gradient(
    45deg,
    var(--neon-cyan / 0.05),
    var(--neon-cyan / 0.05) 2px,
    transparent 2px,
    transparent 10px
  );
}
```

### 4. Cabinet Frames

Card components styled as arcade cabinets:

```css
.card-arcade {
  background: var(--card-arcade);
  border: 3px solid var(--border-neon);
  border-radius: 8px;
  box-shadow:
    0 0 20px var(--shadow-neon),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
}

.card-arcade::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple));
  z-index: -1;
  opacity: 0.5;
}
```

### 5. Glitch Effects

Digital glitch aesthetic for emphasis:

```css
.glitch-box {
  position: relative;
}

.glitch-box::before,
.glitch-box::after {
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
}

.glitch-box::before {
  transform: translate(-2px, 0);
  background: var(--neon-pink / 0.7);
  animation: glitch-1 0.3s infinite;
}

.glitch-box::after {
  transform: translate(2px, 0);
  background: var(--neon-cyan / 0.7);
  animation: glitch-2 0.3s infinite;
}
```

---

## Animations & Motion

### Key Animation Patterns

1. **Entrance Animations**
   - Staggered fade-in (cards, lists)
   - Slide-up from bottom
   - Scale from center
   - Glitch reveal

2. **Hover States**
   - Neon glow intensification
   - Subtle scale (1.02-1.05)
   - Color shift between neon hues
   - Border animation

3. **Click/Active States**
   - Button press effect (scale down)
   - Ripple effect with neon color
   - Glitch burst on click

4. **Continuous Motion**
   - Slowly pulsing neon glows
   - Background grid movement
   - Floating elements
   - Scan line drift

### Animation Library

```css
@keyframes neon-pulse {
  0%, 100% {
    box-shadow: 0 0 20px var(--neon-blue / 0.4);
  }
  50% {
    box-shadow: 0 0 40px var(--neon-blue / 0.8);
  }
}

@keyframes glitch-1 {
  0%, 100% { transform: translate(-2px, 0); }
  50% { transform: translate(2px, -1px); }
}

@keyframes glitch-2 {
  0%, 100% { transform: translate(2px, 0); }
  50% { transform: translate(-2px, 1px); }
}

@keyframes scan-line {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes color-cycle {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes scroll {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
```

---

## Layout Patterns

### 1. Cabinet Grid Layout

Cards arranged as arcade cabinets in a grid:

```
┌─────────┐ ┌─────────┐ ┌─────────┐
│ CABINET │ │ CABINET │ │ CABINET │
│   #1    │ │   #2    │ │   #3    │
│         │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘
┌─────────┐ ┌─────────┐ ┌─────────┐
│ CABINET │ │ CABINET │ │ CABINET │
│   #4    │ │   #5    │ │   #6    │
│         │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘
```

### 2. Hero Section

Full-width hero with CRT-style background:

- Large neon heading
- Subtle grid pattern
- Floating geometric shapes
- Call-to-action with glow effect

### 3. Dashboard Layout

Inspired by arcade scoreboards:

- Header with neon branding
- Sidebar with glowing icons
- Main content area with card grid
- Stats panel at top (scoreboard style)

### 4. Modal/Dialog

Styled as arcade cabinet screen:

- Rounded cabinet frame
- CRT border
- Glow effect
- Close button as cabinet button

---

## Component Design

### Buttons

**Primary Button:**
```css
.btn-primary {
  background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple));
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  box-shadow: 0 0 20px var(--neon-blue / 0.4);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  box-shadow: 0 0 30px var(--neon-blue / 0.7);
  transform: scale(1.02);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

**Secondary Button:**
```css
.btn-secondary {
  background: transparent;
  border: 2px solid var(--neon-cyan);
  border-radius: 6px;
  box-shadow: 0 0 10px var(--neon-cyan / 0.3);
  color: var(--neon-cyan);
}
```

### Inputs

**Text Input:**
```css
.input-arcade {
  background: var(--input-arcade);
  border: 2px solid var(--border-neon);
  border-radius: 4px;
  padding: 12px 16px;
  color: var(--text-primary);
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3);
}

.input-arcade:focus {
  border-color: var(--neon-cyan);
  box-shadow:
    inset 0 2px 10px rgba(0, 0, 0, 0.3),
    0 0 20px var(--neon-cyan / 0.3);
  outline: none;
}
```

### Cards

**Arcade Cabinet Card:**
```css
.card-cabinet {
  background: linear-gradient(180deg, var(--bg-cabinet), var(--bg-arcade-mid));
  border: 3px solid var(--border-neon);
  border-radius: 12px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.4),
    0 0 20px var(--shadow-neon),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.card-cabinet::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--neon-pink), var(--neon-blue), var(--neon-purple));
}
```

### Badges

**Neon Badge:**
```css
.badge-neon {
  background: var(--neon-pink / 0.2);
  border: 1px solid var(--neon-pink);
  color: var(--neon-pink);
  box-shadow: 0 0 10px var(--neon-pink / 0.4);
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
}
```

---

## Iconography

### Style Guidelines

- **Primary Style:** Filled icons with neon glow
- **Secondary Style:** Outline icons with colored stroke
- **Animations:** Subtle pulse on hover
- **Size:** 16px, 20px, 24px, 32px, 48px

### Icon Effects

```css
.icon-glow {
  filter: drop-shadow(0 0 8px var(--neon-cyan));
}

.icon-pulse {
  animation: neon-pulse 2s ease-in-out infinite;
}
```

---

## Spacing System

```css
/* Arcade-themed spacing */
--space-arcade-xs: 0.25rem;   /* 4px - Tight elements */
--space-arcade-sm: 0.5rem;    /* 8px - Small gaps */
--space-arcade-md: 1rem;      /* 16px - Standard */
--space-arcade-lg: 1.5rem;    /* 24px - Sections */
--space-arcade-xl: 2rem;      /* 32px - Large gaps */
--space-arcade-2xl: 3rem;     /* 48px - Hero spacing */
--space-arcade-3xl: 4rem;     /* 64px - Major sections */
```

---

## Border Radius

```css
/* Rounded corners for cabinet aesthetic */
--radius-arcade-sm: 4px;      /* Small elements */
--radius-arcade-md: 8px;      /* Cards, buttons */
--radius-arcade-lg: 12px;     /* Large cards */
--radius-arcade-xl: 16px;     /* Modals */
--radius-arcade-full: 9999px; /* Pills, badges */
```

---

## Accessibility

### Contrast Requirements

- All text must meet WCAG AA (4.5:1)
- Large text (18px+) must meet WCAG AA (3:1)
- Interactive elements must have visible focus state
- Neon glow effects must not reduce contrast

### Focus States

```css
:focus-visible {
  outline: 3px solid var(--neon-cyan);
  outline-offset: 2px;
  box-shadow: 0 0 20px var(--neon-cyan / 0.5);
}
```

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Theme Toggling

### Implementation

Use CSS custom properties with class-based theme switching:

```css
:root {
  /* Dark theme (default) */
  --background: var(--bg-arcade-deep);
  --foreground: var(--text-primary);
}

.light {
  /* Light theme */
  --background: var(--bg-arcade-light-deep);
  --foreground: var(--text-primary-light);
}
```

### Transition

```css
* {
  transition: background-color 0.3s ease,
              border-color 0.3s ease,
              color 0.3s ease,
              box-shadow 0.3s ease;
}
```

---

## Implementation Notes

### Tailwind CSS v4 Integration

```css
@theme {
  /* Arcade colors */
  --color-arcade-deep: var(--bg-arcade-deep);
  --color-arcade-mid: var(--bg-arcade-mid);
  --color-neon-pink: var(--neon-pink);
  --color-neon-blue: var(--neon-blue);
  --color-neon-cyan: var(--neon-cyan);
  --color-neon-purple: var(--neon-purple);
  --color-neon-yellow: var(--neon-yellow);
  --color-neon-green: var(--neon-green);

  /* Typography */
  --font-display: 'Orbitron', monospace;
  --font-body: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing */
  --space-arcade-lg: var(--space-arcade-lg);
  --space-arcade-xl: var(--space-arcade-xl);

  /* Border radius */
  --radius-arcade: var(--radius-arcade-lg);
}
```

### Utility Classes

```css
/* Neon effects */
.neon-glow-pink { box-shadow: 0 0 20px var(--neon-pink / 0.4); }
.neon-glow-blue { box-shadow: 0 0 20px var(--neon-blue / 0.4); }
.neon-glow-cyan { box-shadow: 0 0 20px var(--neon-cyan / 0.4); }

/* CRT effect */
.crt-effect {
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1) 0px,
    rgba(0, 0, 0, 0.1) 1px,
    transparent 1px,
    transparent 2px
  );
}

/* Cabinet border */
.cabinet-border {
  border: 3px solid var(--border-neon);
  border-radius: 12px;
  box-shadow: 0 0 20px var(--shadow-neon);
}
```

---

## Inspiration & References

### Visual References
- 1980s arcade cabinets (Pac-Man, Street Fighter, Donkey Kong)
- Synthwave album art
- Cyberpunk 2077 UI
- TRON: Legacy visual effects
- Neon-noir photography

### Color Inspiration
- Tokyo at night
- Las Vegas neon signs
- Cyberpunk cityscapes
- Retro gaming consoles

### Typography Inspiration
- Arcade cabinet marquees
- 8-bit game titles
- Cyberpunk movie posters
- Tech startup branding

---

## Rules of the Arcade

1. **Be Bold**: Don't shy away from neon - commit to the aesthetic
2. **Contrast is King**: Always maintain readability with dramatic contrasts
3. **Animate with Purpose**: Every motion should enhance the arcade experience
4. **Glitch with Intent**: Glitch effects should feel intentional, not broken
5. **Cabinet Consistency**: Treat cards/modals as mini arcade cabinets
6. **Glow, Don't Blind**: Neon should enhance, not overwhelm
7. **Nostalgia + Modernity**: Honor the 80s without being dated
8. **Game UI Elements**: Scoreboards, leaderboards, HUD elements
9. **Sound Design** (optional): Consider subtle arcade UI sounds
10. **Have Fun**: This is an arcade - make it exciting!

---

## Deliverables Checklist

When implementing this design system:

- [ ] Import custom fonts (Orbitron, Space Grotesk, JetBrains Mono)
- [ ] Define CSS custom properties for all colors
- [ ] Create utility classes for neon effects
- [ ] Implement cabinet-style card components
- [ ] Add CRT scan line overlay (optional, togglable)
- [ ] Create animation keyframes library
- [ ] Build responsive cabinet grid layouts
- [ ] Implement theme toggle (dark/light)
- [ ] Add focus states with neon glow
- [ ] Test contrast ratios for accessibility
- [ ] Create component library (Button, Input, Card, Badge, etc.)
- [ ] Document all custom utilities in code comments

---

**Let the games begin!** 🎮✨
