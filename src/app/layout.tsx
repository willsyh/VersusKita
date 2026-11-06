import type { Metadata, Viewport } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";

const display = Fredoka({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Versus Kita — Mini game untuk berdua",
  description: "Siapa yang paling jago di antara kita? Kumpulan mini game 2 pemain di satu HP.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000005",
};

// Apply saved dark mode + player colors before paint to avoid a flash.
const bootScript = `try{var s=JSON.parse(localStorage.getItem('versus-kita')||'{}').state||{};var d=s.settings?s.settings.dark:matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');if(s.players){document.documentElement.style.setProperty('--p1',s.players[1].color);document.documentElement.style.setProperty('--p2',s.players[2].color);}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
