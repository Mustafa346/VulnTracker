// postcss.config.js
// PostCSS configuration for Tailwind CSS processing
// This file tells PostCSS which plugins to run on our CSS

module.exports = {
  plugins: {
    // Tailwind CSS — processes all @tailwind directives in globals.css
    tailwindcss: {},

    // Autoprefixer — automatically adds vendor prefixes for browser compatibility
    // e.g. -webkit-, -moz-, -ms- prefixes where needed
    autoprefixer: {},
  },
};
