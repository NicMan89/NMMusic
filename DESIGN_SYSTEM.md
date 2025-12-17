# 🎨 NM Music Design System

## Brand Identity

### Logo
Il logo NM Music è una variante del brand NMworks, specializzata per il dipartimento musica:
- **Lettere NM**: Cyan luminoso con effetto 3D (#00E5FF)
- **Scritta MUSIC**: Viola gradient (#9C27B0 → #E040FB) 
- **Cornice**: Rettangolo con bordi luminosi cyan
- **Freccia**: Elemento dinamico viola che attraversa il logo

### Color Palette

#### Primary Colors
```css
--bg-primary: #0a0a0f       /* Background principale - scuro */
--bg-secondary: #121218     /* Background cards/elementi */
--bg-elevated: #1a1a24      /* Elementi sollevati */
```

#### Accent Colors
```css
--accent-cyan: #00E5FF           /* Cyan luminoso - primario */
--accent-cyan-dark: #00B8D4      /* Cyan scuro */
--accent-purple: #9C27B0         /* Viola - secondario */
--accent-purple-light: #E040FB   /* Viola chiaro */
```

#### Text Colors
```css
--text-primary: #ffffff     /* Testo principale */
--text-secondary: #b3b3b3   /* Testo secondario */
```

### Typography
- **Font Family**: Inter (sans-serif moderno)
- **Headers**: 24-72px, Bold-Black (700-900)
- **Body**: 14-16px, Regular-Medium (400-500)
- **UI Elements**: 12-14px, Medium-SemiBold (500-600)

## UI Components

### 1. Barra Top Luminosa
Ispirata alla cornice del logo:
```css
/* Gradiente cyan → purple con glow */
background: linear-gradient(90deg, #00E5FF 0%, #E040FB 100%);
box-shadow: 0 0 12px rgba(0, 229, 255, 0.6);
height: 2-3px;
```

**Utilizzo**:
- Top border del player bar
- Separatore nella sidebar header
- Top border su card hover

### 2. Progress Bar
Replica la barra luminosa del logo:
```css
/* Riempimento con gradient */
background: linear-gradient(90deg, #00E5FF 0%, #E040FB 100%);
box-shadow: 0 0 8px rgba(0, 229, 255, 0.6);

/* Highlight superiore */
top-line: gradient(white 0%, transparent 100%);
```

### 3. Buttons

#### Primary Button (CTA)
```css
background: linear-gradient(135deg, #9C27B0 0%, #E040FB 100%);
box-shadow: 0 4px 12px rgba(156, 39, 176, 0.4);
border-radius: 500px;
/* Hover: glow intensificato */
```

#### Play Button
```css
background: linear-gradient(135deg, #00E5FF 0%, #E040FB 100%);
box-shadow: 0 4px 12px rgba(0, 229, 255, 0.3);
/* Effetto shine su hover */
```

### 4. Cards
```css
background: var(--bg-secondary);
border: 1px solid transparent;
border-radius: 8px;

/* Hover state */
border-color: rgba(0, 229, 255, 0.3);
box-shadow: 0 8px 24px rgba(0, 229, 255, 0.15);
/* Top border gradient appare */
```

### 5. Sidebar
```css
/* Border destro con gradient verticale */
border-right: gradient(
  #00E5FF 0%,
  transparent 20%,
  transparent 80%,
  #00E5FF 100%
);
```

## Effects & Animations

### Glow Effect
```css
box-shadow: 
  0 0 8px rgba(0, 229, 255, 0.5),    /* Cyan glow */
  0 0 12px rgba(224, 64, 251, 0.3);  /* Purple glow */
```

### Shine Animation
```css
/* Slide da sinistra a destra */
@keyframes shine {
  from { left: -100%; }
  to { left: 100%; }
}

/* Gradient overlay */
background: linear-gradient(90deg, 
  transparent, 
  rgba(255,255,255,0.3), 
  transparent
);
```

### Hover Transitions
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
/* Smooth e naturale */
```

## Layout Principles

### Spacing Scale
```
4px   - Tiny (padding interni)
8px   - Small (gap elementi vicini)
12px  - Medium (gap cards)
16px  - Base (padding standard)
24px  - Large (sezioni)
40px  - XLarge (spacing hero)
```

### Border Radius
```
4px   - Small (thumbnails)
8px   - Medium (cards)
12px  - Large (modals)
500px - Pill (buttons)
```

### Shadows
```
Elevated: 0 4px 12px rgba(0, 0, 0, 0.2)
Glow: 0 0 12px rgba(0, 229, 255, 0.5)
Hover: 0 8px 24px rgba(0, 229, 255, 0.2)
```

## Iconography

- **Style**: Font Awesome solid
- **Sizes**: 16px (small), 20px (medium), 24px (large)
- **Color**: Inherit da parent (con hover state)

## Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  --sidebar-width: 0;
  /* Sidebar nascosta, hamburger menu */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Layout ottimizzato */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full layout */
}
```

## Accessibility

- **Contrast Ratio**: Minimo 4.5:1 per testo normale
- **Focus States**: Outline cyan luminoso
- **Touch Targets**: Minimo 44x44px su mobile
- **Keyboard Navigation**: Tutti gli elementi interattivi

## Motion Guidelines

### Durations
- **Fast**: 150ms (micro-interactions)
- **Base**: 300ms (transizioni standard)
- **Slow**: 500ms (animazioni complesse)

### Easing
```css
/* Naturale */
cubic-bezier(0.4, 0, 0.2, 1)

/* Bounce in */
cubic-bezier(0.68, -0.55, 0.265, 1.55)

/* Ease out */
ease-out
```

## Usage Examples

### Hero Section
```html
<div class="hero">
  <!-- Barra luminosa top -->
  <div class="hero-glow-bar"></div>
  
  <!-- Contenuto -->
  <h1>Welcome to NM Music</h1>
  
  <!-- CTA gradient -->
  <button class="btn-primary">Get Started</button>
</div>
```

### Playlist Card
```html
<div class="playlist-card">
  <!-- Top glow (appare su hover) -->
  <div class="card-glow-top"></div>
  
  <!-- Cover con effetto -->
  <div class="card-cover">
    <img src="..." />
  </div>
  
  <!-- Info -->
  <h3>Playlist Name</h3>
  <p>12 tracks</p>
</div>
```

### Progress Bar
```html
<div class="progress-container">
  <!-- Background -->
  <div class="progress-bg">
    <!-- Fill con gradient e glow -->
    <div class="progress-fill" style="width: 60%">
      <!-- Highlight line -->
      <div class="progress-highlight"></div>
    </div>
  </div>
  <!-- Slider invisibile sopra -->
  <input type="range" class="progress-slider" />
</div>
```

## Implementation Notes

### CSS Organization
```
styles/
├── main.css
│   ├── 1. CSS Variables (colors, spacing)
│   ├── 2. Base & Reset
│   ├── 3. Layout (grid, flex)
│   ├── 4. Components
│   ├── 5. Utilities
│   └── 6. Responsive
```

### Performance
- **Gradients**: Use sparingly (GPU intensive)
- **Shadows**: Combine multiple shadows in single property
- **Animations**: Use `transform` and `opacity` (hardware accelerated)
- **Will-change**: Only on actively animating elements

### Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (con prefixes per alcuni effects)
- Mobile browsers: ✅ Ottimizzato

## Brand Guidelines

### Do's ✅
- Usa gradient cyan → purple per elementi importanti
- Applica glow effect con moderazione
- Mantieni contrasto leggibile
- Usa animazioni smooth e naturali

### Don'ts ❌
- Non usare colori fuori palette
- Non esagerare con effetti glow (max 2-3 per view)
- Non animare troppi elementi contemporaneamente
- Non usare gradient su testo piccolo

## Future Enhancements

Possibili evoluzioni del design:
- [ ] Dark/Light mode toggle (mantenendo brand colors)
- [ ] Temi personalizzabili (cyan/purple variants)
- [ ] Animazioni avanzate (particles, morphing)
- [ ] Micro-interactions (haptic feedback su mobile)
- [ ] Glassmorphism effects (con backdrop-filter)

---

**Design by NMworks** | Version 1.0
