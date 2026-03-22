import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CCL Brand Colors
        pink: {
          50:  '#FEF0F5',
          100: '#FDE0EC',
          200: '#FAC8DC',
          300: '#F49AB8',
          400: '#F04E98',
          500: '#E8196A',
          600: '#C4106A',
          700: '#9D0D56',
          800: '#7A0A43',
          900: '#5C0833',
        },
        teal: {
          50:  '#EAF9F9',
          100: '#C8F0F0',
          200: '#A8E8E9',
          300: '#5DCECF',
          400: '#2DC5C7',
          500: '#1A9EA0',
          600: '#167F81',
          700: '#0F6061',
          800: '#0A4445',
          900: '#072E2F',
        },
        gold: {
          50:  '#FFF8EC',
          100: '#FEF0D0',
          200: '#FDE8B8',
          300: '#FAD070',
          400: '#F7B830',
          500: '#F5A623',
          600: '#D4871C',
          700: '#A86314',
          800: '#7D4510',
          900: '#55300A',
        },
        // Semantic
        healing: {
          bg: '#FDFBFB',
          surface: '#FFFFFF',
          muted: '#F8F4F6',
        }
      },
      fontFamily: {
        // No cursive fonts — display uses Nunito 800 (extrabold)
        display: ['Nunito', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',     { lineHeight: '1.5rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl':  ['3rem',     { lineHeight: '1' }],
        '6xl':  ['3.75rem',  { lineHeight: '1' }],
        'hero': ['4.5rem',   { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'pink':   '0 4px 24px rgba(232,25,106,0.15)',
        'teal':   '0 4px 24px rgba(26,158,160,0.15)',
        'gold':   '0 4px 24px rgba(245,166,35,0.15)',
        'card':   '0 2px 20px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.10)',
        'modal':  '0 20px 60px rgba(0,0,0,0.20)',
        'inner':  'inset 0 2px 8px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease forwards',
        'slide-up':  'slideUp 0.4s ease forwards',
        'pulse-slow':'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':     'float 4s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'butterfly': 'butterfly 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        butterfly: { '0%,100%': { transform: 'rotate(-8deg) scale(1)' }, '50%': { transform: 'rotate(8deg) scale(1.08)' } },
      },
      backgroundImage: {
        'ccl-hero':      'linear-gradient(150deg, #0D5F60 0%, #1A9EA0 30%, #1AABB0 55%, #3B7DBD 80%, #1A547A 100%)',
        'ccl-card':      'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(253,249,252,0.9))',
        'pink-gradient': 'linear-gradient(135deg, #E8196A, #C4106A)',
        'teal-gradient': 'linear-gradient(135deg, #1A9EA0, #0D6E70)',
        'gold-gradient': 'linear-gradient(135deg, #F5A623, #D4871C)',
        'warm-glow':     'radial-gradient(ellipse at 20% 50%, rgba(232,25,106,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(26,158,160,0.06) 0%, transparent 60%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}

export default config
