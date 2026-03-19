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
        "bg-primary":  "#09090f",
        "bg-elevated": "#111118",
        "bg-hover":    "#1a1a24",
        "bg-border":   "#1e1e2e",
        "text-primary":   "#f0f0f0",
        "text-secondary": "#9ca3af",
        "text-muted":     "#4b5563",
        accent: {
          DEFAULT: "#7c5af5",
          hover:   "#6b47e8",
          dim:     "#a78bfa",
          glow:    "rgba(124,90,245,0.3)",
        },
        teal: {
          400: "#22d3ee",
          DEFAULT: "#22d3ee",
        },
        status: {
          processing: "#f59e0b",
          success:    "#10b981",
          error:      "#ef4444",
        },
        border:   "var(--bg-border)",
        input:    "var(--bg-elevated)",
        ring:     "var(--accent-primary)",
        primary: {
          DEFAULT:    "#7c5af5",
          foreground: "#f0f0f0",
        },
        secondary: {
          DEFAULT:    "#111118",
          foreground: "#9ca3af",
        },
        muted: {
          DEFAULT:    "#1a1a24",
          foreground: "#4b5563",
        },
        destructive: {
          DEFAULT:    "#ef4444",
          foreground: "#f0f0f0",
        },
        card: {
          DEFAULT:    "#111118",
          foreground: "#f0f0f0",
        },
        popover: {
          DEFAULT:    "#111118",
          foreground: "#f0f0f0",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans:    ["Geist", "system-ui", "sans-serif"],
        display: ["ClashDisplay", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-hero":   "linear-gradient(135deg, #7c5af5 0%, #a78bfa 50%, #818cf8 100%)",
        "gradient-card":   "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 100%)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        "glow-sm": "0 0 12px rgba(124,90,245,0.25)",
        "glow-md": "0 0 24px rgba(124,90,245,0.35)",
        "glow-lg": "0 0 48px rgba(124,90,245,0.45)",
        "glow-teal": "0 0 20px rgba(34,211,238,0.25)",
        "card":    "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,90,245,0.15)",
      },
      animation: {
        "fade-in":    "fade-in 0.4s ease-out",
        "slide-up":   "slide-up 0.3s ease-out",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        "spin-slow":  "spin 3s linear infinite",
        "spin-reverse": "spin-reverse 2s linear infinite",
        shimmer:      "shimmer 1.8s ease-in-out infinite",
        float:        "float 4s ease-in-out infinite",
        "ring-pulse": "ring-pulse 1.8s ease-in-out infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 16px rgba(124,90,245,0.2)" },
          "50%":       { boxShadow: "0 0 40px rgba(124,90,245,0.55)" },
        },
        "spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to:   { transform: "rotate(0deg)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        "ring-pulse": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%":      { opacity: "0.8", transform: "scale(1.08)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
