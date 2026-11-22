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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0f0d" },
  ],
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
      { url: "/webp/Logo-flavicon - 250px.webp", type: "image/webp" },
      {
        url: "/webp/logo-icon-dark.webp",
        type: "image/webp",
        media: "(prefers-color-scheme: dark)",
      },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/webp/Logo-flavicon - 250px.webp",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/webp/Logo-flavicon - 250px.webp" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('divido-theme');var p=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var d=s==='dark'||(!s&&p);var r=document.documentElement;if(d){r.classList.add('dark');r.dataset.theme='dark';r.style.colorScheme='dark';}else{r.classList.remove('dark');r.dataset.theme='light';r.style.colorScheme='light';}}catch(e){}try{window.addEventListener('wheel',function(e){if(e.ctrlKey){e.preventDefault();}},{passive:false});window.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&(e.key==='+'||e.key==='-'||e.key==='='||e.key==='0')){e.preventDefault();}});document.addEventListener('gesturestart',function(e){e.preventDefault();});document.addEventListener('gesturechange',function(e){e.preventDefault();});document.addEventListener('gestureend',function(e){e.preventDefault();});}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          <PageTransition />
        </AuthProvider>
      </body>
    </html>
  );
}
