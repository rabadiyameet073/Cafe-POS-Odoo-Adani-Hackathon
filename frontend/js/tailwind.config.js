/*
 * Odoo Cafe - Tailwind Configuration
 * Custom colors, fonts, animations
 */

tailwind.config = {
    theme: {
        extend: {
            colors: {
                coffeeBrown: '#6F4E37',
                cream: '#F5F0E6',
                warmOrange: '#D97706',
                burgerOrange: '#EA580C',
                burgerYellow: '#FBBF24',
                pizzaRed: '#DC2626',
                pizzaDark: '#7F1D1D',
                dessertPurple: '#7C3AED',
                dessertPink: '#EC4899'
            },
            fontFamily: {
                sans: ['Playfair Display', 'serif'],
                serif: ['Playfair Display', 'serif']
            },
            animation: {
                'marquee': 'marquee 25s linear infinite',
                'marquee-reverse': 'marquee-reverse 25s linear infinite',
                'float': 'float 3s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'spin-slow': 'spin 8s linear infinite',
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-50%)' }
                },
                'marquee-reverse': {
                    '0%': { transform: 'translateX(-50%)' },
                    '100%': { transform: 'translateX(0%)' }
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-15px)' }
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '50%': { opacity: '0.8', transform: 'scale(1.05)' }
                }
            }
        }
    }
}