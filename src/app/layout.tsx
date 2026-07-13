import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Sora } from "next/font/google";
import "./globals.css";
import { ThemeInit } from "./ThemeInit";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Rotaract UoM — IT Division Task Management",
  description: "IT Division Task Management System — Rotaract Club of University of Moratuwa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${mono.variable}`}>
      <body>
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
