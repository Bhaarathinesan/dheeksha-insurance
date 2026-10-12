/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          sky: "#5CC8E8",       // Primary Sky Blue
          strong: "#249FC2",    // Strong Blue
          light: "#F0FAFD",     // Light Sky Blue
          navy: "#102A43",      // Deep Navy
        },
        text: {
          secondary: "#526777", // Secondary Text
        },
        ui: {
          border: "#D9EEF4",    // Border
          success: "#28A97A",   // Success
          error: "#D9534F",     // Error
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(2.5rem, 5vw + 1rem, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h1': ['clamp(2rem, 4vw + 1rem, 3rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h2': ['clamp(1.75rem, 3vw + 1rem, 2.25rem)', { lineHeight: '1.3' }],
        'h3': ['clamp(1.25rem, 2vw + 1rem, 1.5rem)', { lineHeight: '1.4' }],
        'body': ['1rem', { lineHeight: '1.5' }],
        'small': ['0.875rem', { lineHeight: '1.4' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
