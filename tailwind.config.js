/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './*.html',
    './calculators/*.html',
    './blog/**/*.html',
    './assets/js/**/*.js'
  ],
  theme: {
    /* ===== Refined breakpoints ===== */
    screens: {
      sm:  '640px',
      md:  '768px',
      lg:  '1024px',
      xl:  '1280px',
      '2xl': '1536px'
    },

    /* ===== Type ===== */
    fontFamily: {
      sans:    ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      display: ['Inter', 'system-ui', 'sans-serif'],
      mono:    ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'Menlo', 'monospace']
    },

    /* Fluid type scale — sizes flex with the viewport, no media queries.
       Anchor points: 320px (min) and 1280px (max viewport). */
    fontSize: {
      'xs':       ['clamp(0.7rem,  0.66rem + 0.20vw, 0.78rem)', { lineHeight: '1.5', letterSpacing: '0' }],
      'sm':       ['clamp(0.8rem,  0.76rem + 0.20vw, 0.88rem)', { lineHeight: '1.5', letterSpacing: '0' }],
      'base':     ['clamp(0.95rem, 0.92rem + 0.15vw, 1rem)',     { lineHeight: '1.6', letterSpacing: '0' }],
      'lg':       ['clamp(1.05rem, 1.00rem + 0.30vw, 1.18rem)',  { lineHeight: '1.55', letterSpacing: '-0.005em' }],
      'xl':       ['clamp(1.18rem, 1.10rem + 0.40vw, 1.35rem)',  { lineHeight: '1.45', letterSpacing: '-0.01em' }],
      '2xl':      ['clamp(1.45rem, 1.30rem + 0.70vw, 1.75rem)',  { lineHeight: '1.3',  letterSpacing: '-0.015em' }],
      '3xl':      ['clamp(1.80rem, 1.60rem + 1.00vw, 2.30rem)',  { lineHeight: '1.2',  letterSpacing: '-0.02em' }],
      '4xl':      ['clamp(2.25rem, 1.90rem + 1.60vw, 3.00rem)',  { lineHeight: '1.1',  letterSpacing: '-0.025em' }],
      '5xl':      ['clamp(2.50rem, 2.10rem + 1.80vw, 3.50rem)',  { lineHeight: '1.05', letterSpacing: '-0.03em' }],
      'display':  ['clamp(2.60rem, 2.20rem + 2.00vw, 4.00rem)',  { lineHeight: '1.05', letterSpacing: '-0.03em' }]
    },

    /* ===== Colours bound to CSS vars (auto dark-mode) ===== */
    extend: {
      colors: {
        /* Brand */
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          soft:    'rgb(var(--brand-soft) / <alpha-value>)',
          strong:  'rgb(var(--brand-strong) / <alpha-value>)',
          50:  '#eef4ff', 100: '#dbe6ff', 200: '#b9cdff',
          300: '#8baaff', 400: '#5683ff', 500: '#003087',
          600: '#002a78', 700: '#002468', 800: '#001f5e', 900: '#001434'
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft:    'rgb(var(--accent-soft) / <alpha-value>)',
          strong:  'rgb(var(--accent-strong) / <alpha-value>)'
        },

        /* Semantic */
        bg:           'rgb(var(--bg) / <alpha-value>)',
        surface:      'rgb(var(--surface) / <alpha-value>)',
        'surface-2':  'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3':  'rgb(var(--surface-3) / <alpha-value>)',
        border:       'rgb(var(--border) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',

        /* Ink / text */
        ink:         'rgb(var(--ink) / <alpha-value>)',
        'ink-soft':  'rgb(var(--ink-soft) / <alpha-value>)',
        'ink-muted': 'rgb(var(--ink-muted) / <alpha-value>)',

        /* Status */
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger:  'rgb(var(--danger) / <alpha-value>)'
      },

      /* Layered shadow system — proper depth, not just blur */
      boxShadow: {
        'xs':      '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        'sm':      '0 1px 2px 0 rgb(15 23 42 / 0.05), 0 1px 1px -1px rgb(15 23 42 / 0.04)',
        'md':      '0 4px 8px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)',
        'lg':      '0 12px 24px -8px rgb(15 23 42 / 0.10), 0 4px 8px -4px rgb(15 23 42 / 0.06)',
        'xl':      '0 24px 48px -12px rgb(15 23 42 / 0.14), 0 8px 16px -8px rgb(15 23 42 / 0.08)',
        '2xl':     '0 40px 80px -20px rgb(15 23 42 / 0.20)',
        'inner':   'inset 0 1px 0 0 rgb(255 255 255 / 0.7)',
        'inner-dark': 'inset 0 1px 0 0 rgb(255 255 255 / 0.04)',
        'glow':    '0 0 0 4px rgb(var(--brand) / 0.12)',
        'ring':    '0 0 0 3px rgb(var(--brand) / 0.20), 0 0 0 1px rgb(var(--brand) / 0.6)'
      },

      /* Refined radius scale */
      borderRadius: {
        'none': '0',
        'xs':   '4px',
        'sm':   '6px',
        DEFAULT:'10px',
        'md':   '12px',
        'lg':   '14px',
        'xl':   '18px',
        '2xl':  '22px',
        '3xl':  '28px',
        'full': '9999px'
      },

      /* Motion tokens */
      transitionTimingFunction: {
        'out-quart':  'cubic-bezier(0.25, 1, 0.5, 1)',
        'out-expo':   'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out':     'cubic-bezier(0.65, 0, 0.35, 1)',
        'spring':     'cubic-bezier(0.34, 1.56, 0.64, 1)'
      },
      transitionDuration: {
        'fast': '120ms',
        'base': '180ms',
        'slow': '280ms'
      },

      keyframes: {
        'fade-in':       { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-up':       { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'scale-in':      { '0%': { opacity: '0', transform: 'scale(.96)' },     '100%': { opacity: '1', transform: 'scale(1)' } },
        'shimmer':       { '100%': { transform: 'translateX(100%)' } }
      },
      animation: {
        'fade-in':       'fade-in 200ms ease-out',
        'fade-up':       'fade-up 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':      'scale-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer':       'shimmer 1.6s linear infinite'
      },

      /* Tighter spacing for big sections */
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem'
      },

      /* Smooth backdrop blur tiers */
      backdropBlur: {
        'xs': '2px',
        'sm': '6px',
        DEFAULT: '10px',
        'md': '14px',
        'lg': '22px',
        'xl': '30px'
      }
    }
  },
  plugins: []
};
