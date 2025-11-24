/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    {
      pattern:
        /^(bg|text|border|ring|stroke|fill)-(chart-(1|2|3|4|5)|blue|emerald|violet|amber|cyan|fuchsia|lime|pink|rose|sky|teal|indigo)(-(100|200|300|400|500|600|700|800|900))?$/,
      variants: ['hover', 'ui-selected'],
    },
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

        'chart-1': {
          DEFAULT: 'hsl(var(--chart-1))',
          50: 'hsl(var(--chart-1))',
          100: 'hsl(var(--chart-1))',
          200: 'hsl(var(--chart-1))',
          300: 'hsl(var(--chart-1))',
          400: 'hsl(var(--chart-1))',
          500: 'hsl(var(--chart-1))',
          600: 'hsl(var(--chart-1))',
          700: 'hsl(var(--chart-1))',
          800: 'hsl(var(--chart-1))',
          900: 'hsl(var(--chart-1))',
        },
        'chart-2': {
          DEFAULT: 'hsl(var(--chart-2))',
          50: 'hsl(var(--chart-2))',
          100: 'hsl(var(--chart-2))',
          200: 'hsl(var(--chart-2))',
          300: 'hsl(var(--chart-2))',
          400: 'hsl(var(--chart-2))',
          500: 'hsl(var(--chart-2))',
          600: 'hsl(var(--chart-2))',
          700: 'hsl(var(--chart-2))',
          800: 'hsl(var(--chart-2))',
          900: 'hsl(var(--chart-2))',
        },
        'chart-3': {
          DEFAULT: 'hsl(var(--chart-3))',
          50: 'hsl(var(--chart-3))',
          100: 'hsl(var(--chart-3))',
          200: 'hsl(var(--chart-3))',
          300: 'hsl(var(--chart-3))',
          400: 'hsl(var(--chart-3))',
          500: 'hsl(var(--chart-3))',
          600: 'hsl(var(--chart-3))',
          700: 'hsl(var(--chart-3))',
          800: 'hsl(var(--chart-3))',
          900: 'hsl(var(--chart-3))',
        },
        'chart-4': {
          DEFAULT: 'hsl(var(--chart-4))',
          50: 'hsl(var(--chart-4))',
          100: 'hsl(var(--chart-4))',
          200: 'hsl(var(--chart-4))',
          300: 'hsl(var(--chart-4))',
          400: 'hsl(var(--chart-4))',
          500: 'hsl(var(--chart-4))',
          600: 'hsl(var(--chart-4))',
          700: 'hsl(var(--chart-4))',
          800: 'hsl(var(--chart-4))',
          900: 'hsl(var(--chart-4))',
        },
        'chart-5': {
          DEFAULT: 'hsl(var(--chart-5))',
          50: 'hsl(var(--chart-5))',
          100: 'hsl(var(--chart-5))',
          200: 'hsl(var(--chart-5))',
          300: 'hsl(var(--chart-5))',
          400: 'hsl(var(--chart-5))',
          500: 'hsl(var(--chart-5))',
          600: 'hsl(var(--chart-5))',
          700: 'hsl(var(--chart-5))',
          800: 'hsl(var(--chart-5))',
          900: 'hsl(var(--chart-5))',
        },

        tremor: {
          brand: {
            faint: 'hsl(var(--primary) / 0.1)',
            muted: 'hsl(var(--primary) / 0.2)',
            subtle: 'hsl(var(--primary) / 0.4)',
            DEFAULT: 'hsl(var(--primary))',
            emphasis: 'hsl(var(--primary) / 0.8)',
            inverted: 'hsl(var(--primary-foreground))',
          },
          background: {
            muted: 'hsl(var(--muted))',
            subtle: 'hsl(var(--accent))',
            DEFAULT: 'hsl(var(--background))',
            emphasis: 'hsl(var(--secondary))',
          },
          border: {
            DEFAULT: 'hsl(var(--border))',
          },
          ring: {
            DEFAULT: 'hsl(var(--ring))',
          },
          content: {
            subtle: 'hsl(var(--muted-foreground))',
            DEFAULT: 'hsl(var(--foreground))',
            emphasis: 'hsl(var(--foreground))',
            strong: 'hsl(var(--foreground))',
            inverted: 'hsl(var(--background))',
          },
        },
        'dark-tremor': {
          brand: {
            faint: 'hsl(var(--primary) / 0.1)',
            muted: 'hsl(var(--primary) / 0.2)',
            subtle: 'hsl(var(--primary) / 0.4)',
            DEFAULT: 'hsl(var(--primary))',
            emphasis: 'hsl(var(--primary) / 0.8)',
            inverted: 'hsl(var(--primary-foreground))',
          },
          background: {
            muted: 'hsl(var(--muted))',
            subtle: 'hsl(var(--accent))',
            DEFAULT: 'hsl(var(--background))',
            emphasis: 'hsl(var(--secondary))',
          },
          border: {
            DEFAULT: 'hsl(var(--border))',
          },
          ring: {
            DEFAULT: 'hsl(var(--ring))',
          },
          content: {
            subtle: 'hsl(var(--muted-foreground))',
            DEFAULT: 'hsl(var(--foreground))',
            emphasis: 'hsl(var(--foreground))',
            strong: 'hsl(var(--foreground))',
            inverted: 'hsl(var(--background))',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'tremor-default': 'var(--radius)',
        'tremor-small': 'calc(var(--radius) - 2px)',
        'tremor-full': '9999px',
      },
      fontSize: {
        'tremor-label': ['0.75rem', { lineHeight: '1rem' }],
        'tremor-default': ['0.875rem', { lineHeight: '1.25rem' }],
        'tremor-title': ['1.125rem', { lineHeight: '1.75rem' }],
        'tremor-metric': ['1.875rem', { lineHeight: '2.25rem' }],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
