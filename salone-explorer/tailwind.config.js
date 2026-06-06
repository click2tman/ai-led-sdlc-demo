// Tailwind config: maps FambulTik/TpGroup design tokens (src/styles/tokens.css)
// to Tailwind theme keys as CSS variables. No magic colours; all visuals
// derive from tokens per SPEC §8.4.
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-brand-primary)',
          secondary: 'var(--color-brand-secondary)',
          accent: 'var(--color-brand-accent)',
          sand: 'var(--color-brand-sand)',
        },
        tpgroup: { primary: 'var(--color-tpgroup-primary)' },
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        text: { DEFAULT: 'var(--color-text)', muted: 'var(--color-text-muted)' },
        border: 'var(--color-border)',
        focusring: 'var(--color-focus-ring)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        display: 'var(--font-display)',
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        full: 'var(--r-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
    },
  },
  plugins: [],
};
