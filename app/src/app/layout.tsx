import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { IntroProvider } from "@/components/Intro";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CanMyAITrade",
    template: "%s · CanMyAITrade",
  },
  description:
    "Live performance of an AI-managed stock portfolio, compared against the S&P 500 and Nasdaq-100.",
  openGraph: {
    type: "website",
    siteName: "CanMyAITrade",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
        <IntroProvider>
          <Nav />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">{children}</main>
          <footer className="border-t border-zinc-200 dark:border-zinc-800 py-4 text-center text-xs text-zinc-500">
            <span id="footer-timestamp-slot" /> For informational use only, not
            investment advice.
          </footer>
        </IntroProvider>
      </body>
    </html>
  );
}
