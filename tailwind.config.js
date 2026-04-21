/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:       '#F2F2F7',
        card:     '#FFFFFF',
        surface:  '#F9F9FB',
        primary:  '#30D158',
        accent:   '#0A84FF',
        gold:     '#FF9F0A',
        danger:   '#FF453A',
        muted:    '#8E8E93',
        subtle:   '#C7C7CC',
        label:    '#1C1C1E',
        secondary:'#636366',
      },
      fontFamily: {
        sans:    ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Helvetica Neue', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Helvetica Neue', 'sans-serif'],
        mono:    ['SF Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      borderRadius: {
        'ios':    '10px',
        'ios-lg': '16px',
        'ios-xl': '22px',
        '2xl':    '1rem',
        '3xl':    '1.5rem',
        '4xl':    '2rem',
      },
      boxShadow: {
        'ios-sm':      '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'ios':         '0 2px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)',
        'ios-lg':      '0 4px 20px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)',
        'ios-btn':     '0 2px 8px rgba(48,209,88,0.30)',
        'ios-blue':    '0 2px 8px rgba(10,132,255,0.25)',
      },
    },
  },
  plugins: [],
}
