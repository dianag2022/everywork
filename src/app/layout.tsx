import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"

import "./globals.css";

import Header from "@/components/header/header";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.goeverywork.com'),
  title: "Goeverywork",
  description: "Tu plataforma de confianza para encontrar y ofrecer servicios profesionales. Conecta con negocios locales, independientes y emprendedores!",
  icons: {
    icon: [
      { url: '/favicon.ico' },
    ]
  },
  verification: {
    google: 'KjMqhq4DP0jEXSXV6GdBm1pife9tY9-SFZq4ms3QcCg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header 
        
        />
        {children}

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QEZ651RHP2"
          strategy="afterInteractive"
        />
        <Script id="ga">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QEZ651RHP2');
          `}
        </Script>

      </body>
    </html>
  );
}
