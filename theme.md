# Visual Theme System

A complete visual design system for creating dark, modern, premium websites. This theme features a black background, blue accent color, subtle glass-like elements, and sophisticated typography.

---

## 1. Color Palette

### Primary Brand Color
```css
--brand-accent: #375DEE;
--brand-accent-hover: #4169E1;
--brand-accent-rgb: 55, 93, 238;
```

### Background Colors
| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#000000` | Page background |
| `background-dark` | `#050505` | Deeper black (grid bg) |
| `card` | `rgba(255, 255, 255, 0.02)` | Card backgrounds |
| `card-hover` | `rgba(255, 255, 255, 0.04)` | Card hover state |
| `input` | `rgba(255, 255, 255, 0.05)` | Form input backgrounds |
| `overlay` | `rgba(0, 0, 0, 0.60)` | Modal overlays |
| `header-scrolled` | `rgba(0, 0, 0, 0.90)` | Sticky header bg |

### Text Colors
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `text-primary` | `#FFFFFF` | `text-white` | Headlines, important text |
| `text-secondary` | `rgba(255, 255, 255, 0.60)` | `text-white/60` | Body text, nav items |
| `text-muted` | `rgba(255, 255, 255, 0.40)` | `text-white/40` | Captions, labels |
| `text-subtle` | `rgba(255, 255, 255, 0.20)` | `text-white/20` | Placeholders, hints |

### Border Colors
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `border-default` | `rgba(255, 255, 255, 0.06)` | `border-white/[0.06]` | Cards, dividers |
| `border-light` | `rgba(255, 255, 255, 0.10)` | `border-white/10` | Inputs, secondary |
| `border-medium` | `rgba(255, 255, 255, 0.20)` | `border-white/20` | Buttons |
| `border-hover` | `rgba(55, 93, 238, 0.30)` | `border-[#375DEE]/30` | Hover states |
| `border-active` | `rgba(55, 93, 238, 0.50)` | `border-[#375DEE]/50` | Active/focus states |

### Blue Accent Variants
| Token | Value | Usage |
|-------|-------|-------|
| `blue-bg-subtle` | `rgba(55, 93, 238, 0.05)` | Subtle highlights |
| `blue-bg-light` | `rgba(55, 93, 238, 0.10)` | Light backgrounds |
| `blue-bg-medium` | `rgba(55, 93, 238, 0.20)` | Medium emphasis |
| `blue-glow` | `rgba(55, 93, 238, 0.30)` | Glow effects |

### Status Colors
| Status | Color | Light Variant |
|--------|-------|---------------|
| Success | `#22c55e` | `#4ade80` |
| Danger | `#ef4444` | `#f87171` |
| Warning | `#f59e0b` | `#fbbf24` |
| Info | `#3b82f6` | `#93c5fd` |

---

## 2. Typography

### Font Families
```css
--font-display: "Outfit", system-ui, sans-serif;  /* Headlines, titles */
--font-sans: "Inter", system-ui, sans-serif;       /* Body text */
--font-mono: "JetBrains Mono", monospace;          /* Code, numbers */
```

### Font Weights
| Font | Weights Used |
|------|--------------|
| Outfit (Display) | 400, 500, 600, 700 |
| Inter (Body) | 400, 500, 600 |
| JetBrains Mono | 400, 500 |

### Type Scale
| Name | Size | Tailwind | Usage |
|------|------|----------|-------|
| Hero | 4.5rem - 6rem | `text-7xl` / `text-8xl` | Hero headlines |
| H1 | 3rem - 3.75rem | `text-5xl` / `text-6xl` | Page titles |
| H2 | 1.875rem - 3rem | `text-3xl` / `text-5xl` | Section headers |
| H3 | 1.25rem - 1.5rem | `text-xl` / `text-2xl` | Subsection headers |
| Large | 1.125rem - 1.25rem | `text-lg` / `text-xl` | Lead paragraphs |
| Base | 1rem | `text-base` | Body text |
| Small | 0.875rem | `text-sm` | Secondary text, nav |
| XS | 0.75rem | `text-xs` | Captions, labels |

### Text Styling Patterns
```css
/* Hero headline with gradient */
.hero-gradient {
  background: linear-gradient(135deg, #375DEE 0%, #FFFFFF 50%, #375DEE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 30px rgba(55, 93, 238, 0.4));
}

/* Glowing text effect */
.text-glow {
  text-shadow: 0 0 40px rgba(55, 93, 238, 0.6);
}

/* Dashboard heading gradient */
.dashboard-heading-gradient {
  background: linear-gradient(to right, #ffffff 0%, #94a8e8 45%, #375DEE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 24px rgba(55, 93, 238, 0.3));
}

/* Numbers/metrics - monospace tabular */
.font-numbers {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
```

---

## 3. Spacing & Layout

### Border Radius
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `sm` | 6px | `rounded-md` | Small elements |
| `md` | 8px | `rounded-lg` | Inputs, small cards |
| `lg` | 10px | `rounded-xl` | Buttons, cards |
| `xl` | 14px | `rounded-2xl` | Large cards |
| `2xl` | 16px | `rounded-2xl` | Sections |
| `full` | 9999px | `rounded-full` | Pills, nav items |

### Section Padding
```css
/* Vertical section spacing */
.section-padding: py-16 md:py-32;

/* Container horizontal padding */
.container-padding: px-4 md:px-6 lg:px-8;

/* Max width container */
.max-w-7xl mx-auto
```

### Card Padding
| Size | Value |
|------|-------|
| Small | `p-4 md:p-5` |
| Medium | `p-6 md:p-8` |
| Large | `p-8 md:p-16` |

### Common Gaps
- Nav items: `gap-1` to `gap-3`
- Card grid: `gap-4 md:gap-6`
- Section elements: `gap-6` to `gap-8`
- Feature list: `gap-3` to `gap-4`

---

## 4. Effects & Shadows

### Glow Shadows (Brand Blue)
```css
/* Small glow - buttons, subtle accents */
shadow-[0_0_20px_rgba(55,93,238,0.3)]

/* Medium glow - hover states */
shadow-[0_0_30px_rgba(55,93,238,0.4)]

/* Large glow - hero elements, CTAs */
shadow-[0_0_40px_rgba(55,93,238,0.5)]

/* Extra large - focused elements */
shadow-[0_0_60px_rgba(55,93,238,0.6)]
```

### Background Glows (Decorative)
```css
/* Radial glow behind content */
.glow-orb {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(55, 93, 238, 0.15) 0%, transparent 70%);
  filter: blur(100px);
  pointer-events: none;
}

/* Top page overlay glow */
.page-overlay {
  background: radial-gradient(ellipse 100% 60% at 50% -10%, rgba(55, 93, 238, 0.08) 0%, transparent 60%);
}
```

### Blur Effects
```css
/* Backdrop blur for overlays/headers */
backdrop-blur-xl      /* 24px */
backdrop-blur-2xl     /* 40px */

/* Decorative blur for glow orbs */
blur-[100px]
blur-[150px]
```

### Transitions
```css
/* Standard transition */
transition-all duration-300

/* Fast (micro-interactions) */
transition-all duration-200

/* Slow (scroll reveals) */
transition-all duration-500

/* Very slow (page transitions) */
transition-all duration-1000
```

### Hover Scale Effects
```css
/* Subtle scale on hover */
hover:scale-[1.02]

/* Press/active state */
active:scale-[0.98]
```

---

## 5. Components

### Primary Button (CTA)
```jsx
<button className="
  px-8 py-4
  bg-[#375DEE] hover:bg-[#4169E1]
  text-white text-sm
  rounded-full
  shadow-[0_0_20px_rgba(55,93,238,0.3)]
  hover:shadow-[0_0_30px_rgba(55,93,238,0.5)]
  hover:scale-[1.02] active:scale-[0.98]
  transition-all duration-300
">
  Get Started
</button>
```

### Secondary Button (Ghost)
```jsx
<button className="
  px-8 py-4
  text-white/80
  border border-white/20
  hover:border-[#375DEE]/50
  hover:shadow-[0_0_15px_rgba(55,93,238,0.2)]
  rounded-full
  transition-all duration-300
">
  Learn More
</button>
```

### Nav Link (Pill Style)
```jsx
<a className="
  px-5 py-2
  text-sm text-white/60
  hover:text-white
  hover:bg-white/[0.06]
  rounded-full
  transition-all duration-300
">
  About
</a>
```

### Card
```jsx
<div className="
  p-6 md:p-8
  bg-white/[0.02]
  border border-white/[0.06]
  hover:border-[#375DEE]/30
  rounded-2xl
  transition-all duration-300
">
  {/* Content */}
</div>
```

### Highlighted Card (Feature)
```jsx
<div className="
  p-6 md:p-10
  bg-[#375DEE]/5
  border border-[#375DEE]/30
  rounded-2xl
">
  {/* Content */}
</div>
```

### Input Field
```jsx
<input className="
  w-full
  px-4 py-3.5
  bg-white/5
  border border-white/20
  focus:border-[#375DEE]
  rounded-xl
  text-white
  placeholder:text-white/50
  outline-none
  transition-all duration-300
" />
```

### Header (Fixed, Scroll-aware)
```jsx
<header className="fixed top-0 left-0 right-0 z-[70]">
  <div className={`
    transition-[background-color,border-color] duration-300
    ${isScrolled ? "bg-black/90 backdrop-blur-xl border-b border-white/[0.08]" : ""}
  `}>
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="flex items-center justify-between h-20">
        {/* Logo + Nav */}
      </div>
    </div>
  </div>
</header>
```

### Nav Container (Pill Group)
```jsx
<div className="
  flex items-center gap-1
  p-1
  bg-white/[0.03]
  rounded-full
  border border-white/[0.06]
">
  {/* Nav links */}
</div>
```

### Section Wrapper
```jsx
<section className="
  relative
  py-16 md:py-32
  overflow-hidden
">
  {/* Optional background glow */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#375DEE]/10 rounded-full blur-[150px] pointer-events-none" />

  <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
    {/* Content */}
  </div>
</section>
```

### Footer
```jsx
<footer className="
  relative
  py-12 md:py-20
  border-t border-white/[0.06]
">
  <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
    {/* Footer content */}
  </div>
</footer>
```

---

## 6. Animations

### Fade In (Scroll Reveal)
```css
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}
```

### Fade Out
```css
@keyframes fade-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.animate-fade-out {
  animation: fade-out 0.3s ease-out forwards;
}
```

### Intersection Observer Pattern
```jsx
// Track visible sections for scroll animations
const [visibleSections, setVisibleSections] = useState(new Set())

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => new Set([...prev, entry.target.id]))
        }
      })
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  )
  // ...
}, [])

// Apply animation class
className={`transition-all duration-700 ${isVisible('section-id') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
```

---

## 7. CSS Variables (globals.css)

```css
:root {
  /* Brand */
  --brand-accent: #375DEE;

  /* Semantic colors (oklch format for Tailwind v4) */
  --background: oklch(0.08 0 0);           /* Near black */
  --foreground: oklch(0.98 0 0);           /* Near white */
  --card: oklch(0.12 0 0);
  --card-foreground: oklch(0.98 0 0);
  --popover: oklch(0.12 0 0);
  --popover-foreground: oklch(0.98 0 0);
  --primary: oklch(0.98 0 0);
  --primary-foreground: oklch(0.08 0 0);
  --secondary: oklch(0.15 0 0);
  --secondary-foreground: oklch(0.98 0 0);
  --muted: oklch(0.25 0 0);
  --muted-foreground: oklch(0.65 0 0);
  --border: oklch(0.18 0 0);
  --input: oklch(0.15 0 0);
  --ring: oklch(0.98 0 0);
  --radius: 0.625rem;

  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --font-display: "Outfit", system-ui, sans-serif;
}

/* Grid background layers */
.page-background {
  position: fixed;
  inset: 0;
  background: #050505;
  z-index: 0;
  pointer-events: none;
}

.page-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse 100% 60% at 50% -10%, rgba(55, 93, 238, 0.08) 0%, transparent 60%);
  pointer-events: none;
  z-index: 2;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #333333;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #444444;
}
```

---

## 8. Mobile Menu Pattern

```jsx
{/* Fullscreen overlay menu */}
<div className="fixed inset-0 z-[60] md:hidden animate-fade-in">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/98 backdrop-blur-xl" />

  {/* Centered nav links */}
  <div className="relative h-full flex flex-col items-center justify-center gap-6">
    {menuItems.map((item) => (
      <a
        key={item}
        href={`/${item.toLowerCase()}`}
        className="
          text-4xl font-light
          text-white/80 hover:text-[#375DEE]
          transition-colors duration-300
        "
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {item}
      </a>
    ))}

    {/* CTA in menu */}
    <a className="
      mt-6 px-10 py-4
      text-lg
      bg-[#375DEE]
      rounded-full
      shadow-[0_0_30px_rgba(55,93,238,0.4)]
      hover:shadow-[0_0_40px_rgba(55,93,238,0.6)]
      hover:scale-[1.02] active:scale-[0.98]
      transition-all duration-300
    ">
      Get Started
    </a>
  </div>
</div>
```

---

## 9. Hamburger Menu Animation

```jsx
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.1]">
  <div className="relative w-4 h-3 flex flex-col justify-between">
    <span className={`block h-[1.5px] bg-white rounded-full transition-all duration-300 ${isOpen ? "rotate-45 translate-y-[5px]" : ""}`} />
    <span className={`block h-[1.5px] bg-white rounded-full transition-all duration-300 ${isOpen ? "opacity-0" : ""}`} />
    <span className={`block h-[1.5px] bg-white rounded-full transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-[5px]" : ""}`} />
  </div>
</button>
```

---

## 10. Quick Reference

### Essential Tailwind Classes
```
/* Backgrounds */
bg-black bg-white/[0.02] bg-white/[0.05] bg-[#375DEE] bg-[#375DEE]/5 bg-[#375DEE]/10

/* Text */
text-white text-white/60 text-white/40 text-white/20 text-[#375DEE]

/* Borders */
border-white/[0.06] border-white/10 border-white/20 border-[#375DEE]/30 border-[#375DEE]/50

/* Shadows */
shadow-[0_0_20px_rgba(55,93,238,0.3)] shadow-[0_0_40px_rgba(55,93,238,0.5)]

/* Blur */
backdrop-blur-xl blur-[100px]

/* Transitions */
transition-all duration-300

/* Transforms */
hover:scale-[1.02] active:scale-[0.98]

/* Layout */
rounded-full rounded-2xl rounded-xl
```

### Color Cheat Sheet
| Use Case | Color Value |
|----------|-------------|
| Brand accent | `#375DEE` |
| Brand hover | `#4169E1` |
| Background | `#000000` |
| Card bg | `rgba(255,255,255,0.02)` |
| Primary text | `#FFFFFF` |
| Secondary text | `rgba(255,255,255,0.60)` |
| Muted text | `rgba(255,255,255,0.40)` |
| Border default | `rgba(255,255,255,0.06)` |
| Glow | `rgba(55,93,238,0.3)` |

---

## 11. Tech Stack

- **Framework**: Next.js 14+
- **Styling**: Tailwind CSS 4
- **Fonts**: Google Fonts (Outfit, Inter, JetBrains Mono)
- **UI Components**: shadcn/ui (optional)
- **Icons**: Lucide React

---

This theme system can be adapted for any premium, modern, dark-themed website by replacing the brand color (`#375DEE`) with your desired accent color.
