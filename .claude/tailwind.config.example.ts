import type { Config } from 'tailwindcss'

/**
 * ElevenLabs Design System - Tailwind Configuration
 *
 * This is an example configuration file for the ui-builder agent.
 * Copy this to your Next.js project's tailwind.config.ts
 */

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sohne)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ElevenLabs Brand Colors
        'el-black': '#000000',
        'el-white': '#FFFFFF',
        'neutral': {
          50: '#F9F9F9',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E6E6E6',
          400: '#CCCCCC',
          500: '#A6A6A6',
          600: '#808080',
          700: '#595959',
          800: '#404040',
          900: '#2D2D2D',
          950: '#1A1A1A',
        },
        // Cyan
        'cyan': {
          50: '#E0FFFF',
          100: '#B3FFFF',
          200: '#80FFFF',
          300: '#4DFFFF',
          400: '#1AE6FF',
          500: '#00D9FF',
          600: '#00B8D4',
          700: '#009BBC',
          800: '#006B87',
          900: '#003D52',
        },
        // Magenta
        'magenta': {
          50: '#FFE0F0',
          100: '#FFB3D9',
          200: '#FF80C2',
          300: '#FF4DAB',
          400: '#FF1A94',
          500: '#FF006E',
          600: '#D90057',
          700: '#B20040',
          800: '#7A0029',
          900: '#520019',
        },
        // Yellow
        'yellow': {
          50: '#FFFDE0',
          100: '#FFFAB3',
          200: '#FFF680',
          300: '#FFF24D',
          400: '#FFED1A',
          500: '#FFD60A',
          600: '#E8C50A',
          700: '#D4B208',
          800: '#8B7205',
          900: '#5A4A03',
        },
        // Blue
        'blue': {
          50: '#E6F0FF',
          100: '#CCE0FF',
          200: '#99C2FF',
          300: '#66A3FF',
          400: '#3A86FF',
          500: '#2E68DB',
          600: '#2354B8',
          700: '#1F47B6',
          800: '#163399',
          900: '#0D1F7A',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'sound-wave': 'soundWave 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        soundWave: {
          '0%': { transform: 'scaleY(0.8)', opacity: '0.6' },
          '50%': { transform: 'scaleY(1)', opacity: '1' },
          '100%': { transform: 'scaleY(0.8)', opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}

export default config
