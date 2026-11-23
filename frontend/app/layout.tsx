import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { PageTransition } from "@/components/transition/PageTransition";
import "./globals.css";
import "@/styles/figma-styles.css";
import "@/styles/design-system.css";
import "@/styles/app.css";
import "@/components/transition/page-transition.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#070b09",
};

export const metadata: Metadata = {
  title: "Divido – Personal Budgeting",
  description: "Personal budgeting with Divido.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Divido",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon-192.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      data-theme="dark"
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement;r.classList.add('dark');r.dataset.theme='dark';r.style.colorScheme='dark';localStorage.setItem('divido-theme','dark');}catch(e){}try{window.addEventListener('wheel',function(e){if(e.ctrlKey){e.preventDefault();}},{passive:false});window.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&(e.key==='+'||e.key==='-'||e.key==='='||e.key==='0')){e.preventDefault();}});document.addEventListener('gesturestart',function(e){e.preventDefault();});document.addEventListener('gesturechange',function(e){e.preventDefault();});document.addEventListener('gestureend',function(e){e.preventDefault();});}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#070b09] text-zinc-100">
        <AuthProvider>
          {children}
          <PageTransition />
        </AuthProvider>
      </body>
    </html>
  );
}
