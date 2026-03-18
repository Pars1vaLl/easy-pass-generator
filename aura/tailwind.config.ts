import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        "bg-primary": "#0a0a0a",
        "bg-elevated": "#141414",
        "bg-hover": "#1c1c1c",
        "bg-border": "#2a2a2a",
        "text-primary": "#f0f0f0",
        "text-secondary": "#a0a0a0",
        "text-muted": "#606060",
        accent: {
          DEFAULT: "#7c5af5",
          hover: "#6b47e8",
        },
        status: {
          processing: "#f59e0b",
          success: "#10b981",
          error: "#ef4444",
        },
        border: "var(--bg-border)",
        input: "var(--bg-elevated)",
        ring: "var(--accent-primary)",
        primary: {
          DEFAULT: "#7c5af5",
          foreground: "#f0f0f0",
        },
        secondary: {
          DEFAULT: "#141414",
          foreground: "#a0a0a0",
        },
        muted: {
          DEFAULT: "#1c1c1c",
          foreground: "#606060",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#f0f0f0",
        },
        card: {
          DEFAULT: "#141414",
          foreground: "#f0f0f0",
        },
        popover: {
          DEFAULT: "#141414",
          foreground: "#f0f0f0",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        display: ["ClashDisplay", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-hero": "linear-gradient(135deg, #7c5af5 0%, #c084fc 50%, #f472b6 100%)",
        "gradient-card": "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)",
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124, 90, 245, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(124, 90, 245, 0.6)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
