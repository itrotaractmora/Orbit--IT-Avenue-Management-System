import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeInit } from "./ThemeInit";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
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
    <html lang="en" className={inter.variable}>
      <body>
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
