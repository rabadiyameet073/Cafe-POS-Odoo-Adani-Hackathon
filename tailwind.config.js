/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./*.html",
        "./frontend/js/**/*.js",
    ],
    theme: {
        extend: {
            colors: {
                'accent-pink': '#FFDEE9',
                'accent-cyan': '#B5FFFC',
            },
            backgroundImage: {
                'gradient-accent': 'linear-gradient(to right, #FFDEE9, #B5FFFC)',
            },
            boxShadow: {
                'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
            },
            backdropBlur: {
                'xs': '2px',
            },
        },
    },
    plugins: [],
}
