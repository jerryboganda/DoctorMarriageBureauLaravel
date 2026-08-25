# Doctor Marriage Bureau — "Royal Medical Rose" Design System (SSOT)

> **IMMUTABLE DESIGN STANDARD:** This document defines the permanent, default UI/UX design language for the Doctor Marriage Bureau web platform. All future developments, pages, and components must adhere 100% to this specification without deviation.

---

## 1. Design System Name: **Royal Medical Rose** (الوردة الملكية)

A prestigious, high-trust luxury matrimonial aesthetic designed specifically for medical doctors, surgeons, and healthcare professionals. It balances the warmth and romance of **Vibrant Matrimonial Rose** with the institutional authority and confidentiality of **Deep Royal Navy**, accented with **Islamic Gold** and authentic Arabic calligraphy.

---

## 2. Color Palette (Strict Hex Codes)

### **Primary Brand: Matrimonial Rose**
```css
--brand-50:  #FFF0F5; /* Lightest subtle tint */
--brand-100: #FFE1EC; /* Soft border & pill background */
--brand-200: #FFC2D9; /* Card highlights */
--brand-300: #FFA3C6; /* Glow & accent text */
--brand-400: #FF649F; /* Gradient midpoint */
--brand-500: #FF206E; /* PRIMARY BRAND COLOR — Main CTA & Buttons */
--brand-600: #E60B5B; /* Hover CTA */
--brand-700: #BF0047; /* Active pressed state */
--brand-800: #990039; /* Deep tone */
--brand-900: #73002B; /* Dark shadow tint */
--brand-950: #4D001C; /* Ultra deep */
```

### **Secondary Brand: Deep Royal Navy**
```css
--navy-50:  #F4F4F8; /* Subtle background contrast */
--navy-100: #E8E7F0; /* Clean borders */
--navy-200: #D1CFE2; /* Muted borders */
--navy-300: #B0ADC9; /* Muted icons */
--navy-400: #8580A9; /* Secondary subtitle text */
--navy-500: #615C8C; /* Body labels */
--navy-600: #494473; /* Subheadings */
--navy-700: #3A365D; /* Strong text */
--navy-800: #322F56; /* PRIMARY TEXT COLOR */
--navy-900: #1E1B38; /* DARK HERO / FOOTER BACKGROUND */
--navy-950: #110F22; /* MIDNIGHT BASE */
```

### **Accent: Islamic Gold**
```css
--gold-DEFAULT: #D4AF37; /* Verified badges & VIP seals */
--gold-light:   #F4E295;
--gold-dark:    #997D1A;
```

### **Page Canvas**
```css
--canvas-bg:   #FAFAFD; /* Clean, premium soft white */
--card-bg:     #FFFFFF; /* Pure crisp white container */
```

---

## 3. Typography Hierarchy

1. **Headlines & Emphases (Serif):** `Playfair Display`, `Georgia`, serif
   - Weight: `600` (SemiBold), `700` (Bold), `900` (Black)
   - Style: Elegant, luxury, matrimonial authority.
2. **Body, Navigation & Controls (Sans):** `Inter`, system-ui, sans-serif
   - Weight: `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold)
   - Style: Ultra-clean, high legibility, crisp rendering.
3. **Islamic Hadith & Calligraphy (Arabic):** `Amiri`, `Traditional Arabic`, serif
   - Style: Quranic quotes, Sunnah calligraphy badges (`« النِّكَاحُ نِصْفُ الْإِيمَانِ »`).

---

## 4. Glassmorphism & Shadow Tokens

```css
/* Glass Card (Light) */
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 32, 110, 0.08);

/* Glass Card (Dark) */
background: rgba(30, 27, 56, 0.85);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);

/* Shadows */
box-shadow: 0 10px 30px -5px rgba(50, 47, 86, 0.08), 0 0 0 1px rgba(255, 32, 110, 0.06); /* shadow-luxury */
box-shadow: 0 20px 40px -10px rgba(50, 47, 86, 0.15), 0 0 0 1px rgba(255, 32, 110, 0.15); /* shadow-luxury-hover */
```

---

## 5. Standard Component Conventions

1. **CTA Buttons:** `bg-gradient-to-r from-brand-500 via-brand-600 to-pink-600 text-white rounded-full shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5`
2. **Hero Video Background:** `<video>` with `opacity-35 saturate-150` under `bg-gradient-to-t from-navy-950 via-navy-900/80 to-navy-950/90`.
3. **Verified Badge:** Emerald green `#10B981` pill with `<ShieldCheck />` icon.
4. **Card Radius:** `rounded-2xl` or `rounded-3xl` for modern luxury curves.
