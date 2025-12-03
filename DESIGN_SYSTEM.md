# Caberu Design System

A comprehensive, semantic design system ensuring consistency across the application.

## 🎨 Colors

All colors use HSL format and support both light and dark modes automatically.

### Usage in Components

```tsx
// ✅ CORRECT - Use semantic tokens
<div className="bg-primary text-primary-foreground">
<div className="bg-card border-border">
<div className="text-muted-foreground">

// ✅ CORRECT - Use status colors
<Badge className="bg-success text-success-foreground">
<Alert className="bg-error-bg text-error">

// ❌ WRONG - Never use direct colors
<div className="bg-blue-500 text-white">
<div className="bg-[#1E90FF]">
```

### Color Palette

#### Brand Colors
- **Primary (Dental Blue)**: `hsl(199 89% 48%)` - Main brand color, CTAs, links
- **Secondary (Dental Green)**: `hsl(142 71% 45%)` - Success states, positive actions
- **Accent (Purple)**: `hsl(279 70% 52%)` - Highlights, special features

#### Status Colors
- **Success**: `hsl(142 71% 45%)` - Completed, approved, paid
- **Warning**: `hsl(38 92% 50%)` - Pending, caution
- **Error**: `hsl(0 72% 51%)` - Failed, cancelled, overdue
- **Info**: `hsl(217 91% 60%)` - Information, scheduled

#### Appointment Statuses
```tsx
const appointmentColors = {
  scheduled: 'bg-info text-info-foreground',
  confirmed: 'bg-success text-success-foreground',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-error text-error-foreground',
  emergency: 'bg-destructive text-destructive-foreground',
};
```

#### Payment Statuses
```tsx
const paymentColors = {
  paid: 'bg-success text-success-foreground',
  pending: 'bg-warning text-warning-foreground',
  overdue: 'bg-error text-error-foreground',
  partial: 'bg-info text-info-foreground',
};
```

## 📝 Typography

### Font Families
- **Headings**: Plus Jakarta Sans (bold, display)
- **Body**: Inter (clean, readable)
- **Code**: SF Mono (monospace)

### Font Hierarchy

```tsx
// Headings - Use font-heading
<h1 className="font-heading text-3xl font-bold">Page Title</h1>
<h2 className="font-heading text-2xl font-bold">Section Title</h2>
<h3 className="font-heading text-xl font-semibold">Subsection</h3>

// Body - Default font-sans
<p className="text-base">Regular text</p>
<p className="text-sm text-muted-foreground">Secondary text</p>
<p className="text-xs">Caption text</p>

// Large/Display
<div className="text-lg">Large body text</div>
<h1 className="text-4xl font-heading font-extrabold">Hero heading</h1>
```

### Text Sizes
- `text-xs`: 12px - Captions, labels
- `text-sm`: 14px - Secondary text, descriptions
- `text-base`: 16px - Body text (default)
- `text-lg`: 18px - Emphasized body
- `text-xl`: 20px - H4
- `text-2xl`: 24px - H3
- `text-3xl`: 30px - H2
- `text-4xl`: 36px - H1

### Font Weights
- `font-light`: 300
- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700
- `font-extrabold`: 800

## 🎯 Spacing

Use consistent spacing scale (4px base unit):

```tsx
// Padding/Margin
p-1 = 4px    p-4 = 16px   p-8 = 32px
p-2 = 8px    p-5 = 20px   p-10 = 40px
p-3 = 12px   p-6 = 24px   p-12 = 48px

// Common patterns
<div className="p-4 space-y-4">     // 16px padding, 16px between children
<div className="p-6 space-y-6">     // 24px padding, 24px between children
<div className="px-4 py-3">         // 16px horizontal, 12px vertical
```

## 🔲 Components

### Buttons

```tsx
// Primary action
<Button variant="default">Save</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Subtle action
<Button variant="ghost">Edit</Button>
<Button variant="link">Learn more</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

### Cards

```tsx
// Standard card
<Card className="p-6">
  <CardHeader>
    <CardTitle className="font-heading">Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>

// Interactive card
<Card className="hover:shadow-lg transition-shadow cursor-pointer">
  ...
</Card>

// Status card
<Card className="border-l-4 border-success">
  ...
</Card>
```

### Badges

```tsx
// Status badges
<Badge className="bg-success text-success-foreground">Completed</Badge>
<Badge className="bg-warning text-warning-foreground">Pending</Badge>
<Badge className="bg-error text-error-foreground">Cancelled</Badge>
<Badge className="bg-info text-info-foreground">Scheduled</Badge>

// Variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

## 🎨 Design Patterns

### Currency Display

**ALWAYS use the useCurrency hook** for consistent currency formatting:

```tsx
import { useCurrency } from '@/hooks/useCurrency';

function PaymentCard() {
  const { settings } = useCurrency(dentistId);
  
  return (
    <div>
      <span>{settings.format(930.50)}</span>  // €930.50 or $930.50
    </div>
  );
}
```

### Status Indicators

```tsx
// Use getStatusColor from design system
import { getStatusColor } from '@/lib/design-system';

const statusColor = getStatusColor('completed'); // Returns proper HSL color

// Or use pre-defined classes
<Badge className={appointmentColors[status]}>{status}</Badge>
```

### Empty States

```tsx
<div className="flex flex-col items-center justify-center p-8 text-center">
  <Icon className="w-12 h-12 text-muted-foreground mb-4" />
  <h3 className="font-heading text-lg font-semibold mb-2">No data found</h3>
  <p className="text-sm text-muted-foreground max-w-sm">
    Description of empty state
  </p>
  <Button className="mt-4">Take Action</Button>
</div>
```

### Loading States

```tsx
import { Skeleton } from '@/components/ui/skeleton';

<Card>
  <Skeleton className="h-4 w-3/4 mb-2" />
  <Skeleton className="h-4 w-1/2" />
</Card>
```

## 📱 Responsive Design

### Breakpoints
- `mobile`: 320px - Small phones
- `mobile-md`: 375px - Standard phones
- `mobile-lg`: 414px - Large phones
- `tablet`: 768px - Tablets
- `laptop`: 1024px - Small laptops
- `desktop`: 1280px - Desktops
- `wide`: 1536px - Large displays

### Mobile-First Approach

```tsx
// ✅ CORRECT - Mobile first, then scale up
<div className="p-3 md:p-4 lg:p-6">
<div className="text-sm md:text-base lg:text-lg">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ❌ WRONG - Desktop first
<div className="p-6 md:p-4 mobile:p-3">
```

### Touch Targets

Ensure all interactive elements are at least 44x44px:

```tsx
// Buttons automatically handle this
<Button>Click me</Button>

// For custom elements, add touch-target class
<div className="touch-target cursor-pointer">
  <Icon className="w-5 h-5" />
</div>
```

## ⚡ Animations

Use built-in animation utilities:

```tsx
// Fade in
<div className="animate-fade-in">

// Slide in
<div className="animate-slide-in">

// Scale in
<div className="animate-scale-in">

// Gentle bounce
<div className="animate-bounce-gentle">

// Hover effects
<Card className="transition-transform hover:scale-105 hover:shadow-lg">
```

## 🎯 Accessibility

### Contrast
- All text meets WCAG AA standards
- Status colors have sufficient contrast
- Focus states are clearly visible

### Focus Styles
```tsx
// Automatically applied, but can be customized
<button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
```

### Semantic HTML
```tsx
// ✅ Use proper semantic elements
<header>...</header>
<nav>...</nav>
<main>...</main>
<article>...</article>
<footer>...</footer>

// ✅ Proper heading hierarchy
<h1> → <h2> → <h3> (no skipping levels)
```

## 🚫 Don'ts

❌ Never use hardcoded colors:
```tsx
// WRONG
<div className="bg-blue-500 text-white">
<div style={{ backgroundColor: '#1E90FF' }}>
```

❌ Never skip heading levels:
```tsx
// WRONG
<h1>Title</h1>
<h3>Subsection</h3>  // Skipped h2!
```

❌ Never use non-semantic class names:
```tsx
// WRONG
<div className="text-[#333333]">
<div className="bg-[rgb(25,135,255)]">
```

❌ Never mix different color systems:
```tsx
// WRONG - mixing dental-primary with success-600
<div className="bg-dental-primary text-success-600">
```

## ✅ Do's

✅ Always use semantic tokens:
```tsx
<div className="bg-card text-card-foreground border-border">
```

✅ Use the design system helper functions:
```tsx
import { getStatusColor, getColor } from '@/lib/design-system';
```

✅ Follow the component hierarchy:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

✅ Use consistent spacing:
```tsx
<div className="space-y-4"> // Consistent 16px gaps
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## 📦 Importing the Design System

```tsx
// Use the design system utilities
import { 
  getColor, 
  getStatusColor, 
  typography, 
  colors 
} from '@/lib/design-system';

// Use currency formatting
import { useCurrency } from '@/hooks/useCurrency';

// Example
const appointmentColor = getStatusColor('scheduled');
const primaryColor = getColor('primary');
```

## 🔄 Dark Mode Support

The design system automatically supports dark mode. All colors are defined for both themes:

```tsx
// No special handling needed - just use semantic tokens
<Card className="bg-card text-card-foreground">
  // Works in both light and dark mode!
</Card>
```

## 📚 Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Shadcn UI**: https://ui.shadcn.com
- **Color Tool**: https://www.tailwindshades.com
- **Typography Scale**: https://typescale.com

---

**Last Updated**: 2025-01-04
**Version**: 1.0.0
