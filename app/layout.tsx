import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WhatsApp Chat Analyzer",
    template: "%s | WhatsApp Chat Analyzer",
  },
  description:
    "Upload your WhatsApp chat export and get detailed analytics — message trends, activity heatmaps, top senders, and AI-powered insights.",
  keywords: [
    "WhatsApp",
    "chat analyzer",
    "WhatsApp analytics",
    "chat statistics",
    "group chat insights",
  ],
  openGraph: {
    title: "WhatsApp Chat Analyzer",
    description:
      "Turn your WhatsApp chats into insights. Free analytics and premium AI-powered analysis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
