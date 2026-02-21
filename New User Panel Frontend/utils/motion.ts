import { Variants } from 'framer-motion';

// --- Tokens ---
export const TRANSITION_SPRING = { type: "spring", stiffness: 350, damping: 30 };
export const TRANSITION_EASE = { duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }; // Cubic bezier for smooth UI
export const TRANSITION_QUICK = { duration: 0.15, ease: "easeOut" };

// --- Variants ---

// Page / View Transitions
export const PAGE_VARIANTS: Variants = {
  initial: { opacity: 0, x: -8, filter: 'blur(4px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: TRANSITION_EASE },
  exit: { opacity: 0, x: 8, filter: 'blur(4px)', transition: { duration: 0.2, ease: "easeIn" } },
};

// Staggered Containers (Lists, Grids)
export const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05
    }
  },
  exit: { opacity: 0 }
};

// Individual Items (Cards, List Rows)
export const FADE_UP_ITEM: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: TRANSITION_SPRING
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } }
};

// Modals & Overlays
export const MODAL_BACKDROP: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } }
};

export const MODAL_PANEL: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 25, delay: 0.05 }
  },
  exit: { opacity: 0, scale: 0.98, y: 8, transition: { duration: 0.15 } }
};

// Micro-interactions
export const BTN_TAP = { scale: 0.97 };
export const BTN_HOVER = { scale: 1.02 };
