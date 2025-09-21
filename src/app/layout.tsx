// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Random Color Generator",
    template: "%s | Random Color Generator",
  },
  description:
    "Generate random colors and copy HEX, RGB, and HSL in one click.",
  icons: [{ rel: "icon", url: "/logo.png" }],
  openGraph: {
    title: "Random Color Generator",
    description: "Instant colors with copy-ready HEX, RGB, and HSL.",
    url: "https://your-domain.example", // <- update if you deploy
    siteName: "Random Color Generator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Random Color Generator",
    description: "Instant colors with copy-ready HEX, RGB, and HSL.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
