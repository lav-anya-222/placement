import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prep AI - Placement Mentor",
  description: "Gamified AI Placement Mentor for Students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground`}>
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
