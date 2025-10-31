# DentiBot Brand Guidelines

## 🎨 Brand Identity

DentiBot is a modern, professional dental practice management platform. Our brand conveys **trust, innovation, and care** through clean design and approachable interactions.

---

## Logo

### Usage
- **Primary Logo**: Full logo with icon + text (default for most contexts)
- **Icon Only**: Use when space is limited (mobile, favicons, app icons)
- **Text Only**: Use in dense text environments or when icon is redundant

### Logo Variants
```tsx
import { Logo, AnimatedLogo, FaviconIcon } from '@/components/Logo';

// Standard usage
<Logo size="md" variant="full" />

// Icon only for compact spaces
<Logo size="sm" variant="icon" />

// Animated for loading/splash screens
<AnimatedLogo size="lg" />
```

### Clear Space
Maintain a clear space around the logo equal to the height of the tooth icon on all sides.

### Don'ts
- ❌ Don't rotate or skew the logo
- ❌ Don't change the gradient colors
- ❌ Don't add effects (drop shadows, outlines)
- ❌ Don't place on busy backgrounds without a container

---

## Color Palette

### Primary Colors
```css
--primary-blue: #2563eb;      /* Primary brand color - buttons, links, CTAs */
--primary-purple: #7c3aed;    /* Secondary brand color - gradients, accents */
--primary-gradient: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
```

**Usage**: Primary actions, navigation highlights, brand elements

### Semantic Colors
```css
--success-green: #10b981;     /* Success states, confirmations */
--warning-amber: #f59e0b;     /* Warnings, cautions */
--error-red: #ef4444;         /* Errors, destructive actions */
--info-blue: #3b82f6;         /* Information, tips */
```

### Neutral Colors
```css
--gray-50: #f9fafb;           /* Backgrounds, cards */
--gray-100: #f3f4f6;          /* Hover states */
--gray-200: #e5e7eb;          /* Borders */
--gray-300: #d1d5db;          /* Disabled states */
--gray-400: #9ca3af;          /* Placeholder text */
--gray-500: #6b7280;          /* Secondary text */
--gray-600: #4b5563;          /* Body text */
--gray-700: #374151;          /* Headings */
--gray-800: #1f2937;          /* High emphasis text */
--gray-900: #111827;          /* Primary headings */
```

### Color Usage Guidelines

#### Backgrounds
- **Primary Surface**: `white` or `gray-50`
- **Secondary Surface**: `gray-100`
- **Elevated Surface**: `white` with subtle shadow

#### Text
- **Primary Text**: `gray-900` (dark mode: `gray-50`)
- **Secondary Text**: `gray-600` (dark mode: `gray-400`)
- **Disabled Text**: `gray-400`
- **Link Text**: `blue-600` hover `blue-700`

#### Actions
- **Primary Button**: `primary-gradient` with white text
- **Secondary Button**: `gray-100` with `gray-900` text
- **Destructive Button**: `red-600` with white text
- **Ghost Button**: Transparent with colored text

---

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

System fonts for optimal performance and native feel across platforms.

### Type Scale

#### Headings
```css
h1: 2.25rem (36px) / 2.5rem (40px)  font-bold    /* Page titles */
h2: 1.875rem (30px) / 2.25rem (36px) font-bold   /* Section titles */
h3: 1.5rem (24px) / 2rem (32px)      font-semibold /* Subsection titles */
h4: 1.25rem (20px) / 1.75rem (28px)  font-semibold /* Card titles */
h5: 1.125rem (18px) / 1.75rem (28px) font-medium  /* Small headings */
h6: 1rem (16px) / 1.5rem (24px)      font-medium  /* Micro headings */
```

#### Body Text
```css
body-lg:   1.125rem (18px) / 1.75rem (28px)  font-normal  /* Large body text */
body:      1rem (16px) / 1.5rem (24px)       font-normal  /* Default body text */
body-sm:   0.875rem (14px) / 1.25rem (20px)  font-normal  /* Small body text */
caption:   0.75rem (12px) / 1rem (16px)      font-normal  /* Captions, labels */
```

### Font Weights
- **Bold**: 700 (headings, emphasis)
- **Semibold**: 600 (subheadings, buttons)
- **Medium**: 500 (labels, navigation)
- **Normal**: 400 (body text)

---

## Spacing System

Using a 4px base unit with a consistent scale:

```css
--spacing-1:  0.25rem (4px)
--spacing-2:  0.5rem (8px)
--spacing-3:  0.75rem (12px)
--spacing-4:  1rem (16px)
--spacing-5:  1.25rem (20px)
--spacing-6:  1.5rem (24px)
--spacing-8:  2rem (32px)
--spacing-10: 2.5rem (40px)
--spacing-12: 3rem (48px)
--spacing-16: 4rem (64px)
--spacing-20: 5rem (80px)
--spacing-24: 6rem (96px)
```

### Layout Spacing
- **Component Padding**: 16px (spacing-4) to 24px (spacing-6)
- **Section Spacing**: 48px (spacing-12) to 64px (spacing-16)
- **Container Max Width**: 1280px (max-w-7xl)
- **Page Padding**: 16px mobile, 24px desktop

---

## Border Radius

```css
--radius-sm:  0.25rem (4px)   /* Small elements, badges */
--radius-md:  0.5rem (8px)    /* Default, cards, buttons */
--radius-lg:  0.75rem (12px)  /* Large cards, modals */
--radius-xl:  1rem (16px)     /* Hero sections */
--radius-full: 9999px         /* Pills, avatars */
```

---

## Shadows

### Elevation System
```css
/* Subtle elevation - cards, dropdowns */
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* Default elevation - buttons, cards on hover */
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

/* High elevation - modals, popovers */
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

/* Maximum elevation - dialogs, notifications */
shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

---

## Icons

### Icon Library
Using [Lucide React](https://lucide.dev/) for consistent, modern icons.

### Icon Sizes
```css
--icon-sm:  1rem (16px)      /* Inline with text, badges */
--icon-md:  1.25rem (20px)   /* Default, buttons */
--icon-lg:  1.5rem (24px)    /* Navigation, cards */
--icon-xl:  2rem (32px)      /* Feature icons, empty states */
--icon-2xl: 3rem (48px)      /* Hero icons */
```

### Icon Colors
Icons should inherit text color by default. Use semantic colors for status icons.

---

## Animation & Transitions

### Duration
```css
--duration-fast:   150ms      /* Micro-interactions, hover */
--duration-base:   200ms      /* Default transitions */
--duration-slow:   300ms      /* Complex animations */
--duration-slower: 500ms      /* Page transitions */
```

### Easing
```css
--ease-in:      cubic-bezier(0.4, 0, 1, 1)
--ease-out:     cubic-bezier(0, 0, 0.2, 1)
--ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1)
```

### Common Transitions
```css
/* Hover effects */
transition: all 150ms ease-in-out;

/* Color changes */
transition: background-color 200ms ease-out, color 200ms ease-out;

/* Scale animations */
transition: transform 200ms ease-out;

/* Opacity fades */
transition: opacity 300ms ease-in-out;
```

---

## Components

### Buttons

#### Primary Button
```tsx
className="bg-gradient-to-r from-blue-600 to-purple-600
           text-white font-semibold px-6 py-2.5 rounded-lg
           hover:from-blue-700 hover:to-purple-700
           transition-all duration-200 shadow-md hover:shadow-lg"
```

#### Secondary Button
```tsx
className="bg-gray-100 text-gray-900 font-semibold px-6 py-2.5
           rounded-lg hover:bg-gray-200 transition-colors duration-200"
```

#### Ghost Button
```tsx
className="text-blue-600 font-semibold px-4 py-2
           hover:bg-blue-50 rounded-lg transition-colors duration-200"
```

### Cards
```tsx
className="bg-white rounded-lg shadow-sm border border-gray-200
           p-6 hover:shadow-md transition-shadow duration-200"
```

### Inputs
```tsx
className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
           focus:outline-none focus:ring-2 focus:ring-blue-500
           focus:border-transparent transition-all duration-200"
```

---

## Accessibility

### Color Contrast
- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text** (18px+): Minimum 3:1 contrast ratio
- **UI Components**: Minimum 3:1 contrast ratio

### Focus States
Always provide visible focus indicators:
```css
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

### Motion
Respect `prefers-reduced-motion` for users with motion sensitivity:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Voice & Tone

### Brand Voice
- **Professional but Approachable**: We're experts, but not intimidating
- **Clear & Concise**: Respect users' time with straightforward language
- **Helpful & Supportive**: Guide users through their journey
- **Trustworthy**: Healthcare requires trust, use authoritative but warm tone

### Writing Guidelines
- Use active voice: "Schedule your appointment" not "Your appointment can be scheduled"
- Be conversational but professional: "Let's get started" not "Initiate onboarding"
- Use dental terminology when needed, but explain complex terms
- Keep error messages helpful: "Please enter a valid email" not "Invalid input"

### Examples

#### ✅ Good
- "Welcome to DentiBot! Let's set up your practice."
- "Appointment confirmed for tomorrow at 2:00 PM"
- "This patient has 3 upcoming appointments"

#### ❌ Avoid
- "Initialization of user profile commencing"
- "Temporal scheduling confirmation established"
- "Patient entity contains appointment records (qty: 3)"

---

## File Naming Conventions

### Components
- PascalCase: `AppointmentCard.tsx`, `PatientList.tsx`
- Collocate tests: `AppointmentCard.test.tsx`

### Utilities
- camelCase: `dateUtils.ts`, `exportUtils.ts`

### Assets
- kebab-case: `logo-icon.svg`, `hero-image.png`

---

## Responsive Breakpoints

```css
/* Mobile first approach */
sm:  640px   /* Small devices (landscape phones) */
md:  768px   /* Medium devices (tablets) */
lg:  1024px  /* Large devices (laptops) */
xl:  1280px  /* Extra large devices (desktops) */
2xl: 1536px  /* 2X large devices (large desktops) */
```

---

## Additional Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Version**: 1.0.0
**Last Updated**: October 2025
**Maintained by**: DentiBot Team
