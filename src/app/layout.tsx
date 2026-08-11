import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { Providers } from "@/components/providers";
import { appConfig } from "@/config/app";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const themeScript = `try {
  if (localStorage.getItem("autocare-theme") === "dark") {
    document.documentElement.classList.add("dark");
  }
} catch {}`;

export const metadata: Metadata = {
  title: {
    default: appConfig.name,
    template: `%s | ${appConfig.name}`,
  },
  description: "Single-location car wash and auto repair operations management.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
