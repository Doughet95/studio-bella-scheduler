import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        rose: {
          gold: '#C9956C',
          light: '#E8B4A0',
          dark: '#A0705C',
        },
        brand: {
          50: 'hsl(340, 60%, 97%)',
          100: 'hsl(340, 55%, 93%)',
          200: 'hsl(340, 50%, 85%)',
          300: 'hsl(340, 45%, 72%)',
          400: 'hsl(340, 42%, 60%)',
          500: 'hsl(340, 40%, 48%)',
          600: 'hsl(340, 40%, 38%)',
          700: 'hsl(340, 38%, 28%)',
          800: 'hsl(340, 35%, 18%)',
          900: 'hsl(340, 30%, 12%)',
        },
        gold: {
          50: 'hsl(42, 80%, 97%)',
          100: 'hsl(42, 75%, 90%)',
          200: 'hsl(42, 70%, 80%)',
          300: 'hsl(42, 65%, 68%)',
          400: 'hsl(42, 60%, 56%)',
          500: 'hsl(42, 55%, 45%)',
          600: 'hsl(42, 52%, 36%)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200px 0' },
          to: { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px 2px hsl(340 40% 48% / 0.3)' },
          '50%': { boxShadow: '0 0 20px 6px hsl(340 40% 48% / 0.5)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        shimmer: 'shimmer 2s infinite',
        float: 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, hsl(340, 40%, 48%) 0%, hsl(42, 55%, 45%) 100%)',
        'gradient-dark': 'linear-gradient(135deg, hsl(340, 30%, 10%) 0%, hsl(280, 25%, 8%) 100%)',
        'gradient-card': 'linear-gradient(145deg, hsl(340, 15%, 15%) 0%, hsl(280, 12%, 12%) 100%)',
        'gradient-glow': 'radial-gradient(ellipse at center, hsl(340 40% 48% / 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        brand: '0 4px 24px hsl(340 40% 48% / 0.25)',
        gold: '0 4px 24px hsl(42 55% 45% / 0.25)',
        'card-hover': '0 8px 32px hsl(340 40% 48% / 0.15)',
        glass: 'inset 0 1px 0 hsl(0 0% 100% / 0.05)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
