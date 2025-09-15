import type { Config } from 'tailwindcss';
const { fontFamily } = require('tailwindcss/defaultTheme');
import plugin from 'tailwindcss/plugin';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // System colors pilotés par CSS vars (compat shadcn/ui)
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
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        heading: ['var(--font-heading)', ...fontFamily.sans],
        mono: ['var(--font-mono)', ...fontFamily.mono],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },

      screens: {
        xs: '475px',
        '3xl': '1680px',
        '4xl': '2200px',
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-up': 'fade-up 0.5s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        gradient: 'gradient 8s ease-in-out infinite',
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
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
      },

      boxShadow: {
        glow: '0 0 20px hsl(var(--primary) / 0.3)',
        'glow-ring': '0 0 20px hsl(var(--ring) / 0.3)',
        'inner-light': 'inset 0 1px 0 0 hsl(var(--foreground) / 0.05)',
      },

      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),

      // Plugin personnalisé pour les utilitaires du design system
      plugin(function ({ addUtilities, addComponents, theme }) {
        // Utilitaires pour les focus rings menthe
        addUtilities({
          '.focus-ring-mint': {
            '&:focus-visible': {
              outline: '2px solid transparent',
              'outline-offset': '2px',
              'box-shadow': '0 0 0 2px hsl(var(--ring))',
            },
          },
          '.focus-ring-violet': {
            '&:focus-visible': {
              outline: '2px solid transparent',
              'outline-offset': '2px',
              'box-shadow': '0 0 0 2px hsl(var(--primary))',
            },
          },
        });

      // Composants boutons selon les spécifications
      addComponents({
        '.btn-primary': {
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          border: 'none',
          'border-radius': theme('borderRadius.md'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          'font-weight': theme('fontWeight.medium'),
          transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            'box-shadow': theme('boxShadow.glow'),
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:focus-visible': {
            outline: '2px solid transparent',
            'outline-offset': '2px',
            'box-shadow': `0 0 0 2px ${theme('colors.ring')}`,
          },
        },

        '.btn-secondary': {
          background: 'hsl(var(--secondary))',
          color: 'hsl(var(--secondary-foreground))',
          border: `1px solid hsl(var(--border))`,
          'border-radius': theme('borderRadius.md'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          'font-weight': theme('fontWeight.medium'),
          transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:focus-visible': {
            outline: '2px solid transparent',
            'outline-offset': '2px',
            'box-shadow': `0 0 0 2px ${theme('colors.ring')}`,
          },
        },

        '.btn-success': {
          background: 'hsl(var(--ring))',
          color: 'hsl(var(--foreground))',
          border: 'none',
          'border-radius': theme('borderRadius.md'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          'font-weight': theme('fontWeight.medium'),
          transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            'box-shadow': theme('boxShadow.glow-ring'),
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      });

      // Classes pour le thème clair/sombre
      addComponents({
        '.theme-light': {
          '--background': '240 33% 98%', // #F7F7FB
          '--foreground': '230 39% 10%', // #0F1222
          '--muted': '233 46% 93%', // #E4E6F5
          '--muted-foreground': '231 13% 41%', // #5A5E75
          '--border': '233 46% 93%', // #E4E6F5
          '--input': '233 46% 93%', // #E4E6F5
          '--primary': '254 85% 55%', // #5B2DEE
          '--primary-foreground': '0 0% 100%', // #FFFFFF
          '--secondary': '253 100% 96%', // #F0ECFF
          '--secondary-foreground': '251 70% 41%', // #3A1FB3
          '--accent': '253 100% 96%', // #F0ECFF
          '--accent-foreground': '251 70% 41%', // #3A1FB3
          '--ring': '159 79% 54%', // #2EE6A6
          '--destructive': '0 84% 60%', // #EF4444
          '--destructive-foreground': '0 0% 100%', // #FFFFFF
          '--popover': '0 0% 100%', // #FFFFFF
          '--popover-foreground': '230 39% 10%', // #0F1222
          '--card': '0 0% 100%', // #FFFFFF
          '--card-foreground': '230 39% 10%', // #0F1222
          '--radius': '0.5rem',
        },

        '.theme-dark': {
          '--background': '254 51% 8%', // #0F0A1F
          '--foreground': '244 53% 94%', // #E9E8F8
          '--muted': '247 24% 20%', // #2A2740
          '--muted-foreground': '253 11% 68%', // #A7A3B5
          '--border': '247 24% 20%', // #2A2740
          '--input': '247 24% 20%', // #2A2740
          '--primary': '254 85% 55%', // #5B2DEE
          '--primary-foreground': '0 0% 100%', // #FFFFFF
          '--secondary': '250 42% 12%', // #15112A
          '--secondary-foreground': '244 53% 94%', // #E9E8F8
          '--accent': '250 42% 12%', // #15112A
          '--accent-foreground': '244 53% 94%', // #E9E8F8
          '--ring': '159 79% 54%', // #2EE6A6
          '--destructive': '0 84% 60%', // #EF4444
          '--destructive-foreground': '0 0% 100%', // #FFFFFF
          '--popover': '250 42% 12%', // #15112A
          '--popover-foreground': '244 53% 94%', // #E9E8F8
          '--card': '250 42% 12%', // #15112A
          '--card-foreground': '244 53% 94%', // #E9E8F8
          '--radius': '0.5rem',
        },
      });
    }),
  ],
};

export default config;
