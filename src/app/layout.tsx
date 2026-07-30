import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { APP_NAME, APP_TAGLINE, COMPANY_NAME } from "@/lib/constants";
import "./globals.css";

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} | ${COMPANY_NAME}`,
    template: `%s | ${APP_NAME}`,
  },
  description: `${APP_TAGLINE} ${APP_NAME} is a product of ${COMPANY_NAME}.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${display.variable} ${mono.variable} min-h-screen antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
