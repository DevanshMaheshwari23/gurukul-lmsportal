/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--primary-light) / 0.9)',
          100: 'rgb(var(--primary-light) / 0.8)',
          200: 'rgb(var(--primary-light) / 0.6)',
          300: 'rgb(var(--primary-light) / 0.4)',
          400: 'rgb(var(--primary) / 0.8)',
          500: 'rgb(var(--primary))',
          600: 'rgb(var(--primary) / 0.9)',
          700: 'rgb(var(--primary-dark) / 0.9)',
          800: 'rgb(var(--primary-dark) / 0.8)',
          900: 'rgb(var(--primary-dark) / 0.6)',
          950: 'rgb(var(--primary-dark) / 0.5)',
        },
        accent: {
          50: 'rgb(var(--accent-light) / 0.9)',
          100: 'rgb(var(--accent-light) / 0.8)',
          200: 'rgb(var(--accent-light) / 0.6)',
          300: 'rgb(var(--accent-light) / 0.4)',
          400: 'rgb(var(--accent) / 0.8)',
          500: 'rgb(var(--accent))',
          600: 'rgb(var(--accent) / 0.9)',
          700: 'rgb(var(--accent-dark) / 0.9)',
          800: 'rgb(var(--accent-dark) / 0.8)',
          900: 'rgb(var(--accent-dark) / 0.6)',
          950: 'rgb(var(--accent-dark) / 0.5)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'neumorphic': '6px 6px 12px 0 rgba(0,0,0,0.1), -6px -6px 12px 0 rgba(255,255,255,0.8)',
        'neumorphic-dark': '6px 6px 12px 0 rgba(0,0,0,0.3), -6px -6px 12px 0 rgba(31,41,55,0.8)',
        'neumorphic-inset': 'inset 4px 4px 8px 0 rgba(0,0,0,0.1), inset -4px -4px 8px 0 rgba(255,255,255,0.8)',
        'neumorphic-inset-dark': 'inset 4px 4px 8px 0 rgba(0,0,0,0.3), inset -4px -4px 8px 0 rgba(31,41,55,0.8)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.900'),
            a: {
              color: theme('colors.primary.500'),
              '&:hover': {
                color: theme('colors.primary.700'),
              },
            },
            'h1, h2, h3, h4': {
              color: theme('colors.gray.900'),
              'scroll-margin-top': '6rem',
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.gray.300'),
            a: {
              color: theme('colors.primary.400'),
              '&:hover': {
                color: theme('colors.primary.300'),
              },
            },
            'h1, h2, h3, h4': {
              color: theme('colors.gray.100'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 