/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--paper)',
          raised: 'var(--paper-raised)',
          sunken: 'var(--paper-sunken)',
        },
        line: { DEFAULT: 'var(--line)', strong: 'var(--line-strong)' },
        spruce: { DEFAULT: 'var(--spruce)', soft: 'var(--spruce-soft)' },
        slate: { DEFAULT: 'var(--slate)', soft: 'var(--slate-soft)' },
        stable: { DEFAULT: 'var(--stable)', wash: 'var(--stable-wash)', ink: 'var(--stable-ink)' },
        watch: { DEFAULT: 'var(--watch)', wash: 'var(--watch-wash)', ink: 'var(--watch-ink)' },
        alert: { DEFAULT: 'var(--alert)', wash: 'var(--alert-wash)', ink: 'var(--alert-ink)' },
        glacier: { DEFAULT: 'var(--glacier)', wash: 'var(--glacier-wash)', ink: 'var(--glacier-ink)' },
      },
      fontFamily: {
        display: 'var(--font-display)',
        ui: 'var(--font-ui)',
      },
      borderColor: { DEFAULT: 'var(--line)' },
      borderRadius: {
        sm: 'var(--r-sm)',
        DEFAULT: 'var(--r-md)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        raised: 'var(--shadow-raised)',
        pop: 'var(--shadow-pop)',
      },
      maxWidth: {
        shell: '1400px',
      },
      keyframes: {
        settle: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadein: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        settle: 'settle 0.42s cubic-bezier(0.16, 1, 0.3, 1) both',
        fadein: 'fadein 0.2s ease-out both',
      },
    },
  },
  plugins: [],
}
