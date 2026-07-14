import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#FFFFFF",
        surface: "#F3F4F6",
        "surface-raised": "#E5E7EB",
        foreground: "#111827",
        muted: "#6B7280",
        border: "#E2E5EC",
        accent: "#5B6EF5",
        "accent-light": "#EEF0FF",
        success: "#10B981",
        "success-light": "#ECFDF5",
        warning: "#D97706",
        "warning-light": "#FFFBEB",
        error: "#EF4444",
        "error-light": "#FEF2F2",
        purple: "#7C3AED",
        pink: "#DB2777",
      },
      maxWidth: {
        content: "1200px",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-up-toast": {
          from: { transform: "translateX(-50%) translateY(20px)", opacity: "0" },
          to: { transform: "translateX(-50%) translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "slide-in-left": "slideInLeft 250ms ease-out",
        "slide-up-toast": "slideUpToast 300ms ease-out",
        "fade-in": "fadeIn 200ms ease-out",
      },
    },
  },
  plugins: [],
}
export default config
