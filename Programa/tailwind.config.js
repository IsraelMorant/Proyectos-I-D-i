/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:           '#EEF3F8',
          bgDark:       '#DDE8F2',
          card:         '#FFFFFF',
          border:       '#C8D9E8',
          primary:      '#0B2D4E',
          primaryLight: '#1A4A7A',
          secondary:    '#1565C0',
          accent:       '#2196F3',
          token:        '#D97706',
          tokenLight:   '#FEF3C7',
          success:      '#059669',
          danger:       '#DC2626',
          text:         '#0F172A',
          muted:        '#607080',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card:  '0 2px 12px 0 rgba(11,45,78,0.08)',
        cardHover: '0 8px 28px 0 rgba(11,45,78,0.14)',
        nav:   '0 1px 8px 0 rgba(11,45,78,0.10)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0B2D4E 0%, #1565C0 100%)',
        'token-gradient': 'linear-gradient(135deg, #0B2D4E 0%, #1A4A7A 100%)',
      },
    },
  },
  plugins: [],
}
