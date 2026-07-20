import type { Metadata } from 'next';
import './globals.css';

import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Harry Potter 3D Chatbot',
  description:
    'A cinematic Harry Potter–themed chatbot with a 3D avatar, LangChain, and HeadTTS.',
  applicationName: '3D Avatar Chatbot',
  keywords: [
    'Next.js',
    'LangChain',
    'React Three Fiber',
    'HeadTTS',
    'Harry Potter',
  ],
  authors: [{ name: '3D Avatar Chatbot' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        {children}
      </body>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-KDL5FJ7D3K"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-KDL5FJ7D3K');
        `}
      </Script>
    </html>
  );
}
