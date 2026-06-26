/** @type {import('tailwindcss').Config} */
export default {
 content: ['./index.html', './src/**/*.{js,jsx}'],
 theme: {
 extend: {
 colors: {
 brand: {
 50: '#eef2ff',
 100: '#e0e7ff',
 400: '#818cf8',
 500: '#6366f1',
 600: '#4f46e5',
 700: '#4338ca',
 800: '#3730a3',
 900: '#312e81',
 },
 },
 keyframes: {
 'fade-up': { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
 'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
 'slide-in-left': { '0%': { opacity: '0', transform: 'translateX(-32px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
 float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
 'spin-slow': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
 blob: { '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }, '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' } },
 },
 animation: {
 'fade-up': 'fade-up 0.6s ease-out forwards',
 'fade-in': 'fade-in 0.5s ease-out forwards',
 'slide-in-left': 'slide-in-left 0.6s ease-out forwards',
 float: 'float 3s ease-in-out infinite',
 'float-delayed': 'float 3s ease-in-out 1.5s infinite',
 'spin-slow': 'spin-slow 8s linear infinite',
 blob: 'blob 7s ease-in-out infinite',
 'blob-delayed': 'blob 7s ease-in-out 3.5s infinite',
 },
 },
 },
 plugins: [],
};
