import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AURA — AI Creative Platform",
  description:
    "AI-powered creative platform. Generate stunning images and videos with curated style workflows.",
  openGraph: {
    title: "AURA — AI Creative Platform",
    description:
      "Generate stunning AI images and videos with curated style workflows.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-[#0a0a0a] text-[#f0f0f0]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
