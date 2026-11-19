import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import "./globals.css";
import "@/styles/figma-styles.css";
import "@/styles/design-system.css";
import "@/styles/app.css";

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
};

export const metadata: Metadata = {
  title: "Divido",
  description: "Personal budgeting with Divido.",
  icons: {
    icon: [
      { url: "/webp/Logo-flavicon - 250px.webp", type: "image/webp" },
      {
        url: "/webp/logo-icon-dark.webp",
        type: "image/webp",
        media: "(prefers-color-scheme: dark)",
      },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/webp/Logo-flavicon - 250px.webp",
    apple: "/webp/Logo-flavicon - 250px.webp",
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
