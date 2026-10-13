import type { Metadata } from "next";
import { connection } from "next/server";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Aero Stays | Property Operations",
    template: "%s | Aero Stays",
  },
  description: "Thoughtful property operations, bookings and stays — managed in one place.",
  applicationName: "Aero Stays",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
    shortcut: "/icon.svg",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Per-request CSP nonces must never be embedded into a cached static page.
  await connection();
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
