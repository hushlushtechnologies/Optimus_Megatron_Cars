import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "@/src/lib/theme/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/src/lib/theme/constants";
import { ToastProvider } from "@/src/components/shared/toast-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Optimus Megatron Cars — Admin",
  description: "Admin dashboard for Optimus Megatron Cars, UAE premium & luxury automotive marketplace.",
};

const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (saved === 'light') {
      document.documentElement.classList.add('light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a
          href="#main-content"
          className="focus:bg-primary focus:shadow-soft-lg sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:text-[#0b1220]"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            {children}
            <ToastProvider />
          </MotionConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
