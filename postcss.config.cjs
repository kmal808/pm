const path = require("path");

module.exports = {
  plugins: {
    // Pin config so dev/build always resolve the same theme (avoids cwd surprises).
    tailwindcss: { config: path.join(__dirname, "tailwind.config.js") },
    autoprefixer: {},
  },
};
